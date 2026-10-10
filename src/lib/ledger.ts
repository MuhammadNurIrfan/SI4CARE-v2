import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { ledgerEntries } from "@/lib/db/schema";
import type { LedgerAmounts } from "@/lib/ledger-calc";

/** `db` biasa atau transaksi — keduanya bisa dipakai di sini. */
export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

type Channel = "pos" | "web" | "marketplace";

/**
 * Catat satu entri ledger untuk sebuah transaksi — idempoten per (channel, referenceId).
 *
 * Sebelumnya hanya alur POS yang menulis ke `ledger_entries`: pesanan web yang dibayar lewat
 * Midtrans dan settlement marketplace tidak pernah masuk ledger, sehingga /admin/reports
 * (yang dihitung dari ledger) hanya mencerminkan penjualan POS.
 *
 * Panggil di dalam transaksi yang sama dengan perubahan status transaksi, supaya
 * "uang riil" dan ledger tidak bisa menyimpang. Return `true` bila entri baru dibuat.
 */
export async function recordLedgerOnce(
  ex: DbExecutor,
  entry: { channel: Channel; referenceId: string; refNumber: string; entryDate: string } & LedgerAmounts,
): Promise<boolean> {
  const existing = await ex
    .select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.channel, entry.channel), eq(ledgerEntries.referenceId, entry.referenceId)))
    .limit(1);
  if (existing.length > 0) return false;

  await ex.insert(ledgerEntries).values({
    id: randomUUID(),
    entryDate: entry.entryDate,
    channel: entry.channel,
    referenceId: entry.referenceId,
    refNumber: entry.refNumber,
    totalSales: entry.totalSales.toFixed(2),
    totalHpp: entry.totalHpp.toFixed(2),
    grossMargin: entry.grossMargin.toFixed(2),
  });
  return true;
}

/** Hapus entri ledger suatu transaksi (mis. settlement dibatalkan setelah sempat "selesai"). */
export async function removeLedger(ex: DbExecutor, channel: Channel, referenceId: string): Promise<void> {
  await ex.delete(ledgerEntries).where(and(eq(ledgerEntries.channel, channel), eq(ledgerEntries.referenceId, referenceId)));
}

/** Tanggal (UTC, YYYY-MM-DD) — format yang sama dengan `entryDate` yang ditulis alur POS. */
export function ledgerDate(d: Date = new Date()): string {
  return d.toISOString().split("T")[0];
}
