import { getOpenSession, getSessionHistory } from "@/actions/stock-opname";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockOpnameClient } from "./_components/stock-opname-client";

export default async function StockOpnamePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? "system";

  const [existingSession, history] = await Promise.all([
    getOpenSession(),
    getSessionHistory(),
  ]);

  return (
    <StockOpnameClient
      existingSession={existingSession}
      userId={userId}
      history={history}
    />
  );
}
