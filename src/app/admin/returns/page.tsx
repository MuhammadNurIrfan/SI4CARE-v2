import { getAdminReturns } from "@/actions/returns";
import { ReturnsAdminClient } from "./_components/returns-admin-client";

export default async function AdminReturnsPage() {
  const rows = await getAdminReturns();
  return <ReturnsAdminClient initialRows={rows} />;
}
