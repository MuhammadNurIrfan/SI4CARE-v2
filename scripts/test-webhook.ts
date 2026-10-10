/**
 * Uji webhook pembayaran Midtrans (`/api/payment/notification`) end-to-end.
 *
 * Membuat order uji berstatus pending_payment, mengirim webhook BERTANDA TANGAN ke dev server,
 * lalu memverifikasi: order jadi paid, stok batch terpotong tepat sekali, entri ledger web terbentuk
 * dengan nilai yang benar, pengiriman ulang tidak menggandakan apa pun, dan tanda tangan salah ditolak.
 * Semua data uji dibersihkan di akhir (stok dipulihkan).
 *
 * Prasyarat: `npm run dev` berjalan, DB terjangkau.   Jalankan: npm run test:webhook
 */
import { createHash, randomUUID } from "crypto";
import { and, eq, gt, like, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { batches, ledgerEntries, orderItems, orders, variants } from "@/lib/db/schema";

const BASE = process.env.WEBHOOK_TEST_BASE_URL ?? "http://localhost:3000";
const MARKER = "TEST-WEBHOOK-";
const QTY = 2;

const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
const sign = (orderId: string, statusCode: string, gross: string) =>
  createHash("sha512").update(`${orderId}${statusCode}${gross}${serverKey}`).digest("hex");

async function post(body: Record<string, string>) {
  const r = await fetch(`${BASE}/api/payment/notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: (await r.json().catch(() => ({}))) as Record<string, unknown> };
}

async function cleanup() {
  const old = await db.select({ id: orders.id }).from(orders).where(like(orders.midtransOrderId, `${MARKER}%`));
  for (const o of old) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    // Pulihkan stok HANYA bila webhook sempat memotongnya (order sudah paid).
    const [ord] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, o.id));
    if (ord?.status === "paid") {
      for (const it of items) {
        for (const a of (it.batchAllocations ?? []) as { batchId: string; qty: number }[]) {
          const [b] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, a.batchId));
          if (b) await db.update(batches).set({ remaining: b.remaining + a.qty }).where(eq(batches.id, a.batchId));
        }
      }
    }
    await db.delete(ledgerEntries).where(and(eq(ledgerEntries.channel, "web"), eq(ledgerEntries.referenceId, o.id)));
    await db.delete(orders).where(eq(orders.id, o.id)); // order_items ikut terhapus (CASCADE)
  }
  return old.length;
}

async function main() {
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY kosong — tidak bisa menandatangani webhook uji");

  const removed = await cleanup();
  if (removed > 0) console.log(`🧹 ${removed} order uji sisa dibersihkan\n`);

  // Batch layak jual: stok cukup dan belum kedaluwarsa.
  const today = new Date().toISOString().split("T")[0];
  const [batch] = await db
    .select({ id: batches.id, variantId: batches.variantId, hpp: batches.hpp, remaining: batches.remaining })
    .from(batches)
    .where(and(gt(batches.remaining, QTY + 3), or(isNull(batches.expiredDate), gt(batches.expiredDate, today))))
    .limit(1);
  if (!batch) throw new Error("Tidak ada batch ber-stok. Jalankan `npm run db:seed`.");
  const [variant] = await db.select({ sku: variants.sku }).from(variants).where(eq(variants.id, batch.variantId));

  const orderId = randomUUID();
  const midtransId = `${MARKER}${Date.now()}`;
  const unitPrice = 100000;
  const subtotal = unitPrice * QTY;
  const discount = 20000;
  const shipping = 15000;
  const serviceFee = 4500;
  const gross = subtotal - discount + shipping + serviceFee;
  const hpp = Number(batch.hpp);

  await db.insert(orders).values({
    id: orderId,
    status: "pending_payment",
    snapAddress: { name: "Uji Webhook", phone: "0800", address: "Jl. Uji", city: "BANDUNG" },
    shippingCost: String(shipping),
    subtotal: String(subtotal),
    discountAmount: String(discount),
    serviceFee: String(serviceFee),
    totalAmount: String(gross),
    midtransOrderId: midtransId,
  });
  await db.insert(orderItems).values({
    id: randomUUID(),
    orderId,
    variantId: batch.variantId,
    productName: "Produk Uji Webhook",
    sku: variant?.sku ?? "TEST",
    quantity: QTY,
    unitPrice: String(unitPrice),
    batchAllocations: [{ batchId: batch.id, qty: QTY, hpp }],
  });

  const grossStr = `${gross}.00`;
  const notif = (over: Partial<Record<string, string>> = {}) => ({
    order_id: midtransId, status_code: "200", gross_amount: grossStr,
    transaction_status: "settlement", payment_type: "qris",
    signature_key: sign(midtransId, "200", grossStr), ...over,
  });

  const checks: Array<[string, boolean, string]> = [];
  const check = (name: string, ok: boolean, detail = "") => checks.push([name, ok, detail]);

  // 1. Tanda tangan salah → ditolak
  const bad = await post(notif({ signature_key: "x".repeat(128) }));
  check("tanda tangan salah ditolak (403)", bad.status === 403, `status ${bad.status}`);

  // 2. Webhook sukses pertama
  const stockBefore = batch.remaining;
  const first = await post(notif());
  check("webhook sah diterima (200, tidak skipped)", first.status === 200 && !first.json.skipped, JSON.stringify(first));

  const [ord] = await db.select().from(orders).where(eq(orders.id, orderId));
  check("order berubah paid", ord?.status === "paid", `status ${ord?.status}`);
  check("metode bayar tercatat", ord?.paymentMethod === "qris", String(ord?.paymentMethod));

  const [b1] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, batch.id));
  check(`stok terpotong tepat ${QTY}`, b1.remaining === stockBefore - QTY, `${stockBefore} → ${b1.remaining}`);

  const led = await db.select().from(ledgerEntries).where(and(eq(ledgerEntries.channel, "web"), eq(ledgerEntries.referenceId, orderId)));
  const expSales = subtotal - discount;
  const expHpp = hpp * QTY;
  check("tepat 1 entri ledger web", led.length === 1, `${led.length} entri`);
  check(`ledger totalSales = subtotal − diskon (${expSales}), tanpa ongkir/service fee`, Number(led[0]?.totalSales) === expSales, String(led[0]?.totalSales));
  check(`ledger totalHpp = ${expHpp}`, Number(led[0]?.totalHpp) === expHpp, String(led[0]?.totalHpp));
  check(`ledger grossMargin = ${expSales - expHpp}`, Number(led[0]?.grossMargin) === expSales - expHpp, String(led[0]?.grossMargin));

  // 3. Kirim ulang (Midtrans mengulang notifikasi) → tidak menggandakan apa pun
  const again = await post(notif());
  check("pengiriman ulang di-skip", again.status === 200 && again.json.skipped === true, JSON.stringify(again));
  const [b2] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, batch.id));
  check("stok TIDAK terpotong dua kali", b2.remaining === stockBefore - QTY, `${stockBefore} → ${b2.remaining}`);
  const led2 = await db.select({ id: ledgerEntries.id }).from(ledgerEntries).where(and(eq(ledgerEntries.channel, "web"), eq(ledgerEntries.referenceId, orderId)));
  check("ledger TIDAK ganda", led2.length === 1, `${led2.length} entri`);

  // 4. Dua pengiriman BERSAMAAN untuk order lain → hanya satu yang diproses (klaim atomik)
  const orderId2 = randomUUID();
  const midtransId2 = `${MARKER}${Date.now()}-b`;
  await db.insert(orders).values({
    id: orderId2, status: "pending_payment",
    snapAddress: { name: "Uji", phone: "0800", address: "Jl. Uji", city: "BANDUNG" },
    shippingCost: "0", subtotal: String(unitPrice), discountAmount: "0", totalAmount: String(unitPrice + serviceFee),
    midtransOrderId: midtransId2,
  });
  await db.insert(orderItems).values({
    id: randomUUID(), orderId: orderId2, variantId: batch.variantId, productName: "Produk Uji 2",
    sku: variant?.sku ?? "TEST", quantity: 1, unitPrice: String(unitPrice),
    batchAllocations: [{ batchId: batch.id, qty: 1, hpp }],
  });
  const g2 = `${unitPrice + serviceFee}.00`;
  const n2 = { order_id: midtransId2, status_code: "200", gross_amount: g2, transaction_status: "settlement", payment_type: "qris", signature_key: sign(midtransId2, "200", g2) };
  const stockBeforeRace = (await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, batch.id)))[0].remaining;
  const race = await Promise.all([post(n2), post(n2), post(n2)]);
  const processedCount = race.filter((r) => r.status === 200 && !r.json.skipped).length;
  check("3 webhook bersamaan → tepat 1 diproses", processedCount === 1, race.map((r) => JSON.stringify(r.json)).join(" | "));
  const [b3] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, batch.id));
  check("balapan: stok terpotong tepat 1", b3.remaining === stockBeforeRace - 1, `${stockBeforeRace} → ${b3.remaining}`);
  const led3 = await db.select({ id: ledgerEntries.id }).from(ledgerEntries).where(and(eq(ledgerEntries.channel, "web"), eq(ledgerEntries.referenceId, orderId2)));
  check("balapan: ledger tepat 1", led3.length === 1, `${led3.length} entri`);

  // Bersihkan + pastikan stok pulih ke nilai awal
  await cleanup();
  const [bEnd] = await db.select({ remaining: batches.remaining }).from(batches).where(eq(batches.id, batch.id));
  check("stok pulih ke nilai awal setelah cleanup", bEnd.remaining === stockBefore, `${stockBefore} → ${bEnd.remaining}`);

  console.log("🧪 Uji webhook pembayaran Midtrans\n");
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`   ${ok ? "✓" : "✗"} ${name}${ok ? "" : "  → " + detail}`);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `\n🎉 Semua ${checks.length} cek LULUS` : `\n❌ ${failed}/${checks.length} cek GAGAL`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error("❌ Error:", e); await cleanup().catch(() => {}); process.exit(1); });
