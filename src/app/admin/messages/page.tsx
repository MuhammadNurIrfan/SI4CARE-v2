"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Search, CheckCheck, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Msg { id: string; from: "me" | "user"; text: string; time: string; }
interface Thread {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  online: boolean;
  msgs: Msg[];
}

const seedThreads: Thread[] = [
  {
    id: "t1", name: "Budi Santoso", avatar: "BS", lastMsg: "Apakah stok nebulizer masih ada?", lastTime: "09:15", unread: 2, online: true,
    msgs: [
      { id: "m1", from: "user", text: "Halo, saya mau tanya ketersediaan Nebulizer Omron NE-C28.", time: "09:14" },
      { id: "m2", from: "user", text: "Apakah stok nebulizer masih ada?", time: "09:15" },
    ],
  },
  {
    id: "t2", name: "Sinta Lestari", avatar: "SL", lastMsg: "Terima kasih kak, sudah saya transfer.", lastTime: "08:42", unread: 0, online: false,
    msgs: [
      { id: "m1", from: "user", text: "Kak konfirmasi pesanan TKP/0606/2210 ya.", time: "08:30" },
      { id: "m2", from: "me",   text: "Baik kak, sudah kami terima. Mohon ditunggu prosesnya ya.", time: "08:35" },
      { id: "m3", from: "user", text: "Terima kasih kak, sudah saya transfer.", time: "08:42" },
    ],
  },
  {
    id: "t3", name: "Andi Saputra", avatar: "AS", lastMsg: "Bisa kirim hari ini ga kak?", lastTime: "Kemarin", unread: 1, online: false,
    msgs: [
      { id: "m1", from: "user", text: "Bisa kirim hari ini ga kak?", time: "Kemarin" },
    ],
  },
  {
    id: "t4", name: "Maria Putri", avatar: "MP", lastMsg: "Oke siap, terima kasih informasinya.", lastTime: "2 hari", unread: 0, online: false,
    msgs: [
      { id: "m1", from: "user", text: "Garansi tensimeter Omron berapa lama ya?", time: "2 hari" },
      { id: "m2", from: "me",   text: "Garansi resmi distributor 1 tahun untuk unit & 2 tahun untuk mesin kak.", time: "2 hari" },
      { id: "m3", from: "user", text: "Oke siap, terima kasih informasinya.", time: "2 hari" },
    ],
  },
];

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>(seedThreads);
  const [activeId, setActiveId] = useState<string | null>(seedThreads[0]?.id ?? null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => threads.find(t => t.id === activeId) ?? null, [threads, activeId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return threads;
    return threads.filter(t => t.name.toLowerCase().includes(q) || t.lastMsg.toLowerCase().includes(q));
  }, [threads, search]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.msgs.length, activeId]);

  function openThread(id: string) {
    setActiveId(id);
    setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: 0 } : t));
  }

  function send() {
    const v = text.trim();
    if (!v || !active) return;
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setThreads(prev => prev.map(t => t.id === active.id ? {
      ...t,
      lastMsg: v,
      lastTime: time,
      msgs: [...t.msgs, { id: String(Date.now()), from: "me", text: v, time }],
    } : t));
    setText("");
  }

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <div className="p-3 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Pesan Pelanggan
            {totalUnread > 0 && <Badge className="bg-destructive text-white">{totalUnread} baru</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Balas pesan dari room chat pelanggan secara real-time.</p>
        </div>
      </div>

      <div className="grid h-[calc(100dvh-12rem)] min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[320px_1fr]">
        {/* List */}
        <div className={`flex min-h-0 flex-col border-r ${active && "max-md:hidden"}`}>
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari pelanggan…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada percakapan</p>
            )}
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className={`flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-muted/60 ${activeId === t.id ? "bg-muted/80" : ""}`}
              >
                <div className="relative shrink-0">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary text-sm">{t.avatar}</div>
                  {t.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{t.lastTime}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.lastMsg}</p>
                </div>
                {t.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{t.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div className={`flex min-h-0 flex-col ${!active && "max-md:hidden"}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b p-3">
                <Button variant="ghost" size="icon" className="md:hidden -ml-1" onClick={() => setActiveId(null)} aria-label="Kembali">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{active.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{active.name}</p>
                  <p className="text-[11px] text-muted-foreground">{active.online ? "Online" : "Offline"}</p>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 bg-muted/20 p-4">
                {active.msgs.map(m => (
                  <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border rounded-bl-sm"}`}>
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {m.time}{m.from === "me" && <CheckCheck className="h-3 w-3" />}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-2 border-t bg-background p-3">
                <Input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Tulis balasan…"
                  className="h-10"
                />
                <Button onClick={send} disabled={!text.trim()} className="h-10 gap-1.5">
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
