"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Search, CheckCheck, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  closeThread,
  getMessages,
  getThreadsForAdmin,
  sendMessage,
  type ChatMsg,
  type ChatThread,
} from "@/actions/chat";

type Props = { initialThreads: ChatThread[] };

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function MessagesClient({ initialThreads }: Props) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<string | undefined>(undefined);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.customerName.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q) ||
        (t.lastBody ?? "").toLowerCase().includes(q),
    );
  }, [threads, search]);

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  // Load messages ketika thread aktif berubah
  // sinceRef di-set ke waktu sekarang SEBELUM async load agar poll tidak overlap
  useEffect(() => {
    if (!activeId) return;
    sinceRef.current = new Date().toISOString();
    setMessages([]);
    getMessages(activeId).then((msgs) => {
      setMessages(msgs);
      if (msgs.length > 0) {
        sinceRef.current = msgs[msgs.length - 1].createdAt;
      }
      setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, unread: 0 } : t)));
    }).catch(() => {});
  }, [activeId]);

  // Polling pesan aktif + daftar thread setiap 3 detik
  // Dedup via functional update(prev) — tidak ada stale closure
  useEffect(() => {
    const pollMessages = async () => {
      if (!activeId) return;
      try {
        const newMsgs = await getMessages(activeId, sinceRef.current);
        if (newMsgs.length === 0) return;
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
          if (fresh.length === 0) return prev;
          sinceRef.current = fresh[fresh.length - 1].createdAt;
          return [...prev, ...fresh];
        });
      } catch {}
    };
    const pollThreads = async () => {
      try {
        const updated = await getThreadsForAdmin();
        setThreads((prev) => {
          const activeThread = prev.find((t) => t.id === activeId);
          return updated.map((t) =>
            t.id === activeId ? { ...t, unread: 0, status: activeThread?.status ?? t.status } : t,
          );
        });
      } catch {}
    };
    const id = setInterval(async () => {
      await pollMessages();
      await pollThreads();
    }, 3000);
    return () => clearInterval(id);
  }, [activeId]);

  async function handleSend() {
    const v = text.trim();
    if (!v || !activeId || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await sendMessage(activeId, v);
      setMessages((prev) => [...prev, msg]);
      sinceRef.current = msg.createdAt;
      setThreads((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, lastBody: v, updatedAt: msg.createdAt } : t)),
      );
    } catch {
      setText(v);
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (!activeId) return;
    await closeThread(activeId).catch(() => {});
    setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: "closed" } : t)));
  }

  return (
    <div className="p-3 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Pesan Pelanggan
            {totalUnread > 0 && (
              <Badge className="bg-destructive text-white">{totalUnread} baru</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Balas pesan dari room chat pelanggan secara real-time.
          </p>
        </div>
      </div>

      <div className="grid h-[calc(100dvh-12rem)] min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[320px_1fr]">
        {/* Thread list */}
        <div className={`flex min-h-0 flex-col border-r ${active ? "max-md:hidden" : ""}`}>
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari pelanggan…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {threads.length === 0 ? "Belum ada percakapan" : "Tidak ditemukan"}
              </p>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-muted/60 ${
                  activeId === t.id ? "bg-muted/80" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
                    {initials(t.customerName)}
                  </div>
                  {t.status === "open" && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{t.customerName}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {fmtTime(t.updatedAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.lastBody ?? "Belum ada pesan"}
                  </p>
                </div>
                {t.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div className={`flex min-h-0 flex-col ${!active ? "max-md:hidden" : ""}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden -ml-1"
                  onClick={() => setActiveId(null)}
                  aria-label="Kembali"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
                  {initials(active.customerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {active.customerName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{active.customerEmail}</p>
                </div>
                {active.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={handleClose}
                  >
                    Tutup
                  </Button>
                )}
                {active.status === "closed" && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Ditutup
                  </Badge>
                )}
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-3 bg-muted/20 p-4"
              >
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground pt-8">
                    Belum ada pesan di percakapan ini.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
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

              <div className="flex items-end gap-2 border-t bg-background p-3">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    active.status === "closed" ? "Thread ini sudah ditutup" : "Tulis balasan…"
                  }
                  className="h-10"
                  disabled={sending || active.status === "closed"}
                />
                <Button
                  onClick={handleSend}
                  disabled={!text.trim() || sending || active.status === "closed"}
                  className="h-10 gap-1.5"
                >
                  <Send className="h-4 w-4" /> Kirim
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <MessageSquare className="h-10 w-10 opacity-30" />
              <p className="text-sm">Pilih percakapan untuk mulai membalas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
