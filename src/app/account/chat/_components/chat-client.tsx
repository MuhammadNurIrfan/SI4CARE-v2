"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Headphones, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages, sendMessage, type ChatMsg } from "@/actions/chat";

type Props = {
  threadId: string;
  initialMessages: ChatMsg[];
  currentUserId: string;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function ChatClient({ threadId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<string | undefined>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].createdAt : undefined,
  );

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Polling setiap 3 detik
  // Dedup menggunakan functional update (prev) bukan stale closure messages
  useEffect(() => {
    const poll = async () => {
      try {
        const newMsgs = await getMessages(threadId, sinceRef.current);
        if (newMsgs.length === 0) return;
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
          if (fresh.length === 0) return prev;
          sinceRef.current = fresh[fresh.length - 1].createdAt;
          return [...prev, ...fresh];
        });
      } catch {
        // polling failure - silent
      }
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [threadId]);

  async function handleSend() {
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await sendMessage(threadId, v);
      setMessages((prev) => [...prev, msg]);
      sinceRef.current = msg.createdAt;
    } catch {
      setText(v);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[480px] flex-col rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Headphones className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">Admin si4care</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online · biasanya balas dalam 5 menit
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/20 p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground pt-8">
            Mulai percakapan — admin kami siap membantu.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                m.isMe
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-background border rounded-bl-sm"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
              <p
                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                  m.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {fmtTime(m.createdAt)}
                {m.isMe && <CheckCheck className="h-3 w-3" />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-3 flex items-end gap-2 bg-background">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Tulis pesan…"
          className="h-10"
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={!text.trim() || sending} className="h-10 gap-1.5">
          <Send className="h-4 w-4" /> Kirim
        </Button>
      </div>
    </div>
  );
}
