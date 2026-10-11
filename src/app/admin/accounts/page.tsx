import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAccounts } from "@/actions/accounts";
import { AccountsClient } from "./_components/accounts-client";

export default async function AccountsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/admin");

  const accounts = await listAccounts();
  return <AccountsClient accounts={accounts} currentUserId={session.user.id} />;
}
