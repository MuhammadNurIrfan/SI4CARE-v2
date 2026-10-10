import type { ShopProduct } from "@/actions/products";

/**
 * Fungsi murni untuk etalase — dipisah dari shop-queries.ts (yang mengimpor DB)
 * supaya bisa diuji unit tanpa koneksi database.
 */

export function variantLabel(attributes: Record<string, string> | null | undefined, sku: string): string {
  const values = Object.values(attributes ?? {}).filter((v) => v && v.trim());
  return values.length > 0 ? values.join(" · ") : sku;
}

/**
 * Produk untuk carousel "Produk Unggulan" di landing: satu kartu per produk
 * (varian pertama), hanya yang masih ada stok. Tidak ada data penjualan untuk
 * mengurutkan "terlaris", jadi urutan mengikuti hasil `getShopProducts` (nama).
 */
export function pickFeaturedProducts(all: ShopProduct[], limit = 8): ShopProduct[] {
  const seen = new Set<string>();
  const out: ShopProduct[] = [];
  for (const p of all) {
    if (p.stock <= 0 || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
