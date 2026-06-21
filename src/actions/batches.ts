"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { batches, variants, products } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { batchSchema, type BatchInput } from "@/lib/validations/catalog";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Tidak ada sesi aktif");
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    throw new Error("Akses ditolak: bukan admin");
  }
  return session;
}

/** Buat batch baru (transaksi masuk/inbound). qty = quantity = remaining saat pertama masuk. */
export async function createBatch(input: BatchInput) {
  await requireAdmin();
  const data = batchSchema.parse(input);
  const id = randomUUID();
  await db.insert(batches).values({
    id,
    variantId: data.variantId,
    batchNumber: data.batchNumber ?? null,
    hpp: String(data.hpp),
    quantity: data.quantity,
    remaining: data.quantity, // saat inbound, remaining = quantity
    expiredDate: data.expiredDate ?? null,
    supplier: data.supplier ?? null,
  });
  revalidatePath("/admin/inbound");
  revalidatePath("/admin/products");
  return id;
}

export type RecentBatchRow = {
  batchId: string;
  batchNumber: string | null;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  remaining: number;
  hpp: string;
  activePrice: string;
  expiredDate: string | null;
  supplier: string | null;
  stockMode: "fifo" | "fefo";
  receivedAt: Date;
};

/** 50 batch terakhir untuk halaman inbound. */
export async function getRecentBatches(): Promise<RecentBatchRow[]> {
  const rows = await db
    .select({
      batchId: batches.id,
      batchNumber: batches.batchNumber,
      variantId: variants.id,
      sku: variants.sku,
      productName: products.name,
      quantity: batches.quantity,
      remaining: batches.remaining,
      hpp: batches.hpp,
      activePrice: variants.activePrice,
      expiredDate: batches.expiredDate,
      supplier: batches.supplier,
      stockMode: variants.stockMode,
      receivedAt: batches.receivedAt,
    })
    .from(batches)
    .innerJoin(variants, eq(batches.variantId, variants.id))
    .innerJoin(products, eq(variants.productId, products.id))
    .orderBy(desc(batches.receivedAt))
    .limit(50);

  return rows as RecentBatchRow[];
}
