"use server";

import { randomUUID } from "crypto";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, chatThreads, user } from "@/lib/db/schema";
import { requireAdmin, requireSession } from "@/lib/server-auth";

export type ChatMsg = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  isMe: boolean;
};

export type ChatThread = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: "open" | "closed";
  updatedAt: string;
  lastBody: string | null;
  unread: number;
};

/** Customer: ambil thread open yang ada atau buat baru. */
export async function getOrCreateMyThread(): Promise<string> {
  const session = await requireSession();
  const existing = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(
      and(
        eq(chatThreads.customerId, session.user.id),
        eq(chatThreads.status, "open"),
      ),
    )
    .orderBy(desc(chatThreads.updatedAt))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const id = randomUUID();
  await db.insert(chatThreads).values({ id, customerId: session.user.id });
  return id;
}

/** Kirim pesan — bisa dari customer maupun admin. */
export async function sendMessage(threadId: string, body: string): Promise<ChatMsg> {
  const session = await requireSession();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Pesan tidak boleh kosong");
  if (trimmed.length > 2000) throw new Error("Pesan terlalu panjang");

  const [thread] = await db
    .select({ customerId: chatThreads.customerId })
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId))
    .limit(1);
  if (!thread) throw new Error("Thread tidak ditemukan");

  const isAdmin = ["admin", "super_admin"].includes(session.user.role as string);
  if (!isAdmin && thread.customerId !== session.user.id) throw new Error("Akses ditolak");

  const id = randomUUID();
  const now = new Date();
  await db.insert(chatMessages).values({ id, threadId, senderId: session.user.id, body: trimmed });
  await db.update(chatThreads).set({ updatedAt: now }).where(eq(chatThreads.id, threadId));

  return {
    id,
    senderId: session.user.id,
    senderName: session.user.name,
    body: trimmed,
    isRead: false,
    createdAt: now.toISOString(),
    isMe: true,
  };
}

/** Ambil pesan di satu thread; `since` = ISO string batas waktu untuk polling. */
export async function getMessages(threadId: string, since?: string): Promise<ChatMsg[]> {
  const session = await requireSession();

  const [thread] = await db
    .select({ customerId: chatThreads.customerId })
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId))
    .limit(1);
  if (!thread) return [];

  const isAdmin = ["admin", "super_admin"].includes(session.user.role as string);
  if (!isAdmin && thread.customerId !== session.user.id) return [];

  const rows = await db
    .select({
      id: chatMessages.id,
      senderId: chatMessages.senderId,
      senderName: user.name,
      body: chatMessages.body,
      isRead: chatMessages.isRead,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .leftJoin(user, eq(chatMessages.senderId, user.id))
    .where(
      since
        ? and(eq(chatMessages.threadId, threadId), gt(chatMessages.createdAt, new Date(since)))
        : eq(chatMessages.threadId, threadId),
    )
    .orderBy(chatMessages.createdAt);

  // Mark unread messages as read (fire-and-forget)
  db.update(chatMessages)
    .set({ isRead: true })
    .where(and(eq(chatMessages.threadId, threadId), eq(chatMessages.isRead, false)))
    .catch(() => {});

  return rows.map((r) => ({
    id: r.id,
    senderId: r.senderId,
    senderName: r.senderName ?? "Unknown",
    body: r.body,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
    isMe: r.senderId === session.user.id,
  }));
}

/** Admin: ambil semua thread + last message + jumlah unread. */
export async function getThreadsForAdmin(): Promise<ChatThread[]> {
  const session = await requireAdmin();

  const threads = await db
    .select({
      id: chatThreads.id,
      customerId: chatThreads.customerId,
      customerName: user.name,
      customerEmail: user.email,
      status: chatThreads.status,
      updatedAt: chatThreads.updatedAt,
    })
    .from(chatThreads)
    .leftJoin(user, eq(chatThreads.customerId, user.id))
    .orderBy(desc(chatThreads.updatedAt));

  if (threads.length === 0) return [];

  const threadIds = threads.map((t) => t.id);
  const allMsgs = await db
    .select({
      threadId: chatMessages.threadId,
      body: chatMessages.body,
      isRead: chatMessages.isRead,
      senderId: chatMessages.senderId,
    })
    .from(chatMessages)
    .where(inArray(chatMessages.threadId, threadIds))
    .orderBy(chatMessages.createdAt);

  const lastBodyMap: Record<string, string> = {};
  const unreadMap: Record<string, number> = {};
  for (const m of allMsgs) {
    lastBodyMap[m.threadId] = m.body;
    if (!m.isRead && m.senderId !== session.user.id) {
      unreadMap[m.threadId] = (unreadMap[m.threadId] ?? 0) + 1;
    }
  }

  return threads.map((t) => ({
    id: t.id,
    customerId: t.customerId,
    customerName: t.customerName ?? t.customerEmail ?? "Pelanggan",
    customerEmail: t.customerEmail ?? "",
    status: t.status as "open" | "closed",
    updatedAt: t.updatedAt.toISOString(),
    lastBody: lastBodyMap[t.id] ?? null,
    unread: unreadMap[t.id] ?? 0,
  }));
}

/** Admin: tutup thread. */
export async function closeThread(threadId: string): Promise<void> {
  await requireAdmin();
  await db
    .update(chatThreads)
    .set({ status: "closed" })
    .where(eq(chatThreads.id, threadId));
}
