import { getThreadsForAdmin, type ChatThread } from "@/actions/chat";
import { MessagesClient } from "./_components/messages-client";

export default async function AdminMessagesPage() {
  let threads: ChatThread[] = [];
  try {
    threads = await getThreadsForAdmin();
  } catch {}
  return <MessagesClient initialThreads={threads} />;
}
