import { revalidatePath } from "next/cache";

/**
 * Segarkan halaman publik yang di-cache (ISR) setelah admin mengubah data.
 * Halaman publik memakai `revalidate = 60` sebagai jaring pengaman; helper ini
 * membuat perubahan tampil seketika. Hanya boleh dipanggil dari server action /
 * route handler.
 */

/** Katalog berubah (produk, varian, harga, kategori, foto) → landing, daftar toko, detail produk. */
export function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/[id]", "page");
}

/** Artikel berubah → landing (3 artikel terbaru), daftar blog, halaman artikel. */
export function revalidateBlog() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
}
