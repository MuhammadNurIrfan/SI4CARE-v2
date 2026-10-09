"use server";

import { requireAdmin } from "@/lib/server-auth";
import { buildReportData } from "@/lib/reports-query";

// Tipe tetap di-ekspor dari sini supaya importer yang sudah ada tidak berubah.
export type { ReportLedgerRow, MdrRow, ReportSummary } from "@/lib/reports-query";

/**
 * Laporan penjualan/HPP/margin — hanya admin.
 *
 * `reports-client.tsx` memanggil action ini dari sisi klien, jadi ID action-nya
 * ikut ke bundle browser dan endpoint-nya bisa di-POST siapa pun. Tanpa
 * `requireAdmin()` seluruh angka penjualan, HPP, dan margin bisa dibaca anonim.
 * Query-nya sendiri ada di `@/lib/reports-query` agar bisa diuji oleh
 * `scripts/test-reports.ts` di luar request context.
 */
export async function getReportData(
  dateFrom: string,
  dateTo: string,
  channel: string,
) {
  await requireAdmin();
  return buildReportData(dateFrom, dateTo, channel);
}
