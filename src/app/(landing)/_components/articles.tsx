"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { PHOTOS } from "./media";
import { staggerFast, fadeInUp, VIEWPORT } from "@/lib/animationVariants";

const articles = [
  {
    img: PHOTOS.article1,
    tag: "Panduan",
    date: "12 Mei 2026",
    title: "Cara memilih tensimeter digital yang akurat untuk di rumah",
    excerpt: "Lengan vs. pergelangan, ukuran manset, dan fitur yang benar-benar penting saat memantau tekanan darah.",
  },
  {
    img: PHOTOS.article2,
    tag: "Kesehatan",
    date: "28 April 2026",
    title: "Menyimpan & merawat alat kesehatan agar awet dan higienis",
    excerpt: "Tips sederhana menjaga nebulizer, oximeter, dan termometer tetap berfungsi optimal.",
  },
  {
    img: PHOTOS.article3,
    tag: "Klinik",
    date: "9 April 2026",
    title: "Checklist perlengkapan medis dasar untuk klinik pratama",
    excerpt: "Daftar alat diagnostik dan habis pakai yang wajib tersedia, beserta estimasi anggarannya.",
  },
];

export function Articles() {
  return (
    <section className="border-t bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row"
        >
          <div className="max-w-2xl">
            <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">Artikel &amp; Edukasi</span>
            <h2 className="font-heading text-3xl font-bold md:text-4xl">Tips kesehatan dari tim kami</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Panduan praktis seputar pemilihan, perawatan, dan penggunaan alat kesehatan.
            </p>
          </div>
          <Link href="/blog" className="hidden md:block">
            <Button variant="outline" className="gap-2">Semua Artikel <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </motion.div>

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {articles.map((a, i) => (
            <motion.article key={i} variants={fadeInUp}>
              <Link href="/blog" className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Photo src={a.img} alt={a.title} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold text-primary shadow backdrop-blur">{a.tag}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                  <h3 className="mt-2 font-heading text-lg font-bold leading-snug transition-colors group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Baca selengkapnya
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-8 flex justify-center md:hidden">
          <Link href="/blog" className="w-full">
            <Button variant="outline" className="w-full gap-2">Semua Artikel <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
