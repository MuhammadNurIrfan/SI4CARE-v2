import { getVariantsWithProduct } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { ProductsClient } from "./_components/products-client";

export default async function ProductsPage() {
  const [variants, cats] = await Promise.all([
    getVariantsWithProduct(),
    getCategories(),
  ]);
  return <ProductsClient variants={variants} categories={cats} />;
}
