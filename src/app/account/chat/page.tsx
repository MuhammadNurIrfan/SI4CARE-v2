import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { chatMessages, chatThreads, user } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ChatClient } from "./_components/chat-client";
import type { ChatMsg } from "@/actions/chat";

export default async function AccountChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?redirect=/account/chat");

  // Ambil thread open yang ada atau buat baru
  let threadId: string;
  const [existing] = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(and(eq(chatThreads.customerId, session.user.id), eq(chatThreads.status, "open")))
    .orderBy(desc(chatThreads.updatedAt))
    .limit(1);

  if (existing) {
    threadId = existing.id;
  } else {
    threadId = randomUUID();
    await db.insert(chatThreads).values({ id: threadId, customerId: session.user.id });
  }

  // Ambil pesan awal
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
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(chatMessages.createdAt);

  const initialMessages: ChatMsg[] = rows.map((r) => ({
    id: r.id,
    senderId: r.senderId,
    senderName: r.senderName ?? "Unknown",
    body: r.body,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
    isMe: r.senderId === session.user.id,
  }));

  return (
    <ChatClient
      threadId={threadId}
      initialMessages={initialMessages}
      currentUserId={session.user.id}
    />
  );
}
