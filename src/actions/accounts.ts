"use server";

import { randomUUID } from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/lib/db";
import { account, addresses, orders, session, user } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";
import {
  checkDelete,
  checkRoleChange,
  createAccountSchema,
  normalizeRole,
  updateAccountSchema,
  type AccountRole,
  type CreateAccountInput,
  type UpdateAccountInput,
} from "@/lib/accounts-rules";

export type AccountRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AccountRole;
  emailVerified: boolean;
  createdAt: string;
  orderCount: number;
};

export type AccountDetail = AccountRow & {
  addressCount: number;
  activeSessions: number;
  providers: string[];
};

export type AccountResult = { ok: true } | { ok: false; error: string };

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && ("code" in e ? (e as { code?: string }).code === "23505" : false);

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Data tidak valid";
}

export async function listAccounts(): Promise<AccountRow[]> {
  await requireSuperAdmin();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      // Nama tabel ditulis literal: Drizzle membuang prefix tabel pada kolom di subquery sehingga
      // `${orders.userId} = ${user.id}` menjadi `"user_id" = "id"` (keduanya milik orders → selalu 0).
      orderCount: sql<number>`CAST((SELECT COUNT(*) FROM "orders" AS "o" WHERE "o"."user_id" = "user"."id") AS INTEGER)`,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: normalizeRole(r.role),
    emailVerified: r.emailVerified,
    createdAt: r.createdAt.toISOString(),
    orderCount: Number(r.orderCount),
  }));
}

export async function getAccountDetail(id: string): Promise<AccountDetail | null> {
  await requireSuperAdmin();
  const [u] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!u) return null;

  const [[o], [a], [s], providers] = await Promise.all([
    db.select({ n: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(orders).where(eq(orders.userId, id)),
    db.select({ n: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(addresses).where(eq(addresses.userId, id)),
    db
      .select({ n: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(session)
      .where(sql`${session.userId} = ${id} AND ${session.expiresAt} > NOW()`),
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, id)),
  ]);

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: normalizeRole(u.role),
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    orderCount: Number(o?.n ?? 0),
    addressCount: Number(a?.n ?? 0),
    activeSessions: Number(s?.n ?? 0),
    providers: providers.map((p) => p.providerId),
  };
}

export async function createAccount(input: CreateAccountInput): Promise<AccountResult> {
  const actor = await requireSuperAdmin();
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  const id = randomUUID();
  const hashed = await hashPassword(data.password);

  try {
    const taken = await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, data.email)).limit(1);
      if (existing) return true;
      await tx.insert(user).values({
        id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        emailVerified: true,
      });
      await tx.insert(account).values({
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hashed,
      });
      return false;
    });
    if (taken) return { ok: false, error: "Email sudah terdaftar" };
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: "Email sudah terdaftar" };
    throw e;
  }

  await logAudit(actor.user.id, "ACCOUNT_CREATED", "user", id, { email: data.email, role: data.role });
  return { ok: true };
}

export async function updateAccount(input: UpdateAccountInput): Promise<AccountResult> {
  const actor = await requireSuperAdmin();
  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;
  const hashed = data.password ? await hashPassword(data.password) : null;

  try {
    const error = await db.transaction(async (tx) => {
      // Kunci semua baris Super Admin agar dua perubahan bersamaan tak bisa sama-sama lolos cek "minimal satu".
      const superAdmins = await tx.select({ id: user.id }).from(user).where(eq(user.role, "super_admin")).for("update");
      const [target] = await tx.select().from(user).where(eq(user.id, data.id)).limit(1);
      if (!target) return "Akun tidak ditemukan";

      const targetRole = normalizeRole(target.role);
      const roleError = checkRoleChange({
        actorId: actor.user.id,
        targetId: target.id,
        targetRole,
        nextRole: data.role,
        superAdminCount: superAdmins.length,
      });
      if (roleError) return roleError;

      if (data.email !== target.email) {
        const [clash] = await tx.select({ id: user.id }).from(user).where(eq(user.email, data.email)).limit(1);
        if (clash) return "Email sudah dipakai akun lain";
      }

      await tx
        .update(user)
        .set({ name: data.name, email: data.email, phone: data.phone, role: data.role })
        .where(eq(user.id, data.id));

      if (hashed) {
        const updated = await tx
          .update(account)
          .set({ password: hashed })
          .where(sql`${account.userId} = ${data.id} AND ${account.providerId} = 'credential'`)
          .returning({ id: account.id });
        if (updated.length === 0) {
          await tx.insert(account).values({
            id: randomUUID(),
            accountId: data.id,
            providerId: "credential",
            userId: data.id,
            password: hashed,
          });
        }
      }

      // Peran/password berubah → paksa login ulang di semua perangkat, kecuali sesi Super Admin yang sedang mengedit dirinya.
      const sensitiveChange = data.role !== targetRole || hashed !== null;
      if (sensitiveChange && target.id !== actor.user.id) {
        await tx.delete(session).where(eq(session.userId, data.id));
      }
      return null;
    });
    if (error) return { ok: false, error };
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: "Email sudah dipakai akun lain" };
    throw e;
  }

  await logAudit(actor.user.id, "ACCOUNT_UPDATED", "user", data.id, {
    role: data.role,
    passwordReset: Boolean(data.password),
  });
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<AccountResult & { keptOrders?: number }> {
  const actor = await requireSuperAdmin();
  if (typeof id !== "string" || id === "") return { ok: false, error: "Akun tidak valid" };

  const result = await db.transaction(async (tx) => {
    const superAdmins = await tx.select({ id: user.id }).from(user).where(eq(user.role, "super_admin")).for("update");
    const [target] = await tx.select().from(user).where(eq(user.id, id)).limit(1);
    if (!target) return { error: "Akun tidak ditemukan" as const };

    const guardError = checkDelete({
      actorId: actor.user.id,
      targetId: target.id,
      targetRole: normalizeRole(target.role),
      superAdminCount: superAdmins.length,
    });
    if (guardError) return { error: guardError };

    const [o] = await tx.select({ n: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(orders).where(eq(orders.userId, id));
    // Sesi, akun login, alamat, dan keranjang ikut terhapus (cascade); pesanan tetap ada dengan pemilik kosong.
    await tx.delete(user).where(eq(user.id, id));
    return { email: target.email, role: normalizeRole(target.role), keptOrders: Number(o?.n ?? 0) };
  });

  if ("error" in result) return { ok: false, error: result.error ?? "Gagal menghapus akun" };

  await logAudit(actor.user.id, "ACCOUNT_DELETED", "user", id, { email: result.email, role: result.role });
  return { ok: true, keptOrders: result.keptOrders };
}
