import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { auth } from "@/lib/auth";
import { getMyAddresses } from "@/actions/addresses";
import { MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION } from "@/lib/midtrans";
import { CheckoutClient } from "./_components/checkout-client";

export default async function CheckoutPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?redirect=/checkout");

  const addresses = await getMyAddresses();

  const snapUrl = MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <>
      <Script src={snapUrl} data-client-key={MIDTRANS_CLIENT_KEY} strategy="afterInteractive" />
      <CheckoutClient addresses={addresses} />
    </>
  );
}
