import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopProductDetail } from "@/lib/shop-queries";
import { getShopProducts } from "@/actions/products";
import { ProductDetailClient } from "./_components/product-detail-client";

// ISR: detail produk (harga/stok) dirender ulang paling lambat tiap 60 detik.
// ID tidak dikenal di-render saat diminta pertama kali lalu di-cache.
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Prerender produk yang ada saat build (ISR 60 detik). Tanpa ini halaman dirender dinamis di balik
// shop/loading.tsx: Next sudah mengirim "cangkang" dengan status 200 sebelum notFound() sempat dipanggil,
// sehingga ID yang tak ada menghasilkan HTTP 200 (soft 404) alih-alih 404. Produk baru yang ditambah
// setelah build tetap dirender saat pertama diminta (dynamicParams bawaan = true).
export async function generateStaticParams() {
  const all = await getShopProducts().catch(() => []);
  return [...new Set(all.map((p) => p.id))].map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getShopProductDetail(id);
  if (!product) return { title: "Produk tidak ditemukan | si4care" };

  const description = (product.description ?? `${product.name} — alat kesehatan original dari si4care.`)
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return {
    title: `${product.name} | si4care`,
    description,
    openGraph: { title: product.name, description, ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}) },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getShopProductDetail(id);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
