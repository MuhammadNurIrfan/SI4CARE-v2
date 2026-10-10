import { getShopProducts } from "@/actions/products";
import { ShopClient } from "./_components/shop-client";

// ISR: data dari DB. Tanpa ini halaman dirender statis saat build dan tak pernah berubah sampai deploy ulang.
export const revalidate = 60;

export default async function ShopPage() {
  const products = await getShopProducts();

  const categories = [...new Set(products.map((p) => p.category))].sort();
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort() as string[];

  return <ShopClient products={products} categories={categories} brands={brands} />;
}
