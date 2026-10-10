/**
 * Uji ledger pada settlement marketplace (`applySettlement`).
 *
 * Memverifikasi: status "selesai" menulis tepat satu entri ledger bernilai netAmount; dipanggil ulang tidak
 * menggandakan; dikembalikan ke "pending" menghapus entri (ledger = uang riil); dan id yang BUKAN transaksi
 * marketplace (mis. transaksi POS) ditolak serta tidak berubah. Data uji dibersihkan di akhir.
 *
 * Tidak butuh dev server (langsung ke DB).   Jalankan: npm run test:settlement
 */
import { randomUUID } from "crypto";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledgerEntries, outboundTransactions } from "@/lib/db/schema";
import { applySettlement } from "@/lib/marketplace-settle";

const MARKER = "TEST-SETTLE-";

async function cleanup() {
  const rows = await db.select({ id: outboundTransactions.id }).from(outboundTransactions).where(like(outboundTransactions.refNumber, `${MARKER}%`));
  for (const r of rows) {
    await db.delete(ledgerEntries).where(eq(ledgerEntries.referenceId, r.id));
    await db.delete(outboundTransactions).where(eq(outboundTransactions.id, r.id));
  }
  return rows.length;
}

const ledgerFor = (id: string) =>
  db.select().from(ledgerEntries).where(and(eq(ledgerEntries.channel, "marketplace"), eq(ledgerEntries.referenceId, id)));

async function insertTx(channel: "marketplace" | "pos", ref: string) {
  const id = randomUUID();
  await db.insert(outboundTransactions).values({
    id, channel, refNumber: ref,
    platform: channel === "marketplace" ? "tokopedia" : null,
    subtotal: "1200000", totalAmount: "1200000",
    netAmount: "1040000", // setelah biaya platform
    totalHpp: "820000",
    status: channel === "marketplace" ? "pending_settlement" : "completed",
  });
  return id;
}

async function main() {
  await cleanup();
  const mp = await insertTx("marketplace", `${MARKER}MP`);
  const pos = await insertTx("pos", `${MARKER}POS`);

  const checks: Array<[string, boolean, string]> = [];
  const check = (n: string, ok: boolean, d = "") => checks.push([n, ok, d]);

  check("sebelum settlement: belum ada ledger", (await ledgerFor(mp)).length === 0);

  check("settlement 'completed' berhasil", (await applySettlement(mp, "completed", 1040000)) === true);
  const led = await ledgerFor(mp);
  check("tepat 1 entri ledger marketplace", led.length === 1, `${led.length} entri`);
  check("totalSales = netAmount (1.040.000), bukan totalAmount", Number(led[0]?.totalSales) === 1040000, String(led[0]?.totalSales));
  check("totalHpp = 820.000", Number(led[0]?.totalHpp) === 820000, String(led[0]?.totalHpp));
  check("grossMargin = 220.000", Number(led[0]?.grossMargin) === 220000, String(led[0]?.grossMargin));
  const [row] = await db.select().from(outboundTransactions).where(eq(outboundTransactions.id, mp));
  check("status transaksi = completed & settledAt terisi", row.status === "completed" && row.settledAt !== null, `${row.status}`);

  await applySettlement(mp, "completed", 1040000);
  check("dipanggil ulang: ledger tidak ganda", (await ledgerFor(mp)).length === 1);

  check("kembali ke pending berhasil", (await applySettlement(mp, "pending_settlement", null)) === true);
  check("kembali ke pending: entri ledger dihapus", (await ledgerFor(mp)).length === 0);

  await applySettlement(mp, "completed", 1040000);
  check("selesai lagi: entri ledger muncul lagi (tepat 1)", (await ledgerFor(mp)).length === 1);

  // Id transaksi POS tidak boleh bisa diubah lewat jalur marketplace.
  const rejected = await applySettlement(pos, "pending_settlement", null);
  const [posRow] = await db.select().from(outboundTransactions).where(eq(outboundTransactions.id, pos));
  check("id non-marketplace (POS) ditolak", rejected === false);
  check("transaksi POS tidak berubah (tetap completed)", posRow.status === "completed", posRow.status);
  check("id tidak ada ditolak", (await applySettlement(randomUUID(), "completed", 1)) === false);

  const removed = await cleanup();
  check("cleanup menghapus data uji", removed === 2, `${removed} baris`);
  check("tidak ada ledger tersisa", (await ledgerFor(mp)).length === 0);

  console.log("🧪 Uji ledger settlement marketplace\n");
  let failed = 0;
  for (const [n, ok, d] of checks) {
    console.log(`   ${ok ? "✓" : "✗"} ${n}${ok ? "" : "  → " + d}`);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `\n🎉 Semua ${checks.length} cek LULUS` : `\n❌ ${failed}/${checks.length} cek GAGAL`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error("❌ Error:", e); await cleanup().catch(() => {}); process.exit(1); });
