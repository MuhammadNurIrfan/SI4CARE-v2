import { cache } from "react";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { batches, categories, products, variants } from "@/lib/db/schema";
import { variantLabel } from "@/lib/shop-helpers";

/**
 * Query etalase publik yang dipanggil langsung oleh server component.
 * Sengaja bukan server action: tidak ada client component yang memanggilnya,
 * jadi tidak perlu jadi endpoint.
 */

export type ShopVariant = {
  id: string; // variantId — dipakai saat addToCart / checkout
  sku: string;
  name: string; // dari atribut ("Merah · L"), jatuh ke SKU bila tak ada atribut
  price: number;
  stock: number;
  attributes: Record<string, string>;
};

export type ShopProductDetail = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  category: string;
  imageUrl: string | null;
  categoryImageUrl: string | null;
  variants: ShopVariant[];
};

/** Detail satu produk aktif beserta semua varian aktifnya. null = tidak ada / nonaktif. */
export const getShopProductDetail = cache(async (productId: string): Promise<ShopProductDetail | null> => {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      description: products.description,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
      categoryImageUrl: categories.imageUrl,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);
  if (!product) return null;

  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      attributes: variants.attributes,
      activePrice: variants.activePrice,
      // COUNT/SUM mengembalikan string di postgres-js — CAST agar benar-benar number (lihat AGENTS.md).
      stock: sql<number>`CAST(COALESCE(SUM(${batches.remaining}), 0) AS INTEGER)`,
    })
    .from(variants)
    .leftJoin(batches, eq(batches.variantId, variants.id))
    .where(and(eq(variants.productId, productId), eq(variants.isActive, true)))
    .groupBy(variants.id)
    .orderBy(asc(variants.activePrice), asc(variants.sku));
  if (rows.length === 0) return null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    category: product.categoryName ?? "Umum",
    imageUrl: product.imageUrl,
    categoryImageUrl: product.categoryImageUrl,
    variants: rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: variantLabel(r.attributes, r.sku),
      price: Number(r.activePrice),
      stock: Number(r.stock),
      attributes: r.attributes ?? {},
    })),
  };
});
