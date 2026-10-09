/**
 * Uji /admin/reports dengan transaksi POS nyata.
 *
 * Membuat 3 transaksi POS (tunai / qris / kartu_kredit) memakai fungsi asli
 * (`allocateStock`, `calcCartTotals`) lalu menjalankan `getReportData` yang
 * sebenarnya, dan membandingkan hasilnya dengan nilai yang dihitung independen.
 *
 * Idempotent: transaksi uji ditandai notes="TEST-REPORTS" dan dibersihkan
 * (stok batch dipulihkan) setiap kali script dijalankan ulang.
 *
 * Jalankan di jaringan yang bisa menjangkau Supabase:
 *   npm run test:reports          # uji + verifikasi (transaksi uji tertinggal di DB)
 *   npm run test:reports:clean    # hanya bersihkan transaksi uji — jalankan sebelum demo
 */
import { randomUUID } from "crypto";
import { and, asc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { variants, batches, outboundTransactions, outboundItems, ledgerEntries } from "@/lib/db/schema";
import { allocateStock, type BatchInput } from "@/lib/utils/stockAllocation";
import { calcCartTotals, type PosCartItem } from "@/lib/pos-calc";
import { buildReportData } from "@/lib/reports-query";

const MARKER = "TEST-REPORTS";
const rp = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
const round2 = (n: number) => Math.round(n * 100) / 100;

type Allocation = { batchId: string; qty: number; hpp: number };

// ── Bersihkan transaksi uji sebelumnya (pulihkan stok) ───────────────────────
async function cleanup() {
  const prior = await db
    .select({ id: outboundTransactions.id })
    .from(outboundTransactions)
    .where(eq(outboundTransactions.notes, MARKER));
  if (prior.length === 0) return 0;

  const txIds = prior.map((t) => t.id);
  const items = await db
    .select({ batchAllocations: outboundItems.batchAllocations })
    .from(outboundItems)
    .where(inArray(outboundItems.transactionId, txIds));

  // Pulihkan stok batch
  for (const it of items) {
    for (const a of (it.batchAllocations ?? []) as Allocation[]) {
      const [b] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, a.batchId)).limit(1);
      if (b) await db.update(batches).set({ remaining: b.remaining + a.qty }).where(eq(batches.id, a.batchId));
    }
  }

  await db.delete(ledgerEntries).where(inArray(ledgerEntries.referenceId, txIds));
  await db.delete(outboundItems).where(inArray(outboundItems.transactionId, txIds));
  await db.delete(outboundTransactions).where(inArray(outboundTransactions.id, txIds));
  return prior.length;
}

// ── Buat satu transaksi POS (meniru savePosTransaction tanpa auth gate) ──────
async function createPosTx(
  label: string,
  paymentMethod: string,
  picks: Array<{ variantId: string; name: string; sku: string; price: number; qty: number }>,
) {
  const cartForCalc: PosCartItem[] = [];
  const itemAllocs: Array<{
    variantId: string; productName: string; sku: string; qty: number;
    unitPrice: number; unitHpp: number; allocations: Allocation[]; totalCogs: number;
  }> = [];

  for (const item of picks) {
    const [variantRow] = await db.select({ stockMode: variants.stockMode }).from(variants).where(eq(variants.id, item.variantId)).limit(1);
    if (!variantRow) throw new Error(`Varian tidak ditemukan: ${item.variantId}`);

    const batchRows = await db
      .select({ id: batches.id, hpp: batches.hpp, remaining: batches.remaining, expiredDate: batches.expiredDate, receivedAt: batches.receivedAt })
      .from(batches)
      .where(and(eq(batches.variantId, item.variantId), gt(batches.remaining, 0)));

    const batchInputs: BatchInput[] = batchRows.map((b) => ({
      id: b.id, hpp: parseFloat(b.hpp), remaining: b.remaining, expiredDate: b.expiredDate, receivedAt: b.receivedAt,
    }));

    const result = allocateStock(batchInputs, item.qty, variantRow.stockMode);
    if (!result.fulfilled) throw new Error(`Stok tidak cukup: ${item.name} (kurang ${result.shortfall})`);
    const avgHpp = result.totalCogs / item.qty;

    cartForCalc.push({ id: item.variantId, name: item.name, sku: item.sku, price: item.price, hpp: avgHpp, qty: item.qty, disc: 0, discType: "rp" });
    itemAllocs.push({
      variantId: item.variantId, productName: item.name, sku: item.sku, qty: item.qty,
      unitPrice: item.price, unitHpp: avgHpp,
      allocations: result.allocations.map((a) => ({ batchId: a.batchId, qty: a.quantity, hpp: a.hpp })),
      totalCogs: result.totalCogs,
    });
  }

  const totals = calcCartTotals(cartForCalc, 0, "rp", paymentMethod);
  const totalHpp = itemAllocs.reduce((s, i) => s + i.totalCogs, 0);
  const txId = randomUUID();
  const refNumber = `POS-${String(Date.now()).slice(-6)}`;
  const today = new Date().toISOString().split("T")[0];

  await db.insert(outboundTransactions).values({
    id: txId, channel: "pos", refNumber, paymentMethod, cashReceived: null,
    subtotal: String(totals.gross), itemDiscountTotal: String(totals.itemDiscTotal),
    cartDiscountAmount: String(totals.cartDiscValue), totalDiscount: String(totals.totalDisc),
    dpp: String(totals.dpp), ppn: String(totals.ppn), mdrAmount: String(totals.mdrAmount),
    totalAmount: String(totals.total), netAmount: String(totals.netAmount), totalHpp: String(totalHpp),
    status: "completed", notes: MARKER, createdBy: null,
  });

  for (const item of itemAllocs) {
    await db.insert(outboundItems).values({
      id: randomUUID(), transactionId: txId, variantId: item.variantId, productName: item.productName,
      sku: item.sku, quantity: item.qty, unitPrice: String(item.unitPrice), unitHpp: String(item.unitHpp),
      itemDiscountAmount: "0", batchAllocations: item.allocations,
    });
    for (const a of item.allocations) {
      const [b] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, a.batchId)).limit(1);
      if (b) await db.update(batches).set({ remaining: b.remaining - a.qty }).where(eq(batches.id, a.batchId));
    }
  }

  await db.insert(ledgerEntries).values({
    id: randomUUID(), entryDate: today, channel: "pos", referenceId: txId, refNumber,
    totalSales: String(totals.netAmount), totalHpp: String(totalHpp), grossMargin: String(totals.grossMargin),
  });

  // Ekspektasi disimpan dalam nilai yang sudah dibulatkan 2 desimal (seperti numeric(15,2) di DB)
  return {
    label, paymentMethod, refNumber,
    netAmount: round2(totals.netAmount), mdrAmount: round2(totals.mdrAmount),
    grossMargin: round2(totals.grossMargin), totalHpp: round2(totalHpp),
    items: picks.map((p) => ({ name: p.name, qty: p.qty })),
  };
}

async function main() {
  // `--clean`: hanya hapus transaksi uji lalu keluar. Dipakai sebelum demo,
  // supaya angka uji tidak ikut muncul di /admin/reports.
  if (process.argv.includes("--clean")) {
    const n = await cleanup();
    console.log(n > 0
      ? `🧹 ${n} transaksi uji dihapus (stok dipulihkan).`
      : "✨ Tidak ada transaksi uji yang tertinggal.");
    process.exit(0);
  }

  console.log("🧪 Uji /admin/reports dengan transaksi POS nyata\n");

  const removed = await cleanup();
  if (removed > 0) console.log(`🧹 Membersihkan ${removed} transaksi uji sebelumnya (stok dipulihkan)\n`);

  const today = new Date().toISOString().split("T")[0];

  // Ambil 3 varian ber-stok yang masih layak jual.
  // `remaining > 5` saja tidak cukup: `allocateStock` membuang batch kadaluarsa
  // (lihat stockAllocation.ts) — seed sengaja memuat satu batch expired untuk
  // menguji alarm, dan tanpa filter ini script bisa memilihnya lalu gagal.
  // `orderBy` menjaga pilihan tetap sama tiap run (tanpa itu urutan Postgres bebas).
  const stockRows = await db
    .select({ variantId: batches.variantId })
    .from(batches)
    .where(and(
      gt(batches.remaining, 5),
      or(isNull(batches.expiredDate), gt(batches.expiredDate, today)),
    ))
    .orderBy(asc(batches.variantId));
  const uniqVariantIds = [...new Set(stockRows.map((r) => r.variantId))].slice(0, 3);
  if (uniqVariantIds.length < 3) throw new Error("Butuh minimal 3 varian ber-stok belum kadaluarsa. Jalankan `npm run db:seed` dulu.");

  const picks = await db
    .select({ id: variants.id, sku: variants.sku, price: variants.activePrice })
    .from(variants)
    .where(inArray(variants.id, uniqVariantIds));

  const [p0, p1, p2] = picks;
  const expected = [
    await createPosTx("TX1 tunai",        "tunai",        [{ variantId: p0.id, name: `Produk ${p0.sku}`, sku: p0.sku, price: parseFloat(p0.price), qty: 2 }]),
    await createPosTx("TX2 qris",         "qris",         [{ variantId: p1.id, name: `Produk ${p1.sku}`, sku: p1.sku, price: parseFloat(p1.price), qty: 1 }]),
    await createPosTx("TX3 kartu_kredit", "kartu_kredit", [{ variantId: p2.id, name: `Produk ${p2.sku}`, sku: p2.sku, price: parseFloat(p2.price), qty: 3 }]),
  ];

  console.log("📝 Transaksi dibuat:");
  for (const e of expected) console.log(`   ${e.label.padEnd(16)} ${e.refNumber}  net ${rp(e.netAmount).padStart(12)}  MDR ${rp(e.mdrAmount)}`);

  // ── Jalankan query laporan yang sebenarnya ──────────────────────────────────
  const report = await buildReportData(today, today, "semua");

  // ── Verifikasi ──────────────────────────────────────────────────────────────
  const expSales  = round2(expected.reduce((s, e) => s + e.netAmount, 0));
  const expHpp    = round2(expected.reduce((s, e) => s + e.totalHpp, 0));
  const expMargin = round2(expected.reduce((s, e) => s + e.grossMargin, 0));
  const near = (a: number, b: number) => Math.abs(a - b) <= expected.length; // toleransi pembulatan ≤ Rp3

  const checks: Array<[string, boolean, string]> = [];
  checks.push(["Jumlah transaksi = 3", report.txCount === 3, `report.txCount = ${report.txCount}`]);
  checks.push(["Channel POS count = 3", report.byChannel.some((c) => c.channel === "pos" && c.count === 3), `byChannel = ${JSON.stringify(report.byChannel)}`]);
  checks.push(["Total penjualan cocok", near(report.totalSales, expSales), `report ${rp(report.totalSales)} vs ekspektasi ${rp(expSales)}`]);
  checks.push(["Total HPP cocok", near(report.totalHpp, expHpp), `report ${rp(report.totalHpp)} vs ekspektasi ${rp(expHpp)}`]);
  checks.push(["Gross margin cocok", near(report.grossMargin, expMargin), `report ${rp(report.grossMargin)} vs ekspektasi ${rp(expMargin)}`]);
  checks.push(["Baris ledger = 3", report.ledgerRows.length === 3, `ledgerRows.length = ${report.ledgerRows.length}`]);

  // MDR per metode
  for (const e of expected) {
    const labelMap: Record<string, string> = { tunai: "Tunai", qris: "QRIS", kartu_kredit: "Kartu Kredit" };
    const row = report.mdrRows.find((m) => m.metode === labelMap[e.paymentMethod]);
    checks.push([
      `MDR ${labelMap[e.paymentMethod]} cocok`,
      !!row && near(row.mdrAmount, e.mdrAmount),
      row ? `report ${rp(row.mdrAmount)} vs ekspektasi ${rp(e.mdrAmount)}` : "baris MDR tidak ditemukan",
    ]);
  }

  console.log("\n📊 Ringkasan laporan:");
  console.log(`   Total penjualan : ${rp(report.totalSales)}`);
  console.log(`   Total HPP       : ${rp(report.totalHpp)}`);
  console.log(`   Gross margin    : ${rp(report.grossMargin)}`);
  console.log(`   Transaksi       : ${report.txCount}`);
  console.log(`   Produk terlaris : ${report.topProducts.map((p) => `${p.nama} (${p.terjual})`).join(", ") || "—"}`);
  console.log(`   Tren bulanan    : ${report.monthlyTrend.map((m) => `${m.label}:${Math.round(m.omzet)}`).join(" ")}`);

  console.log("\n✅ Verifikasi:");
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`   ${ok ? "✓" : "✗"} ${name.padEnd(28)} ${ok ? "" : "→ " + detail}`);
    if (!ok) failed++;
  }

  console.log(failed === 0
    ? `\n🎉 Semua ${checks.length} cek LULUS — query laporan menghasilkan angka yang benar.`
    : `\n❌ ${failed}/${checks.length} cek GAGAL — lihat detail di atas.`);

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error("❌ Error:", e); process.exit(1); });
