import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  batches, ledgerEntries, outboundTransactions, products, variants,
} from "@/lib/db/schema";
import { getItemLabels, getMdrRows } from "@/lib/reports-query";
import { periodRange, type DashboardPeriod } from "@/lib/dashboard-range";

/**
 * Data dashboard /admin dari database.
 *
 * Dulu halaman ini 477 baris angka karangan (142 transaksi POS, omzet Rp92,4 juta, ...) dengan
 * `periodFactor` palsu untuk "menskalakan" angka menurut periode. Sekarang semuanya dihitung dari
 * ledger + transaksi. Bentuk datanya sengaja sama dengan data contoh lama supaya tampilan tak berubah.
 *
 * Catatan angka: ledger mencatat `totalSales` SETELAH MDR/biaya platform (nilai bersih). Tabel dashboard
 * memisahkan Omzet → MDR+Biaya → Laba Bersih, jadi omzet bruto = ledger + MDR + biaya. Dengan begitu
 * Laba Bersih tepat sama dengan Σ `gross_margin` ledger dan MDR tidak terpotong dua kali.
 *
 * Basis kas: ledger marketplace dicatat saat settlement, jadi "Belum Masuk" (dana tertahan) dihitung
 * dari semua transaksi marketplace berstatus pending_settlement, TIDAK dibatasi periode.
 */

export type ChannelKey = "pos" | "web" | "marketplace";

export type DashChannel = {
  key: ChannelKey; label: string; trx: number; omzet: number; hpp: number; mdr: number; biaya: number; pending: number;
};
export type DashEcommerce = {
  platform: string; trx: number; omzet: number; komisi: number; mdr: number; danaMasuk: number; pending: number;
};
export type DashTrendPoint = { t: string; pos: number; web: number; marketplace: number };
export type DashMdr = { metode: string; channel: string; vol: number; omzet: number; rate: number; beban: number; ditanggung: boolean };
export type DashLowStock = { nama: string; sku: string; stok: number; min: number; ed: string };
export type DashStock = { totalProduk: number; stokRendah: number; stokHabis: number; mendekatiEd: number; nilaiPersediaan: number };
export type DashRecent = {
  id: string; channel: ChannelKey; produk: string; omzet: number; hpp: number; mdr: number; dana: "riil" | "pending";
};

export type DashboardData = {
  period: DashboardPeriod;
  range: { from: string; to: string };
  channels: DashChannel[];
  ecommerce: DashEcommerce[];
  trend: DashTrendPoint[];
  mdr: DashMdr[];
  stock: DashStock;
  lowStock: DashLowStock[];
  recent: DashRecent[];
};

const CHANNEL_LABEL: Record<ChannelKey, string> = { pos: "POS / Kasir", web: "Web Olshop", marketplace: "Marketplace" };
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const num = (v: string | number | null | undefined) => Number(v ?? 0);

export async function getDashboardData(period: DashboardPeriod, now: Date = new Date()): Promise<DashboardData> {
  const range = periodRange(period, now);
  const today = range.to;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const trendFrom = sevenDaysAgo.toISOString().split("T")[0];

  const inRange = and(gte(ledgerEntries.entryDate, range.from), lte(ledgerEntries.entryDate, range.to));

  const [ledgerAgg, feeAgg, pendingAgg, ecomAgg, trendRaw, mdrRows, productCount, stockRows, edCount, stockValue, recentLedger, recentPending] =
    await Promise.all([
      // Penjualan bersih + HPP per kanal (dari ledger)
      db.select({
        channel: ledgerEntries.channel,
        trx: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        sales: sql<string>`CAST(COALESCE(SUM(${ledgerEntries.totalSales}), 0) AS TEXT)`,
        hpp: sql<string>`CAST(COALESCE(SUM(${ledgerEntries.totalHpp}), 0) AS TEXT)`,
      }).from(ledgerEntries).where(inRange).groupBy(ledgerEntries.channel),

      // MDR + biaya platform atas transaksi yang SAMA dengan yang ada di ledger periode ini
      db.select({
        channel: ledgerEntries.channel,
        mdr: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.mdrAmount}), 0) AS TEXT)`,
        // marketplace: total − net − mdr = komisi platform + biaya lain; POS: selalu 0
        fees: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.totalAmount} - ${outboundTransactions.netAmount} - ${outboundTransactions.mdrAmount}), 0) AS TEXT)`,
      }).from(ledgerEntries)
        .innerJoin(outboundTransactions, eq(outboundTransactions.id, ledgerEntries.referenceId))
        .where(inRange).groupBy(ledgerEntries.channel),

      // Dana marketplace tertahan (semua periode)
      db.select({
        platform: outboundTransactions.platform,
        pending: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.netAmount}), 0) AS TEXT)`,
      }).from(outboundTransactions)
        .where(and(eq(outboundTransactions.channel, "marketplace"), eq(outboundTransactions.status, "pending_settlement")))
        .groupBy(outboundTransactions.platform),

      // Per platform e-commerce dalam periode (berdasar tanggal transaksi dibuat)
      db.select({
        platform: outboundTransactions.platform,
        trx: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        omzet: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.totalAmount}), 0) AS TEXT)`,
        komisi: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.totalAmount} - ${outboundTransactions.netAmount} - ${outboundTransactions.mdrAmount}), 0) AS TEXT)`,
        mdr: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.mdrAmount}), 0) AS TEXT)`,
        dana: sql<string>`CAST(COALESCE(SUM(${outboundTransactions.settledAmount}), 0) AS TEXT)`,
      }).from(outboundTransactions)
        .where(and(
          eq(outboundTransactions.channel, "marketplace"),
          ne(outboundTransactions.status, "cancelled"),
          gte(sql`(${outboundTransactions.createdAt})::date`, range.from),
          lte(sql`(${outboundTransactions.createdAt})::date`, range.to),
        ))
        .groupBy(outboundTransactions.platform),

      // Tren 7 hari terakhir per kanal (tidak terikat filter periode)
      db.select({
        day: ledgerEntries.entryDate,
        channel: ledgerEntries.channel,
        sales: sql<string>`CAST(COALESCE(SUM(${ledgerEntries.totalSales}), 0) AS TEXT)`,
      }).from(ledgerEntries)
        .where(and(gte(ledgerEntries.entryDate, trendFrom), lte(ledgerEntries.entryDate, today)))
        .groupBy(ledgerEntries.entryDate, ledgerEntries.channel),

      getMdrRows(range.from, range.to),

      // ── Stok ──
      db.select({ n: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(products).where(eq(products.isActive, true)),

      db.select({
        sku: variants.sku,
        nama: products.name,
        min: variants.minStock,
        stok: sql<number>`CAST(COALESCE(SUM(${batches.remaining}), 0) AS INTEGER)`,
        ed: sql<string | null>`MIN(CASE WHEN ${batches.remaining} > 0 THEN ${batches.expiredDate} END)`,
      }).from(variants)
        .innerJoin(products, eq(variants.productId, products.id))
        .leftJoin(batches, eq(batches.variantId, variants.id))
        .where(and(eq(variants.isActive, true), eq(products.isActive, true)))
        .groupBy(variants.id, products.name),

      db.select({ n: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(batches)
        .where(and(
          sql`${batches.remaining} > 0`,
          sql`${batches.expiredDate} >= CURRENT_DATE`,
          sql`${batches.expiredDate} <= CURRENT_DATE + INTERVAL '30 days'`,
        )),

      db.select({ v: sql<string>`CAST(COALESCE(SUM(${batches.remaining} * ${batches.hpp}), 0) AS TEXT)` })
        .from(batches).where(sql`${batches.remaining} > 0`),

      // ── Transaksi terkini ──
      db.select({
        channel: ledgerEntries.channel, referenceId: ledgerEntries.referenceId, refNumber: ledgerEntries.refNumber,
        sales: ledgerEntries.totalSales, hpp: ledgerEntries.totalHpp, createdAt: ledgerEntries.createdAt,
        mdr: outboundTransactions.mdrAmount,
      }).from(ledgerEntries)
        .leftJoin(outboundTransactions, eq(outboundTransactions.id, ledgerEntries.referenceId))
        .orderBy(desc(ledgerEntries.createdAt)).limit(8),

      db.select({
        id: outboundTransactions.id, refNumber: outboundTransactions.refNumber, net: outboundTransactions.netAmount,
        hpp: outboundTransactions.totalHpp, mdr: outboundTransactions.mdrAmount, createdAt: outboundTransactions.createdAt,
      }).from(outboundTransactions)
        .where(and(eq(outboundTransactions.channel, "marketplace"), eq(outboundTransactions.status, "pending_settlement")))
        .orderBy(desc(outboundTransactions.createdAt)).limit(8),
    ]);

  // ── Kanal ──
  const pendingTotal = pendingAgg.reduce((s, r) => s + num(r.pending), 0);
  const channels: DashChannel[] = (["pos", "web", "marketplace"] as ChannelKey[]).map((key) => {
    const l = ledgerAgg.find((r) => r.channel === key);
    const f = feeAgg.find((r) => r.channel === key);
    const mdr = num(f?.mdr);
    const biaya = num(f?.fees);
    return {
      key,
      label: CHANNEL_LABEL[key],
      trx: l?.trx ?? 0,
      omzet: num(l?.sales) + mdr + biaya, // bruto: ledger sudah bersih dari MDR/biaya
      hpp: num(l?.hpp),
      mdr,
      biaya,
      pending: key === "marketplace" ? pendingTotal : 0,
    };
  });

  // ── Platform e-commerce ──
  const platforms = new Set<string>([...ecomAgg.map((r) => r.platform ?? "—"), ...pendingAgg.map((r) => r.platform ?? "—")]);
  const ecommerce: DashEcommerce[] = [...platforms].map((name) => {
    const e = ecomAgg.find((r) => (r.platform ?? "—") === name);
    const p = pendingAgg.find((r) => (r.platform ?? "—") === name);
    return {
      platform: name.charAt(0).toUpperCase() + name.slice(1),
      trx: e?.trx ?? 0, omzet: num(e?.omzet), komisi: num(e?.komisi), mdr: num(e?.mdr),
      danaMasuk: num(e?.dana), pending: num(p?.pending),
    };
  }).sort((a, b) => b.omzet - a.omzet);

  // ── Tren 7 hari ──
  const trend: DashTrendPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const at = (ch: ChannelKey) => trendRaw.filter((r) => r.day === key && r.channel === ch).reduce((s, r) => s + num(r.sales), 0);
    return { t: DAY_NAMES[d.getUTCDay()], pos: at("pos"), web: at("web"), marketplace: at("marketplace") };
  });

  // ── MDR ──
  const mdr: DashMdr[] = mdrRows.map((m) => ({
    metode: m.metode,
    channel: m.isMarketplace ? "Marketplace" : "POS",
    vol: m.vol,
    omzet: m.totalAmount,
    rate: m.mdrRate,
    beban: m.mdrAmount,
    ditanggung: m.mdrRate > 0,
  }));

  // ── Stok ──
  const stokHabis = stockRows.filter((r) => r.stok === 0).length;
  const stokRendah = stockRows.filter((r) => r.stok > 0 && r.stok <= r.min).length;
  const stock: DashStock = {
    totalProduk: productCount[0]?.n ?? 0,
    stokRendah,
    stokHabis,
    mendekatiEd: edCount[0]?.n ?? 0,
    nilaiPersediaan: num(stockValue[0]?.v),
  };
  const lowStock: DashLowStock[] = stockRows
    .filter((r) => r.stok <= r.min)
    .sort((a, b) => a.stok - b.stok || a.nama.localeCompare(b.nama))
    .slice(0, 5)
    .map((r) => ({ nama: r.nama, sku: r.sku, stok: r.stok, min: r.min, ed: r.ed ?? "-" }));

  // ── Transaksi terkini: ledger (uang riil) + marketplace yang belum settlement ──
  const labels = await getItemLabels(
    [...recentLedger.filter((r) => r.channel !== "web").map((r) => r.referenceId), ...recentPending.map((r) => r.id)],
    recentLedger.filter((r) => r.channel === "web").map((r) => r.referenceId),
  );
  const ledgerIds = new Set(recentLedger.map((r) => r.referenceId));
  const recent: Array<DashRecent & { at: number }> = [
    ...recentLedger.map((r) => ({
      id: r.refNumber, channel: r.channel as ChannelKey, produk: labels[r.referenceId] || r.refNumber,
      omzet: num(r.sales), hpp: num(r.hpp), mdr: num(r.mdr), dana: "riil" as const, at: r.createdAt.getTime(),
    })),
    ...recentPending.filter((r) => !ledgerIds.has(r.id)).map((r) => ({
      id: r.refNumber, channel: "marketplace" as const, produk: labels[r.id] || r.refNumber,
      omzet: num(r.net), hpp: num(r.hpp), mdr: num(r.mdr), dana: "pending" as const, at: r.createdAt.getTime(),
    })),
  ].sort((a, b) => b.at - a.at).slice(0, 8);

  return {
    period, range, channels, ecommerce, trend, mdr, stock, lowStock,
    recent: recent.map((r) => ({
      id: r.id, channel: r.channel, produk: r.produk, omzet: r.omzet, hpp: r.hpp, mdr: r.mdr, dana: r.dana,
    })),
  };
}
