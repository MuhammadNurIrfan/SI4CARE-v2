import { getPosProducts } from "@/actions/pos";
import { PosClient } from "./_components/pos-client";

export default async function POSPage() {
  const products = await getPosProducts();
  return <PosClient products={products} />;
}
