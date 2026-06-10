"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Headphones, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Msg { id: string; from: "me" | "admin"; text: string; time: string; }

const seed: Msg[] = [
  { id: "1", from: "admin", text: "Halo, terima kasih sudah menghubungi si4care. Ada yang bisa kami bantu?", time: "09:12" },
  { id: "2", from: "me",    text: "Halo, saya mau tanya ketersediaan Nebulizer Omron NE-C28.", time: "09:14" },
  { id: "3", from: "admin", text: "Stok tersedia 8 unit kak, garansi resmi 1 tahun. Boleh kami bantu order?", time: "09:15" },
];

const adminReplies = [
  "Baik kak, kami cek dulu ya.",
  "Mohon ditunggu sebentar.",
  "Tim kami akan follow up segera.",
  "Ada hal lain yang bisa kami bantu?",
];

export default function AccountChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  function send() {
    const v = text.trim();
    if (!v) return;
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setMsgs(p => [...p, { id: String(Date.now()), from: "me", text: v, time }]);
    setText("");
    setTimeout(() => {
      const reply = adminReplies[Math.floor(Math.random() * adminReplies.length)];
      const t = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      setMsgs(p => [...p, { id: String(Date.now() + 1), from: "admin", text: reply, time: t }]);
    }, 1200);
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
        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border rounded-bl-sm"}`}>
              <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
              <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {m.time}{m.from === "me" && <CheckCheck className="h-3 w-3" />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-3 flex items-end gap-2 bg-background">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Tulis pesan…"
          className="h-10"
        />
        <Button onClick={send} disabled={!text.trim()} className="h-10 gap-1.5">
          <Send className="h-4 w-4" /> Kirim
        </Button>
      </div>
    </div>
  );
}
