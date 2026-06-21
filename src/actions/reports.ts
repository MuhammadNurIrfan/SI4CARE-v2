"use server";

import { db } from "@/lib/db";
import {
  ledgerEntries, outboundTransactions, outboundItems, orderItems, orders,
} from "@/lib/db/schema";
import { and, gte, lte, eq, desc, sql, inArray } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportLedgerRow = {
  id: string;
  tgl: string;
  channel: "pos" | "web" | "marketplace";
  refNumber: string;
  produk: string;
  totalSales: number;
  totalHpp: number;
  grossMargin: number;
};

export type MdrRow = {
  metode: string;
  vol: number;
  totalAmount: number;
  mdrAmount: number;
  mdrRate: number;
  isMarketplace?: boolean;
};

export type ReportSummary = {
  totalSales: number;
  totalHpp: number;
  grossMargin: number;
  txCount: number;
  byChannel: { channel: string; sales: number; count: number }[];
  monthlyTrend: { label: string; omzet: number }[];
  dailyCount: { hari: string; jumlah: number }[];
  topProducts: { nama: string; terjual: number; omzet: number }[];
  ledgerRows: ReportLedgerRow[];
  mdrRows: MdrRow[];
  riilAmount: number;
  pendingAmount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  tunai: "Tunai", transfer: "Transfer Bank", qris: "QRIS",
  kartu_debit: "Kartu Debit", kartu_kredit: "Kartu Kredit",
};

const MDR_RATES: Record<string, number> = {
  tunai: 0, transfer: 0, qris: 0.7, kartu_debit: 1.0, kartu_kredit: 2.5,
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const DAY_NAMES    = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function getReportData(
  dateFrom: string,
  dateTo: string,
  channel: string,
): Promise<ReportSummary> {
  const chFilter =
    channel !== "semua"
      ? eq(ledgerEntries.channel, channel as "pos" | "web" | "marketplace")
      : undefined;

  // ── 1. Channel summary → KPI totals + pie chart ───────────────────────────
  const channelSummary = await db
    .select({
      channel: ledgerEntries.channel,
      sales:  sql<string>`CAST(SUM(${ledgerEntries.totalSales})  AS CHAR)`,
      hpp:    sql<string>`CAST(SUM(${ledgerEntries.totalHpp})    AS CHAR)`,
      margin: sql<string>`CAST(SUM(${ledgerEntries.grossMargin}) AS CHAR)`,
      count:  sql<number>`COUNT(*)`,
    })
    .from(ledgerEntries)
    .where(and(gte(ledgerEntries.entryDate, dateFrom), lte(ledgerEntries.entryDate, dateTo), chFilter))
    .groupBy(ledgerEntries.channel);

  const totalSales  = channelSummary.reduce((s, r) => s + parseFloat(r.sales  || "0"), 0);
  const totalHpp    = channelSummary.reduce((s, r) => s + parseFloat(r.hpp    || "0"), 0);
  const grossMargin = channelSummary.reduce((s, r) => s + parseFloat(r.margin || "0"), 0);
  const txCount     = channelSummary.reduce((s, r) => s + r.count, 0);
  const byChannel   = channelSummary.map(r => ({ channel: r.channel, sales: parseFloat(r.sales || "0"), count: r.count }));

  // ── 2. Monthly trend (selalu 6 bulan terakhir) ───────────────────────────
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  const monthlyRaw = await db
    .select({
      ym:    sql<string>`DATE_FORMAT(${ledgerEntries.entryDate}, '%Y-%m')`,
      omzet: sql<string>`CAST(SUM(${ledgerEntries.totalSales}) AS CHAR)`,
    })
    .from(ledgerEntries)
    .where(gte(ledgerEntries.entryDate, sixMonthsAgoStr))
    .groupBy(sql`DATE_FORMAT(${ledgerEntries.entryDate}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${ledgerEntries.entryDate}, '%Y-%m')`);

  const monthlyMap = new Map(monthlyRaw.map(r => [r.ym, parseFloat(r.omzet || "0")]));
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label: MONTH_LABELS[d.getMonth()], omzet: monthlyMap.get(ym) ?? 0 };
  });

  // ── 3. Transaksi harian (7 hari terakhir) ─────────────────────────────────
  const sevenDaysAgoStr = toDateStr((() => { const d = new Date(); d.setDate(d.getDate() - 6); return d; })());
  const dailyRaw = await db
    .select({ tgl: ledgerEntries.entryDate, jumlah: sql<number>`COUNT(*)` })
    .from(ledgerEntries)
    .where(gte(ledgerEntries.entryDate, sevenDaysAgoStr))
    .groupBy(ledgerEntries.entryDate)
    .orderBy(ledgerEntries.entryDate);

  const dailyMap = new Map(dailyRaw.map(r => [r.tgl, r.jumlah]));
  const dailyCount = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { hari: DAY_NAMES[d.getDay()], jumlah: dailyMap.get(toDateStr(d)) ?? 0 };
  });

  // ── 4. Produk terlaris (outbound_items + order_items) ─────────────────────
  const [topOutbound, topOrders] = await Promise.all([
    db.select({
      productName: outboundItems.productName,
      totalQty:   sql<number>`CAST(SUM(${outboundItems.quantity}) AS SIGNED)`,
      totalSales: sql<string>`CAST(SUM(CAST(${outboundItems.unitPrice} AS DECIMAL(15,2)) * ${outboundItems.quantity}) AS CHAR)`,
    })
    .from(outboundItems)
    .innerJoin(outboundTransactions, eq(outboundItems.transactionId, outboundTransactions.id))
    .where(and(
      eq(outboundTransactions.status, "completed"),
      gte(sql`DATE(${outboundTransactions.createdAt})`, dateFrom),
      lte(sql`DATE(${outboundTransactions.createdAt})`, dateTo),
    ))
    .groupBy(outboundItems.productName)
    .orderBy(sql`SUM(CAST(${outboundItems.unitPrice} AS DECIMAL(15,2)) * ${outboundItems.quantity}) DESC`)
    .limit(10),

    db.select({
      productName: orderItems.productName,
      totalQty:   sql<number>`CAST(SUM(${orderItems.quantity}) AS SIGNED)`,
      totalSales: sql<string>`CAST(SUM(CAST(${orderItems.unitPrice} AS DECIMAL(15,2)) * ${orderItems.quantity}) AS CHAR)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      inArray(orders.status, ["paid", "processing", "shipped", "delivered"]),
      gte(sql`DATE(${orders.createdAt})`, dateFrom),
      lte(sql`DATE(${orders.createdAt})`, dateTo),
    ))
    .groupBy(orderItems.productName)
    .orderBy(sql`SUM(CAST(${orderItems.unitPrice} AS DECIMAL(15,2)) * ${orderItems.quantity}) DESC`)
    .limit(10),
  ]);

  const prodAgg = new Map<string, { terjual: number; omzet: number }>();
  for (const r of [...topOutbound, ...topOrders]) {
    const prev = prodAgg.get(r.productName) ?? { terjual: 0, omzet: 0 };
    prodAgg.set(r.productName, { terjual: prev.terjual + r.totalQty, omzet: prev.omzet + parseFloat(r.totalSales || "0") });
  }
  const topProducts = [...prodAgg.entries()]
    .map(([nama, d]) => ({ nama, ...d }))
    .sort((a, b) => b.omzet - a.omzet)
    .slice(0, 5);

  // ── 5. Rincian ledger rows ─────────────────────────────────────────────────
  const ledgerRaw = await db
    .select({
      id:          ledgerEntries.id,
      entryDate:   ledgerEntries.entryDate,
      channel:     ledgerEntries.channel,
      referenceId: ledgerEntries.referenceId,
      refNumber:   ledgerEntries.refNumber,
      totalSales:  ledgerEntries.totalSales,
      totalHpp:    ledgerEntries.totalHpp,
      grossMargin: ledgerEntries.grossMargin,
    })
    .from(ledgerEntries)
    .where(and(gte(ledgerEntries.entryDate, dateFrom), lte(ledgerEntries.entryDate, dateTo), chFilter))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(100);

  const posMpRefIds = ledgerRaw.filter(r => r.channel !== "web").map(r => r.referenceId);
  const webRefIds   = ledgerRaw.filter(r => r.channel === "web").map(r => r.referenceId);
  const prodMap: Record<string, string> = {};

  if (posMpRefIds.length > 0) {
    const items = await db.select({ txId: outboundItems.transactionId, name: outboundItems.productName, qty: outboundItems.quantity })
      .from(outboundItems).where(inArray(outboundItems.transactionId, posMpRefIds));
    const grp: Record<string, string[]> = {};
    for (const it of items) (grp[it.txId] ??= []).push(`${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""}`);
    for (const [k, v] of Object.entries(grp))
      prodMap[k] = v.slice(0, 2).join(", ") + (v.length > 2 ? ` +${v.length - 2}` : "");
  }
  if (webRefIds.length > 0) {
    const items = await db.select({ ordId: orderItems.orderId, name: orderItems.productName, qty: orderItems.quantity })
      .from(orderItems).where(inArray(orderItems.orderId, webRefIds));
    const grp: Record<string, string[]> = {};
    for (const it of items) (grp[it.ordId] ??= []).push(`${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""}`);
    for (const [k, v] of Object.entries(grp))
      prodMap[k] = v.slice(0, 2).join(", ") + (v.length > 2 ? ` +${v.length - 2}` : "");
  }

  const ledgerRows: ReportLedgerRow[] = ledgerRaw.map(r => {
    const d = new Date(r.entryDate + "T12:00:00");
    const tgl = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      id: r.id, tgl, channel: r.channel, refNumber: r.refNumber,
      produk: prodMap[r.referenceId] || r.refNumber,
      totalSales: parseFloat(r.totalSales), totalHpp: parseFloat(r.totalHpp), grossMargin: parseFloat(r.grossMargin),
    };
  });

  // ── 6. MDR per metode pembayaran ──────────────────────────────────────────
  const [mdrPosRaw, mdrMpRaw] = await Promise.all([
    db.select({
      pm: outboundTransactions.paymentMethod,
      vol: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`CAST(SUM(${outboundTransactions.totalAmount}) AS CHAR)`,
      mdrAmount:   sql<string>`CAST(SUM(${outboundTransactions.mdrAmount}) AS CHAR)`,
    }).from(outboundTransactions)
      .where(and(
        eq(outboundTransactions.channel, "pos"),
        gte(sql`DATE(${outboundTransactions.createdAt})`, dateFrom),
        lte(sql`DATE(${outboundTransactions.createdAt})`, dateTo),
      ))
      .groupBy(outboundTransactions.paymentMethod),

    db.select({
      platform: outboundTransactions.platform,
      vol: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`CAST(SUM(${outboundTransactions.totalAmount}) AS CHAR)`,
      fees:        sql<string>`CAST(SUM(${outboundTransactions.totalAmount} - ${outboundTransactions.netAmount}) AS CHAR)`,
    }).from(outboundTransactions)
      .where(and(
        eq(outboundTransactions.channel, "marketplace"),
        eq(outboundTransactions.status, "completed"),
        gte(sql`DATE(${outboundTransactions.createdAt})`, dateFrom),
        lte(sql`DATE(${outboundTransactions.createdAt})`, dateTo),
      ))
      .groupBy(outboundTransactions.platform),
  ]);

  const mdrRows: MdrRow[] = [
    ...mdrPosRaw.filter(r => r.pm).map(r => ({
      metode: METHOD_LABELS[r.pm!] ?? r.pm!,
      vol: r.vol, totalAmount: parseFloat(r.totalAmount || "0"),
      mdrAmount: parseFloat(r.mdrAmount || "0"), mdrRate: MDR_RATES[r.pm!] ?? 0,
    })),
    ...mdrMpRaw.filter(r => r.platform).map(r => {
      const total = parseFloat(r.totalAmount || "0");
      const fees  = parseFloat(r.fees || "0");
      return {
        metode: r.platform!.charAt(0).toUpperCase() + r.platform!.slice(1),
        vol: r.vol, totalAmount: total, mdrAmount: fees,
        mdrRate: total > 0 ? Math.round((fees / total) * 1000) / 10 : 0,
        isMarketplace: true,
      };
    }),
  ];

  // ── 7. Riil vs Pending ───────────────────────────────────────────────────
  const [riilRaw, pendRaw] = await Promise.all([
    db.select({ total: sql<string>`CAST(SUM(${ledgerEntries.totalSales}) AS CHAR)` })
      .from(ledgerEntries)
      .where(and(gte(ledgerEntries.entryDate, dateFrom), lte(ledgerEntries.entryDate, dateTo))),

    db.select({ total: sql<string>`CAST(SUM(${outboundTransactions.netAmount}) AS CHAR)` })
      .from(outboundTransactions)
      .where(and(
        eq(outboundTransactions.channel, "marketplace"),
        eq(outboundTransactions.status, "pending_settlement"),
        gte(sql`DATE(${outboundTransactions.createdAt})`, dateFrom),
        lte(sql`DATE(${outboundTransactions.createdAt})`, dateTo),
      )),
  ]);

  return {
    totalSales, totalHpp, grossMargin, txCount, byChannel,
    monthlyTrend, dailyCount, topProducts, ledgerRows, mdrRows,
    riilAmount:    parseFloat(riilRaw[0]?.total || "0"),
    pendingAmount: parseFloat(pendRaw[0]?.total || "0"),
  };
}
