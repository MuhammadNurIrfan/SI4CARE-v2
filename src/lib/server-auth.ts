import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Throws if not logged in. */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Silakan login terlebih dahulu");
  return session;
}

/** Throws if not logged in or not admin/super_admin. */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Tidak ada sesi aktif");
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    throw new Error("Akses ditolak");
  }
  return session;
}
