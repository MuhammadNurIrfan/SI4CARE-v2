"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { PHOTOS } from "./media";
import { fadeInUp, VIEWPORT } from "@/lib/animationVariants";

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] p-8 text-center md:p-16"
        >
          {/* Photo background + brand overlay */}
          <Photo src={PHOTOS.cta} alt="" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, oklch(0.42 0.16 228 / 0.95), oklch(0.40 0.13 200 / 0.92) 55%, oklch(0.45 0.12 176 / 0.90))" }} />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.12]" />

          <div className="relative z-10 mx-auto max-w-2xl text-primary-foreground">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Mulai belanja sekarang</p>
            <h2 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Kebutuhan alat kesehatan Anda, ada di sini.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/85">
              Dari tensimeter untuk keluarga hingga peralatan klinik — lebih dari 500 produk alkes original siap dikirim ke seluruh Indonesia.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/shop">
                <Button size="lg" variant="secondary" className="h-13 w-full gap-2 px-8 text-base font-semibold shadow-lg sm:w-auto">
                  <ShoppingCart className="h-5 w-5" /> Belanja Sekarang
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-13 w-full gap-2 border-white/40 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white sm:w-auto">
                  <Phone className="h-4 w-4" /> Konsultasi Gratis
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/65">
              Butuh pembelian jumlah besar?{" "}
              <Link href="/contact" className="font-medium text-white underline underline-offset-4 hover:text-white/90">
                Hubungi tim B2B kami →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
