"use client";

import { motion } from "framer-motion";
import { staggerContainer, slideInLeft, slideInRight, VIEWPORT } from "@/lib/animationVariants";
import { Search, ShoppingCart, CreditCard, Package, Check } from "lucide-react";
import { TensimeterArt, NebulizerArt, OximeterArt, MaskArt } from "./illustrations";

const steps = [
  { icon: Search, title: "Temukan Produk", desc: "Cari alkes yang Anda butuhkan lewat katalog lengkap. Filter berdasarkan kategori, merek, atau harga.", num: "01" },
  { icon: ShoppingCart, title: "Tambah ke Keranjang", desc: "Pilih varian, tentukan jumlah, lalu tinjau ringkasan pesanan sebelum lanjut.", num: "02" },
  { icon: CreditCard, title: "Bayar dengan Mudah", desc: "Transfer bank, QRIS, kartu kredit, atau dompet digital — aman dan terenkripsi.", num: "03" },
  { icon: Package, title: "Terima di Rumah", desc: "Dikemas aman dan dikirim kurir terpercaya. Lacak paket Anda secara real-time.", num: "04" },
];

const mockCards = [
  { name: "Tensimeter OMRON", price: "Rp 540.000", badge: "Terlaris", Art: TensimeterArt },
  { name: "Nebulizer NE-C28", price: "Rp 620.000", badge: "Original", Art: NebulizerArt },
  { name: "Pulse Oximeter", price: "Rp 175.000", badge: "Stok Ada", Art: OximeterArt },
  { name: "Masker 3-ply", price: "Rp 35.000", badge: "Hemat", Art: MaskArt },
];

export function HowItWorks() {
  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">Cara Belanja</span>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Belanja alkes semudah 4 langkah</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Proses simpel, cepat, dan transparan — dari pilih produk hingga tiba di tangan Anda.
          </p>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={VIEWPORT} className="space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={slideInLeft}
                className="group flex items-start gap-5 rounded-2xl p-4 transition-colors hover:bg-muted/50"
              >
                <div className="relative shrink-0">
                  <div className="grid h-13 w-13 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-heading text-xs font-bold text-primary/60">{step.num}</span>
                    <h3 className="font-heading text-lg font-bold">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Visual mock */}
          <motion.div variants={slideInRight} initial="hidden" whileInView="show" viewport={VIEWPORT} className="relative">
            <div className="grid grid-cols-2 gap-3 rounded-3xl border bg-muted/30 p-5 shadow-xl">
              {mockCards.map((p, i) => (
                <div key={i} className="rounded-2xl border bg-card p-3 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="mb-3 grid h-24 place-items-center rounded-xl bg-accent">
                    <p.Art className="h-16 w-16" />
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{p.badge}</span>
                  <p className="mt-2 text-xs font-semibold leading-tight">{p.name}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{p.price}</p>
                </div>
              ))}
            </div>

            <div className="absolute -bottom-5 -right-3 hidden items-center gap-2.5 rounded-2xl border bg-card p-3 shadow-2xl animate-bounce-slow md:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Pesanan dikonfirmasi</p>
                <p className="text-xs text-muted-foreground">Estimasi tiba 1–3 hari</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
