"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { PHOTOS } from "./media";
import {
  TensimeterArt,
  OximeterArt,
  WheelchairArt,
  ThermometerArt,
  NebulizerArt,
  MaskArt,
} from "./illustrations";
import { staggerContainer, fadeInUp, blurReveal, scaleIn } from "@/lib/animationVariants";
import { useContent } from "@/context/ContentContext";

const categories = [
  { label: "Tensimeter", Art: TensimeterArt },
  { label: "Nebulizer", Art: NebulizerArt },
  { label: "Kursi Roda", Art: WheelchairArt },
  { label: "Termometer", Art: ThermometerArt },
  { label: "Oximeter", Art: OximeterArt },
  { label: "APD & Masker", Art: MaskArt },
];

const trust = [
  { icon: ShieldCheck, text: "Original & bergaransi resmi" },
  { icon: Truck, text: "Kirim seluruh Indonesia" },
  { icon: Star, text: "10.000+ pelanggan puas" },
];

export function Hero() {
  const { content } = useContent();
  const hero = content.hero;
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-[460px] w-[460px] translate-x-1/4 rounded-full blur-3xl" style={{ background: "oklch(0.50 0.16 228 / 0.10)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[380px] w-[380px] -translate-x-1/4 rounded-full blur-3xl" style={{ background: "oklch(0.55 0.12 176 / 0.10)" }} />

      <div className="container mx-auto grid items-center gap-12 px-4 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* ── Copy ── */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <BadgeCheck className="h-4 w-4" />
            {hero.badge}
          </motion.div>

          <motion.h1 variants={blurReveal} className="font-heading text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]">
            {hero.title.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
            <span className="text-gradient-brand">{hero.titleHighlight}</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {hero.subtitle}
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop">
              <Button size="lg" className="h-13 w-full px-8 text-base shadow-lg sm:w-auto" style={{ boxShadow: "0 10px 30px -8px oklch(0.50 0.16 228 / 0.45)" }}>
                {hero.ctaPrimary} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-to-buy">
              <Button size="lg" variant="outline" className="h-13 w-full px-8 text-base sm:w-auto">
                {hero.ctaSecondary}
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-9 flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-7">
            {trust.map((t) => (
              <div key={t.text} className="flex items-center gap-2">
                <t.icon className="h-4 w-4 shrink-0 text-primary" />
                <span>{t.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Visual ── */}
        <motion.div variants={scaleIn} initial="hidden" animate="show" className="relative mx-auto w-full max-w-md lg:max-w-none">
          {/* Main framed photo */}
          <div className="relative rounded-[2rem] border border-border/70 bg-card p-2 shadow-2xl">
            <Photo
              src={PHOTOS.hero}
              alt="Perawatan kesehatan di rumah bersama si4care"
              className="aspect-[4/5] w-full rounded-[1.6rem]"
            />
            {/* gradient veil for legibility of floating cards */}
            <div className="pointer-events-none absolute inset-2 rounded-[1.6rem] ring-1 ring-inset ring-black/5" />
          </div>

          {/* Floating stat card */}
          <div className="absolute -left-3 top-10 flex items-center gap-3 rounded-2xl border bg-card/95 p-3 pr-4 shadow-xl backdrop-blur animate-float">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent">
              <TensimeterArt className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">500+ produk</p>
              <p className="mt-1 text-xs text-muted-foreground">alkes original</p>
            </div>
          </div>

          {/* Floating rating card */}
          <div className="absolute -right-3 bottom-12 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur animate-bounce-slow">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-1.5 text-2xl font-extrabold leading-none">4.9<span className="text-sm font-medium text-muted-foreground">/5</span></p>
            <p className="mt-1 text-xs text-muted-foreground">2.847 ulasan</p>
          </div>
        </motion.div>
      </div>

      {/* ── Category quick links ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="container mx-auto mt-14 px-4 md:mt-16 md:px-6"
      >
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Telusuri berdasarkan kategori
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Link key={c.label} href="/shop" className="group flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <c.Art className="h-7 w-7 transition-transform group-hover:scale-110" />
              {c.label}
            </Link>
          ))}
          <Link href="/shop" className="flex items-center gap-1.5 rounded-2xl border border-dashed bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
            Semua Kategori <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
