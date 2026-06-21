/**
 * FIFO/FEFO stock allocation engine — fungsi murni, tanpa efek samping DB.
 * Implementasi sesuai prd.md §8.2.
 *
 * Cara pakai:
 *   const result = allocateStock(variantBatches, requestedQty, variant.stockMode);
 *   if (!result.fulfilled) throw new Error("Stok tidak mencukupi");
 *   // result.allocations → array {batchId, quantity, hpp} untuk disimpan ke batch_allocations
 *   // result.totalCogs   → total HPP untuk transaksi ini
 */

export type BatchInput = {
  id: string;
  hpp: number;
  remaining: number;
  /** ISO date string "YYYY-MM-DD" atau null bila tidak ada tanggal kadaluarsa */
  expiredDate: string | null;
  /** Dipakai sebagai tie-breaker FIFO: batch diterima lebih awal = diambil duluan */
  receivedAt: Date;
};

export type Allocation = {
  batchId: string;
  quantity: number;
  /** Snapshot HPP batch pada saat alokasi */
  hpp: number;
};

export type AllocationResult = {
  allocations: Allocation[];
  /** Total HPP untuk seluruh qty yang berhasil dialokasikan */
  totalCogs: number;
  /** true jika seluruh requestedQty terpenuhi */
  fulfilled: boolean;
  /** Sisa qty yang tidak bisa dipenuhi (0 jika fulfilled) */
  shortfall: number;
};

export function allocateStock(
  batches: BatchInput[],
  requestedQty: number,
  mode: "fifo" | "fefo" = "fifo",
): AllocationResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validBatches = batches.filter((b) => {
    if (b.remaining <= 0) return false;
    if (b.expiredDate !== null && b.expiredDate !== undefined) {
      const ed = new Date(b.expiredDate);
      ed.setHours(0, 0, 0, 0);
      // Batch kadaluarsa tidak boleh dijual
      if (ed <= today) return false;
    }
    return true;
  });

  const sorted = [...validBatches].sort((a, b) => {
    if (mode === "fefo") {
      // FEFO: ED paling dekat duluan; item tanpa ED → paling akhir
      const aEd = a.expiredDate ? new Date(a.expiredDate).getTime() : Infinity;
      const bEd = b.expiredDate ? new Date(b.expiredDate).getTime() : Infinity;
      if (aEd !== bEd) return aEd - bEd;
    }
    // FIFO (default, juga sebagai tie-breaker FEFO): batch lama duluan
    return a.receivedAt.getTime() - b.receivedAt.getTime();
  });

  const allocations: Allocation[] = [];
  let totalCogs = 0;
  let remaining = requestedQty;

  for (const batch of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remaining, remaining);
    allocations.push({ batchId: batch.id, quantity: take, hpp: batch.hpp });
    totalCogs += take * batch.hpp;
    remaining -= take;
  }

  return {
    allocations,
    totalCogs,
    fulfilled: remaining === 0,
    shortfall: remaining,
  };
}
