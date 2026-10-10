import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { outboundTransactions } from "@/lib/db/schema";
import { ledgerDate, recordLedgerOnce, removeLedger } from "@/lib/ledger";
import { computeMarketplaceLedger } from "@/lib/ledger-calc";

export type SettlementStatus = "completed" | "pending_settlement" | "cancelled";

/**
 * Terapkan status settlement ke satu transaksi marketplace dan jaga ledger tetap sinkron,
 * dalam satu transaksi database.
 *
 * Ledger = uang riil: entri ada selama (dan hanya selama) status "completed", dicatat pada
 * tanggal settlement (basis kas), bukan tanggal pesanan dibuat.
 *
 * Tanpa pengecekan auth — dipanggil oleh server action `validateSettlement` (yang me-guard
 * requireAdmin) dan oleh skrip uji di luar request context.
 * Return false bila id bukan transaksi marketplace (dulu id apa pun, termasuk transaksi POS,
 * bisa diubah lewat jalur ini).
 */
export async function applySettlement(
  txId: string,
  status: SettlementStatus,
  settledAmount: number | null,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(outboundTransactions)
      .set({
        status,
        settledAmount: settledAmount != null ? String(settledAmount) : null,
        settledAt: status === "completed" ? new Date() : undefined,
      })
      .where(and(eq(outboundTransactions.id, txId), eq(outboundTransactions.channel, "marketplace")))
      .returning({
        id: outboundTransactions.id,
        refNumber: outboundTransactions.refNumber,
        netAmount: outboundTransactions.netAmount,
        totalHpp: outboundTransactions.totalHpp,
      });
    if (!row) return false;

    if (status === "completed") {
      await recordLedgerOnce(tx, {
        channel: "marketplace",
        referenceId: row.id,
        refNumber: row.refNumber,
        entryDate: ledgerDate(),
        ...computeMarketplaceLedger(row),
      });
    } else {
      await removeLedger(tx, "marketplace", row.id);
    }
    return true;
  });
}
