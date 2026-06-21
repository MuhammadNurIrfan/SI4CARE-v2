import { getMarketplaceTxs } from "@/actions/marketplace-settlement";
import { MarketplaceClient } from "./_components/marketplace-client";

export default async function MarketplacePage() {
  const rows = await getMarketplaceTxs();
  return <MarketplaceClient initialRows={rows} />;
}
