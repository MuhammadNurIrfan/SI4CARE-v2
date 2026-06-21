"use server";

import { eq, desc, and } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { returns, orders, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { requireAdmin } from "@/lib/server-auth";

const submitReturnSchema = z.object({
  orderId: z.string().min(1).max(36),
  reason: z.enum(["rusak", "tidak_sesuai", "kurang", "expired", "lainnya"]),
  detail: z.string().min(5).max(1000),
});

export type ReturnStatus = "pending" | "inspeksi" | "layak_jual" | "write_off" | "ditolak";
export type ReturnReason = "rusak" | "tidak_sesuai" | "kurang" | "expired" | "lainnya";

export type ReturnRow = {
  id: string;
  orderId: string | null;
  userId: string | null;
  userName: string | null;
  reason: ReturnReason;
  detail: string | null;
  photos: string[];
  status: ReturnStatus;
  inspectionNotes: string | null;
  adminId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerOrderOption = {
  id: string;
  refNumber: string | null;
  createdAt: string;
  status: string;
};

// ─── Pelanggan: ambil pesanan yang bisa diretur ───────────────────────────────

export async function getMyReturnableOrders(): Promise<CustomerOrderOption[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const rows = await db
    .select({ id: orders.id, midtransOrderId: orders.midtransOrderId, createdAt: orders.createdAt, status: orders.status })
    .from(orders)
    .where(and(eq(orders.userId, session.user.id), eq(orders.status, "delivered")))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return rows.map((r) => ({
    id: r.id,
    refNumber: r.midtransOrderId,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString().slice(0, 10) : String(r.createdAt).slice(0, 10),
    status: r.status,
  }));
}

// ─── Pelanggan: ajukan retur ──────────────────────────────────────────────────

export async function submitReturn(input: {
  orderId: string;
  reason: ReturnReason;
  detail: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Belum login" };

  const parsed = submitReturnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  // IDOR: pastikan order milik user ini dan berstatus delivered
  const [order] = await db
    .select({ id: orders.id, userId: orders.userId, status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, parsed.data.orderId), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) return { ok: false, error: "Pesanan tidak ditemukan" };
  if (order.status !== "delivered") return { ok: false, error: "Retur hanya untuk pesanan yang sudah diterima" };

  await db.insert(returns).values({
    id: crypto.randomUUID(),
    orderId: parsed.data.orderId,
    userId: session.user.id,
    reason: parsed.data.reason,
    detail: parsed.data.detail,
    photos: [],
    status: "pending",
  });

  return { ok: true };
}

// ─── Pelanggan: riwayat retur ─────────────────────────────────────────────────

export async function getMyReturns(): Promise<ReturnRow[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const rows = await db
    .select()
    .from(returns)
    .where(eq(returns.userId, session.user.id))
    .orderBy(desc(returns.createdAt));

  return rows.map(mapRow);
}

// ─── Admin: semua retur ───────────────────────────────────────────────────────

export async function getAdminReturns(): Promise<ReturnRow[]> {
  await requireAdmin();
  const rows = await db
    .select({
      r: returns,
      userName: user.name,
    })
    .from(returns)
    .leftJoin(user, eq(user.id, returns.userId))
    .orderBy(desc(returns.createdAt));

  return rows.map(({ r, userName }) => ({
    ...mapRow(r),
    userName,
  }));
}

const VALID_RETURN_STATUSES: ReturnStatus[] = ["pending", "inspeksi", "layak_jual", "write_off", "ditolak"];

export async function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  inspectionNotes?: string,
): Promise<{ ok: boolean }> {
  const session = await requireAdmin().catch(() => null);
  if (!session) return { ok: false };
  if (!VALID_RETURN_STATUSES.includes(status)) return { ok: false };

  await db
    .update(returns)
    .set({
      status,
      inspectionNotes: inspectionNotes ?? undefined,
      adminId: session.user.id,
      resolvedAt: ["layak_jual", "write_off", "ditolak"].includes(status) ? new Date() : undefined,
    })
    .where(eq(returns.id, id));

  return { ok: true };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function mapRow(r: typeof returns.$inferSelect & { userName?: string | null }): ReturnRow {
  return {
    id: r.id,
    orderId: r.orderId,
    userId: r.userId,
    userName: (r as { userName?: string | null }).userName ?? null,
    reason: r.reason,
    detail: r.detail,
    photos: (r.photos as string[]) ?? [],
    status: r.status,
    inspectionNotes: r.inspectionNotes,
    adminId: r.adminId,
    resolvedAt: r.resolvedAt instanceof Date ? r.resolvedAt.toISOString().slice(0, 10) : (r.resolvedAt ? String(r.resolvedAt).slice(0, 10) : null),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString().slice(0, 10) : String(r.createdAt).slice(0, 10),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString().slice(0, 10) : String(r.updatedAt).slice(0, 10),
  };
}
