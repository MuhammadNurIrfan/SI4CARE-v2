"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate";
import { randomUUID } from "crypto";
import { eq, asc, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, variants, batches, categories } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  productSchema,
  variantSchema,
  type ProductInput,
  type VariantInput,
} from "@/lib/validations/catalog";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Tidak ada sesi aktif");
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    throw new Error("Akses ditolak: bukan admin");
  }
  return session;
}

export type VariantRow = {
  variantId: string;
  sku: string;
  barcode: string | null;
  activePrice: string; // decimal dikembalikan sebagai string oleh Drizzle
  minStock: number;
  stockMode: "fifo" | "fefo";
  isActive: boolean;
  attributes: Record<string, string> | null;
  productId: string;
  productName: string;
  productBrand: string | null;
  productIsActive: boolean;
  productImageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  totalStock: number;
};

/** Daftar semua varian dengan join produk + kategori + total stok dari batch. */
export async function getVariantsWithProduct(): Promise<VariantRow[]> {
  const rows = await db
    .select({
      variantId: variants.id,
      sku: variants.sku,
      barcode: variants.barcode,
      activePrice: variants.activePrice,
      minStock: variants.minStock,
      stockMode: variants.stockMode,
      isActive: variants.isActive,
      attributes: variants.attributes,
      productId: products.id,
      productName: products.name,
      productBrand: products.brand,
      productIsActive: products.isActive,
      productImageUrl: products.imageUrl,
      categoryId: products.categoryId,
      categoryName: categories.name,
      totalStock: sql<number>`CAST(COALESCE(SUM(${batches.remaining}), 0) AS INTEGER)`,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(batches, eq(batches.variantId, variants.id))
    .groupBy(
      variants.id,
      products.id,
      products.name,
      products.brand,
      products.isActive,
      products.categoryId,
      categories.name,
    )
    .orderBy(asc(products.name), asc(variants.sku));

  return rows as VariantRow[];
}

/**
 * Buat produk baru sekaligus varian pertamanya.
 * Stok awal datang dari inbound (tabel batches), bukan dari sini.
 */
export async function createProductWithVariant(
  productInput: ProductInput,
  variantInput: Omit<VariantInput, "productId">,
): Promise<{ productId: string; variantId: string }> {
  await requireAdmin();
  const pData = productSchema.parse(productInput);
  const productId = randomUUID();
  const variantId = randomUUID();

  const vData = variantSchema.parse({ ...variantInput, productId });

  await db.insert(products).values({
    id: productId,
    categoryId: pData.categoryId ?? null,
    name: pData.name,
    brand: pData.brand ?? null,
    description: pData.description ?? null,
    imageUrl: pData.imageUrl ?? null,
    isActive: pData.isActive,
  });

  await db.insert(variants).values({
    id: variantId,
    productId,
    sku: vData.sku,
    barcode: vData.barcode ?? null,
    attributes: (vData.attributes ?? null) as Record<string, string> | null,
    activePrice: String(vData.activePrice),
    minStock: vData.minStock,
    stockMode: vData.stockMode,
    isActive: vData.isActive,
  });

  revalidatePath("/admin/products");
  revalidateStorefront();
  return { productId, variantId };
}

export async function updateProduct(productId: string, input: ProductInput) {
  await requireAdmin();
  const data = productSchema.parse(input);
  await db
    .update(products)
    .set({
      categoryId: data.categoryId ?? null,
      name: data.name,
      brand: data.brand ?? null,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
  revalidatePath("/admin/products");
  revalidateStorefront();
}

export async function updateVariant(variantId: string, input: Omit<VariantInput, "productId">) {
  await requireAdmin();
  const vData = variantSchema.parse({ ...input, productId: "placeholder" });
  await db
    .update(variants)
    .set({
      sku: vData.sku,
      barcode: vData.barcode ?? null,
      attributes: (vData.attributes ?? null) as Record<string, string> | null,
      activePrice: String(vData.activePrice),
      minStock: vData.minStock,
      stockMode: vData.stockMode,
      isActive: vData.isActive,
      updatedAt: new Date(),
    })
    .where(eq(variants.id, variantId));
  revalidatePath("/admin/products");
  revalidateStorefront();
}

// ─── Shop public API ──────────────────────────────────────────────────────────

export type ShopProduct = {
  id: string;           // productId — dipakai di URL /shop/[id]
  variantId: string;    // UUID nyata dari DB — dipakai saat addToCart
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  category: string;
  categoryId: string | null;
  imageUrl: string | null;
  /** Foto kategori dari DB — dipakai sebagai gambar bila produk belum punya foto sendiri. */
  categoryImageUrl: string | null;
  stock: number;
  art?: string;
};

/** Daftar produk aktif untuk halaman shop — satu baris per varian aktif pertama. */
export async function getShopProducts(): Promise<ShopProduct[]> {
  const rows = await db
    .select({
      productId: products.id,
      variantId: variants.id,
      sku: variants.sku,
      name: products.name,
      brand: products.brand,
      imageUrl: products.imageUrl,
      activePrice: variants.activePrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryImageUrl: categories.imageUrl,
      totalStock: sql<number>`CAST(COALESCE(SUM(${batches.remaining}), 0) AS INTEGER)`,
    })
    .from(products)
    .innerJoin(variants, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(batches, eq(batches.variantId, variants.id))
    .where(and(eq(products.isActive, true), eq(variants.isActive, true)))
    .groupBy(variants.id, products.id, categories.name, categories.imageUrl)
    .orderBy(asc(products.name));

  return rows.map((r) => ({
    id: r.productId,
    variantId: r.variantId,
    sku: r.sku,
    name: r.name,
    brand: r.brand,
    imageUrl: r.imageUrl ?? null,
    categoryImageUrl: r.categoryImageUrl ?? null,
    price: Number(r.activePrice),
    category: r.categoryName ?? "Umum",
    categoryId: r.categoryId,
    stock: r.totalStock,
  }));
}

/** Hapus produk beserta semua varian dan batch-nya (CASCADE di DB). */
export async function deleteProduct(productId: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath("/admin/products");
  revalidateStorefront();
}
