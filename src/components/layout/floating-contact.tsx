"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Headphones } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

/** WhatsApp brand glyph */
function WaIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.582-5.946C.162 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.83 11.83 0 0 1 3.48 8.414c-.003 6.557-5.339 11.892-11.893 11.892a11.9 11.9 0 0 1-5.687-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}

const WA_NUMBER = SITE_CONFIG.whatsapp; // diubah di src/lib/site-config.ts
const WA_PRESET = encodeURIComponent("Halo si4care, saya ingin bertanya tentang produk.");

export function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 print:hidden">
      {/* Menu */}
      {open && (
        <div className="mb-3 w-[260px] origin-bottom-right animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card p-2 shadow-2xl ring-1 ring-black/5">
          <div className="px-2 pt-1.5 pb-2">
            <p className="text-sm font-semibold">Hubungi Kami</p>
            <p className="text-[11px] text-muted-foreground">Pilih kanal yang paling pas.</p>
          </div>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${WA_PRESET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white">
              <WaIcon className="h-4 w-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium">WhatsApp</span>
              <span className="block text-[11px] text-muted-foreground">Respon cepat 08.00–17.00</span>
            </span>
          </a>
          <Link
            href="/account/chat"
            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Headphones className="h-4 w-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium">Room Chat Admin</span>
              <span className="block text-[11px] text-muted-foreground">Riwayat pesan tersimpan</span>
            </span>
          </Link>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Tutup menu kontak" : "Buka menu kontak"}
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40 opacity-60" aria-hidden />
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
