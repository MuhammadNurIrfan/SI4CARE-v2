"use server";

import { eq, gt, and, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { variants, products, batches } from "@/lib/db/schema";

export type AlarmType = "stok_rendah" | "stok_habis" | "exp_dekat" | "exp_lewat" | "margin_tipis" | "margin_minus";

export type AlarmItem = {
  id: string;
  type: AlarmType;
  produk: string;
  sku: string;
  detail: string;
  tanggal: string;
};

export async function getLiveAlarms(): Promise<AlarmItem[]> {
  const alarms: AlarmItem[] = [];
  const now = new Date().toISOString().slice(0, 10);

  // ── 1. Stok rendah / habis ────────────────────────────────────────────────
  const stockRows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      minStock: variants.minStock,
      productName: products.name,
      stock: sql<string>`COALESCE(SUM(${batches.remaining}), 0)`,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(batches, eq(batches.variantId, variants.id))
    .where(eq(variants.isActive, true))
    .groupBy(variants.id, variants.sku, variants.minStock, products.name)
    .having(sql`COALESCE(SUM(${batches.remaining}), 0) <= ${variants.minStock}`);

  for (const r of stockRows) {
    const stock = Number(r.stock);
    const type: AlarmType = stock === 0 ? "stok_habis" : "stok_rendah";
    alarms.push({
      id: `stock-${r.id}`,
      type,
      produk: r.productName,
      sku: r.sku,
      detail: stock === 0
        ? `Stok habis. Segera lakukan pemesanan ulang.`
        : `Stok tersisa ${stock} unit, di bawah batas minimum (${r.minStock} unit)`,
      tanggal: now,
    });
  }

  // ── 2. Batch mendekati ED (≤30 hari, belum lewat) ──────────────────────────
  const nearExpiry = await db
    .select({
      id: batches.id,
      batchNumber: batches.batchNumber,
      expiredDate: batches.expiredDate,
      remaining: batches.remaining,
      sku: variants.sku,
      productName: products.name,
    })
    .from(batches)
    .innerJoin(variants, eq(variants.id, batches.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .where(
      and(
        isNotNull(batches.expiredDate),
        gt(batches.remaining, 0),
        sql`${batches.expiredDate} >= CURDATE()`,
        sql`${batches.expiredDate} <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
      ),
    );

  for (const r of nearExpiry) {
    const ed = r.expiredDate!;
    const msLeft = new Date(ed).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    alarms.push({
      id: `exp-near-${r.id}`,
      type: "exp_dekat",
      produk: r.productName,
      sku: r.sku,
      detail: `Batch ${r.batchNumber ?? r.id} kadaluarsa dalam ${daysLeft} hari (${ed}), sisa ${r.remaining} unit`,
      tanggal: now,
    });
  }

  // ── 3. Batch sudah lewat ED tapi masih ada stok ────────────────────────────
  const expired = await db
    .select({
      id: batches.id,
      batchNumber: batches.batchNumber,
      expiredDate: batches.expiredDate,
      remaining: batches.remaining,
      sku: variants.sku,
      productName: products.name,
    })
    .from(batches)
    .innerJoin(variants, eq(variants.id, batches.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .where(
      and(
        isNotNull(batches.expiredDate),
        gt(batches.remaining, 0),
        sql`${batches.expiredDate} < CURDATE()`,
      ),
    );

  for (const r of expired) {
    alarms.push({
      id: `exp-past-${r.id}`,
      type: "exp_lewat",
      produk: r.productName,
      sku: r.sku,
      detail: `Batch ${r.batchNumber ?? r.id} sudah kadaluarsa sejak ${r.expiredDate}. Segera pisahkan dari stok aktif! (sisa ${r.remaining} unit)`,
      tanggal: now,
    });
  }

  // ── 4. Margin tipis / negatif (rata-rata HPP vs activePrice) ──────────────
  const marginRows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      activePrice: variants.activePrice,
      productName: products.name,
      avgHpp: sql<string>`SUM(${batches.remaining} * CAST(${batches.hpp} AS DECIMAL(15,2))) / NULLIF(SUM(${batches.remaining}), 0)`,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .innerJoin(batches, eq(batches.variantId, variants.id))
    .where(and(eq(variants.isActive, true), gt(batches.remaining, 0)))
    .groupBy(variants.id, variants.sku, variants.activePrice, products.name)
    .having(
      sql`SUM(${batches.remaining} * CAST(${batches.hpp} AS DECIMAL(15,2))) / NULLIF(SUM(${batches.remaining}), 0) >= CAST(${variants.activePrice} AS DECIMAL(15,2)) * 0.90`,
    );

  for (const r of marginRows) {
    const price = Number(r.activePrice);
    const hpp = Number(r.avgHpp ?? 0);
    const marginPct = price > 0 ? ((price - hpp) / price) * 100 : 0;
    const type: AlarmType = hpp >= price ? "margin_minus" : "margin_tipis";
    alarms.push({
      id: `margin-${r.id}`,
      type,
      produk: r.productName,
      sku: r.sku,
      detail: type === "margin_minus"
        ? `Margin NEGATIF ${marginPct.toFixed(1)}%. Rata-rata HPP: Rp ${Math.round(hpp).toLocaleString("id-ID")} > Harga jual: Rp ${Math.round(price).toLocaleString("id-ID")}`
        : `Margin tipis ${marginPct.toFixed(1)}% (< 10%). HPP rata-rata: Rp ${Math.round(hpp).toLocaleString("id-ID")}, jual: Rp ${Math.round(price).toLocaleString("id-ID")}`,
      tanggal: now,
    });
  }

  // Sort: expired first, then near-exp, then stock, then margin
  const order: AlarmType[] = ["exp_lewat", "margin_minus", "stok_habis", "exp_dekat", "margin_tipis", "stok_rendah"];
  alarms.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

  return alarms;
}
