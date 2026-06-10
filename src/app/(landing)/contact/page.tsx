"use client";

import Link from "next/link";
import { MapPin, Mail, Clock, Headphones, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const WA_NUMBER = "6285555555555";
const WA_PRESET = encodeURIComponent("Halo si4care, saya ingin bertanya tentang produk.");

function WaIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.582-5.946C.162 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.83 11.83 0 0 1 3.48 8.414c-.003 6.557-5.339 11.892-11.893 11.892a11.9 11.9 0 0 1-5.687-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}

export default function ContactPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-14 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <span className="mb-3 block text-xs font-semibold tracking-[0.18em] text-primary uppercase">Hubungi Kami</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Pilih cara tercepat untuk terhubung</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Tim dukungan si4care siap membantu pertanyaan produk, pesanan, hingga kemitraan.
          </p>
        </div>
      </section>

      {/* Primary channels */}
      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* WhatsApp */}
            <Card className="group relative overflow-hidden border-emerald-200/60 transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent" />
              <CardContent className="relative p-6 md:p-7">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <WaIcon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1.5">WhatsApp</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Chat langsung dengan customer service untuk respon cepat. Aktif Senin–Sabtu pukul 08.00–17.00.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  render={<a href={`https://wa.me/${WA_NUMBER}?text=${WA_PRESET}`} target="_blank" rel="noopener noreferrer" />}
                >
                  Chat via WhatsApp <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Room Chat */}
            <Card className="group relative overflow-hidden border-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardContent className="relative p-6 md:p-7">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                  <Headphones className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1.5">Room Chat Admin</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Login akun lalu kirim pesan langsung ke admin. Riwayat percakapan tersimpan di akun Anda.
                </p>
                <Button size="lg" className="w-full gap-2" render={<Link href="/account/chat" />}>
                  Buka Room Chat <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick info — kecil & profesional */}
          <div className="mt-10 rounded-2xl border bg-muted/30 px-5 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Informasi Resmi</p>
            <div className="grid gap-3 text-xs sm:grid-cols-3 sm:gap-6">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Alamat</p>
                  <p className="text-muted-foreground leading-relaxed">Jl. Kesehatan No. 123, Menteng, Jakarta Pusat 10310</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <a href="mailto:hello@si4care.id" className="text-muted-foreground hover:text-primary">hello@si4care.id</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Jam Operasional</p>
                  <p className="text-muted-foreground leading-relaxed">Sen–Jum 08.00–17.00 · Sab 09.00–13.00 WIB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
