"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { PHOTOS } from "./media";
import { HeartPulseArt } from "./illustrations";
import { slideInLeft, slideInRight, staggerContainer, fadeInUp, VIEWPORT } from "@/lib/animationVariants";

const points = [
  "Diperiksa keaslian & kelengkapan sebelum dikirim",
  "Disimpan sesuai standar suhu & kelembapan",
  "Sistem batch dengan kontrol tanggal kedaluwarsa",
  "Faktur resmi tersedia untuk klinik & apotek",
];

const stats = [
  { value: "10rb+", label: "Pelanggan" },
  { value: "500+", label: "Produk alkes" },
  { value: "34", label: "Provinsi terjangkau" },
];

export function QualityPromise() {
  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="container mx-auto grid items-center gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Visual */}
        <motion.div variants={slideInLeft} initial="hidden" whileInView="show" viewport={VIEWPORT} className="relative order-last lg:order-first">
          <div className="absolute -left-6 -top-6 -z-10 h-40 w-40 text-primary/10">
            <HeartPulseArt className="h-full w-full" />
          </div>
          <div className="rounded-[2rem] border bg-card p-2 shadow-2xl">
            <Photo
              src={PHOTOS.quality}
              alt="Pengemasan dan kontrol kualitas alat kesehatan si4care"
              className="aspect-[5/4] w-full rounded-[1.6rem]"
            />
          </div>
          <div className="absolute -bottom-6 left-6 grid grid-cols-3 gap-4 rounded-2xl border bg-card/95 px-6 py-4 shadow-xl backdrop-blur">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-xl font-extrabold text-primary">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div variants={slideInRight} initial="hidden" whileInView="show" viewport={VIEWPORT}>
          <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">Komitmen Kualitas</span>
          <h2 className="font-heading text-3xl font-bold leading-tight md:text-4xl">
            Bukan sekadar menjual —<br /> kami menjaga setiap detail.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Setiap produk melewati pemeriksaan keaslian dan penyimpanan terstandar sebelum sampai ke tangan Anda. Kepercayaan keluarga dan tenaga medis adalah prioritas kami.
          </p>

          <motion.ul variants={staggerContainer} initial="hidden" whileInView="show" viewport={VIEWPORT} className="mt-8 space-y-3">
            {points.map((p) => (
              <motion.li key={p} variants={fadeInUp} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/85">{p}</span>
              </motion.li>
            ))}
          </motion.ul>

          <Link href="/about" className="mt-9 inline-block">
            <Button size="lg" variant="outline" className="gap-2">
              Tentang si4care <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
