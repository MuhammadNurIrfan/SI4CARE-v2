import { getVouchers, getShippingSubsidy, getTieredDiscounts } from "@/actions/vouchers";
import { DiscountsClient } from "./_components/discounts-client";

export default async function DiscountsPage() {
  const [vouchers, subsidyCfg, tieredCfg] = await Promise.all([
    getVouchers(),
    getShippingSubsidy(),
    getTieredDiscounts(),
  ]);
  return <DiscountsClient initialVouchers={vouchers} initialSubsidy={subsidyCfg} initialTiered={tieredCfg} />;
}
