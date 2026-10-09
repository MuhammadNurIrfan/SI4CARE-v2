"use server";

import { db } from "@/lib/db";
import {
  variants, batches, products,
  stockOpnameSessions, stockOpnameItems,
} from "@/lib/db/schema";
import { eq, sql, asc, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/server-auth";

export type SoItemRow = {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  barcode: string | null;
  lokasi: string | null;
  systemStock: number;
  physicalStock: number | null;
  adjustmentDelta: number | null;
  hpp: number;
  notes: string | null;
};

export type SoSessionRow = {
  id: string;
  sessionNo: string;
  status: "open" | "selesai";
  conductedAt: string;
  closedAt: string | null;
};

export type OpenSessionData = {
  session: SoSessionRow;
  items: SoItemRow[];
};

/** Ambil snapshot stok sistem dari DB (semua varian aktif + sum batch.remaining) */
async function getVariantSnapshot() {
  return db
    .select({
      variantId: variants.id,
      sku: variants.sku,
      barcode: variants.barcode,
      productName: products.name,
      systemStock: sql<number>`COALESCE(SUM(${batches.remaining}), 0)`,
      avgHpp: sql<number>`COALESCE(SUM(${batches.remaining} * CAST(${batches.hpp} AS DECIMAL(15,2))) / NULLIF(SUM(${batches.remaining}), 0), 0)`,
    })
    .from(variants)
    .leftJoin(products, eq(variants.productId, products.id))
    .leftJoin(batches, eq(batches.variantId, variants.id))
    .where(eq(variants.isActive, true))
    .groupBy(variants.id, variants.sku, variants.barcode, products.name);
}

export async function getOpenSession(): Promise<OpenSessionData | null> {
  await requireAdmin();
  const [session] = await db
    .select()
    .from(stockOpnameSessions)
    .where(eq(stockOpnameSessions.status, "open"))
    .limit(1);

  if (!session) return null;

  const items = await db
    .select()
    .from(stockOpnameItems)
    .where(eq(stockOpnameItems.sessionId, session.id));

  return {
    session: {
      id: session.id,
      sessionNo: session.sessionNo,
      status: session.status,
      conductedAt: session.conductedAt.toISOString(),
      closedAt: session.closedAt ? session.closedAt.toISOString() : null,
    },
    items: items.map((i) => ({
      id: i.id,
      variantId: i.variantId ?? "",
      productName: i.productName,
      sku: i.sku,
      barcode: i.barcode ?? null,
      lokasi: i.lokasi ?? null,
      systemStock: i.systemStock,
      physicalStock: i.physicalStock ?? null,
      adjustmentDelta: i.adjustmentDelta ?? null,
      hpp: Number(i.hpp),
      notes: i.notes ?? null,
    })),
  };
}

export async function startSoSession(conductedBy: string): Promise<{ sessionId: string; sessionNo: string }> {
  await requireAdmin();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  const sessionNo = `SO-${today}-${rand}`;
  const id = randomUUID();

  await db.insert(stockOpnameSessions).values({
    id,
    sessionNo,
    branchId: "main",
    conductedBy,
    status: "open",
  });

  const snapshot = await getVariantSnapshot();

  if (snapshot.length > 0) {
    await db.insert(stockOpnameItems).values(
      snapshot.map((v) => ({
        id: randomUUID(),
        sessionId: id,
        variantId: v.variantId,
        productName: v.productName ?? "—",
        sku: v.sku,
        barcode: v.barcode ?? undefined,
        systemStock: Number(v.systemStock),
        hpp: String(Number(v.avgHpp).toFixed(2)),
      })),
    );
  }

  return { sessionId: id, sessionNo };
}

export async function saveOpnameProgress(
  updates: { id: string; physicalStock: number | null; notes: string }[],
): Promise<void> {
  await requireAdmin();
  for (const u of updates) {
    await db
      .update(stockOpnameItems)
      .set({
        physicalStock: u.physicalStock ?? undefined,
        notes: u.notes || null,
      })
      .where(eq(stockOpnameItems.id, u.id));
  }
}

export async function closeSession(
  sessionId: string,
  conductedBy = "system",
): Promise<{ ok: boolean; adjustedCount: number }> {
  await requireAdmin();
  const items = await db
    .select()
    .from(stockOpnameItems)
    .where(eq(stockOpnameItems.sessionId, sessionId));

  let adjustedCount = 0;
  const adjustedItems: { variantId: string; delta: number }[] = [];

  for (const item of items) {
    if (!item.variantId || item.physicalStock === null) continue;
    const delta = item.physicalStock - item.systemStock;
    if (delta !== 0) {
      await applyBatchAdjustment(item.variantId, delta);
      await db
        .update(stockOpnameItems)
        .set({ adjustmentDelta: delta })
        .where(eq(stockOpnameItems.id, item.id));
      adjustedItems.push({ variantId: item.variantId, delta });
      adjustedCount++;
    }
  }

  await db
    .update(stockOpnameSessions)
    .set({ status: "selesai", closedAt: new Date() })
    .where(eq(stockOpnameSessions.id, sessionId));

  await logAudit(conductedBy, "STOCK_OPNAME_CLOSED", "stock_opname_sessions", sessionId, {
    adjustedCount, adjustedItems,
  });

  return { ok: true, adjustedCount };
}

/** FIFO untuk delta negatif (kurangi batch terlama dulu), reverse untuk positif */
async function applyBatchAdjustment(variantId: string, delta: number) {
  const batchList = await db
    .select({ id: batches.id, remaining: batches.remaining })
    .from(batches)
    .where(eq(batches.variantId, variantId))
    .orderBy(delta < 0 ? asc(batches.receivedAt) : desc(batches.receivedAt));

  let amount = Math.abs(delta);
  for (const b of batchList) {
    if (amount <= 0) break;
    if (delta < 0) {
      const take = Math.min(b.remaining, amount);
      await db
        .update(batches)
        .set({ remaining: sql`${batches.remaining} - ${take}` })
        .where(eq(batches.id, b.id));
      amount -= take;
    } else {
      await db
        .update(batches)
        .set({ remaining: sql`${batches.remaining} + ${amount}` })
        .where(eq(batches.id, b.id));
      amount = 0;
    }
  }
}

export async function getSessionHistory(): Promise<SoSessionRow[]> {
  await requireAdmin();
  const rows = await db
    .select()
    .from(stockOpnameSessions)
    .orderBy(desc(stockOpnameSessions.conductedAt))
    .limit(20);
  return rows.map((r) => ({
    id: r.id,
    sessionNo: r.sessionNo,
    status: r.status,
    conductedAt: r.conductedAt.toISOString().slice(0, 10),
    closedAt: r.closedAt ? r.closedAt.toISOString().slice(0, 10) : null,
  }));
}
