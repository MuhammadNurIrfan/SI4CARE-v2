import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AddressesClient } from "./_components/addresses-client";

export default async function AddressesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, session.user.id))
    .orderBy(desc(addresses.isPrimary), desc(addresses.createdAt));

  return <AddressesClient addresses={rows} />;
}
