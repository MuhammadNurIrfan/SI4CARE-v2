/**
 * Perhitungan nilai ledger (buku besar penjualan) — fungsi murni, tanpa DB, supaya bisa diuji unit.
 *
 * Konvensi (mengikuti alur POS di `actions/pos.ts`):
 *  - `totalSales` = nilai BERSIH transaksi; harga sudah termasuk PPN.
 *  - Dicatat saat uang benar-benar riil: web = saat pembayaran terkonfirmasi (webhook),
 *    marketplace = saat settlement selesai, POS = saat transaksi.
 *  - Ongkir bukan pendapatan (titipan kurir) dan `service_fee` tidak dihitung: ia menutup
 *    biaya payment gateway yang tidak dicatat terpisah.
 */

export type BatchAllocation = { batchId: string; qty: number; hpp: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Σ qty × hpp dari alokasi batch (FIFO/FEFO) seluruh item. */
export function sumAllocationHpp(items: Array<{ batchAllocations: BatchAllocation[] | null | undefined }>): number {
  let total = 0;
  for (const item of items) {
    for (const a of item.batchAllocations ?? []) total += a.qty * a.hpp;
  }
  return round2(total);
}

export type LedgerAmounts = { totalSales: number; totalHpp: number; grossMargin: number };

/** Ledger untuk pesanan web: nilai barang setelah diskon (tanpa ongkir & service fee). */
export function computeWebLedger(
  order: { subtotal: string | number; discountAmount: string | number },
  items: Array<{ batchAllocations: BatchAllocation[] | null | undefined }>,
): LedgerAmounts {
  const totalSales = round2(Number(order.subtotal) - Number(order.discountAmount));
  const totalHpp = sumAllocationHpp(items);
  return { totalSales, totalHpp, grossMargin: round2(totalSales - totalHpp) };
}

/** Ledger untuk transaksi marketplace yang sudah settlement: nilai bersih setelah biaya platform. */
export function computeMarketplaceLedger(tx: { netAmount: string | number; totalHpp: string | number }): LedgerAmounts {
  const totalSales = round2(Number(tx.netAmount));
  const totalHpp = round2(Number(tx.totalHpp));
  return { totalSales, totalHpp, grossMargin: round2(totalSales - totalHpp) };
}
