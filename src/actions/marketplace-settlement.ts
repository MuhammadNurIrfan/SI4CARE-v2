"use server";

import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { outboundTransactions, outboundItems } from "@/lib/db/schema";

export type MpTrxStatus = "pending" | "dana_masuk" | "selesai";

export type MpTrxRow = {
  id: string;
  noPesanan: string;
  platform: string;
  tanggal: string;
  pembeli: string;
  items: number;
  nilaiBarang: number;
  hpp: number;
  komisi: number;
  mdr: number;
  biayaLayanan: number;
  netDiharapkan: number;
  danaDiterima: number | null;
  status: MpTrxStatus;
};

function mapStatus(
  dbStatus: "completed" | "pending_settlement" | "cancelled",
  settledAmount: string | null,
): MpTrxStatus {
  if (dbStatus === "pending_settlement") {
    return settledAmount != null ? "dana_masuk" : "pending";
  }
  return "selesai";
}

export async function getMarketplaceTxs(filters?: {
  platform?: string;
  status?: string;
  search?: string;
}): Promise<MpTrxRow[]> {
  const rows = await db
    .select({
      id: outboundTransactions.id,
      refNumber: outboundTransactions.refNumber,
      platform: outboundTransactions.platform,
      createdAt: outboundTransactions.createdAt,
      customerName: outboundTransactions.customerName,
      totalAmount: outboundTransactions.totalAmount,
      totalHpp: outboundTransactions.totalHpp,
      marketplaceFees: outboundTransactions.marketplaceFees,
      netAmount: outboundTransactions.netAmount,
      settledAmount: outboundTransactions.settledAmount,
      status: outboundTransactions.status,
    })
    .from(outboundTransactions)
    .where(eq(outboundTransactions.channel, "marketplace"))
    .orderBy(desc(outboundTransactions.createdAt));

  if (rows.length === 0) return [];

  // Batch lookup item count per transaction
  const ids = rows.map((r) => r.id);
  const itemCounts = await db
    .select({
      txId: outboundItems.transactionId,
      cnt: sql<number>`COUNT(*)`,
    })
    .from(outboundItems)
    .where(inArray(outboundItems.transactionId, ids))
    .groupBy(outboundItems.transactionId);

  const cntMap = new Map(itemCounts.map((c) => [c.txId, Number(c.cnt)]));

  return rows
    .filter((r) => r.status !== "cancelled")
    .map((r) => {
      const fees = r.marketplaceFees ?? { platformFee: 0, mdrAmount: 0, serviceFee: 0, shippingReceived: 0, shippingSubsidy: 0, shippingPaid: 0, voucherPlatform: 0, customFees: [] };
      const nilaiBarang = Number(r.totalAmount);
      const komisi = fees.platformFee;
      const mdr = fees.mdrAmount;
      const biayaLayanan = fees.serviceFee;
      const netDiharapkan = Number(r.netAmount);
      const statusUi = mapStatus(r.status, r.settledAmount);

      // Apply filters
      if (filters?.platform && filters.platform !== "semua" && r.platform !== filters.platform) return null;
      if (filters?.status && filters.status !== "semua" && statusUi !== filters.status) return null;
      const q = (filters?.search ?? "").toLowerCase();
      if (q && !r.refNumber.toLowerCase().includes(q) && !(r.customerName ?? "").toLowerCase().includes(q)) return null;

      return {
        id: r.id,
        noPesanan: r.refNumber,
        platform: r.platform ?? "—",
        tanggal: r.createdAt instanceof Date ? r.createdAt.toISOString().slice(0, 10) : String(r.createdAt).slice(0, 10),
        pembeli: r.customerName ?? "—",
        items: cntMap.get(r.id) ?? 0,
        nilaiBarang,
        hpp: Number(r.totalHpp),
        komisi,
        mdr,
        biayaLayanan,
        netDiharapkan,
        danaDiterima: r.settledAmount != null ? Number(r.settledAmount) : null,
        status: statusUi,
      };
    })
    .filter(Boolean) as MpTrxRow[];
}

export async function validateSettlement(
  txId: string,
  settledAmount: number | null,
  newUiStatus: MpTrxStatus,
): Promise<{ ok: boolean }> {
  let dbStatus: "completed" | "pending_settlement" | "cancelled" = "pending_settlement";
  let settledAt: Date | null = null;

  if (newUiStatus === "selesai") {
    dbStatus = "completed";
    settledAt = new Date();
  } else if (newUiStatus === "pending") {
    dbStatus = "pending_settlement";
  } else {
    // dana_masuk: still pending_settlement but settledAmount recorded
    dbStatus = "pending_settlement";
  }

  await db
    .update(outboundTransactions)
    .set({
      status: dbStatus,
      settledAmount: settledAmount != null ? String(settledAmount) : null,
      settledAt: settledAt ?? undefined,
    })
    .where(eq(outboundTransactions.id, txId));

  return { ok: true };
}
