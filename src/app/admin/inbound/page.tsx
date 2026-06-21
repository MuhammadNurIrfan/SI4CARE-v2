import { getVariantsWithProduct } from "@/actions/products";
import { getRecentBatches } from "@/actions/batches";
import { InboundClient } from "./_components/inbound-client";

export default async function InboundPage() {
  const [variants, recentBatches] = await Promise.all([
    getVariantsWithProduct(),
    getRecentBatches(),
  ]);
  return <InboundClient variants={variants} recentBatches={recentBatches} />;
}
