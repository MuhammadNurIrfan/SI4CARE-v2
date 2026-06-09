"use client";

import { motion } from "framer-motion";
import { staggerFast, fadeInUp, VIEWPORT } from "@/lib/animationVariants";
import { ShieldCheck, Truck, BadgeCheck, HeartHandshake, Award, Clock } from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    title: "100% Produk Original",
    description: "Asli dari distributor resmi atau langsung principal, lengkap dengan nomor izin edar BPOM/Kemenkes.",
  },
  {
    icon: Truck,
    title: "Pengiriman Cepat & Aman",
    description: "Bermitra dengan JNE, SiCepat, dan J&T. Dikemas khusus, dan dapat dilacak secara real-time.",
  },
  {
    icon: ShieldCheck,
    title: "Garansi Resmi Pabrik",
    description: "Setiap produk bergaransi resmi 1–5 tahun. Klaim mudah dan ditangani langsung oleh tim kami.",
  },
  {
    icon: HeartHandshake,
    title: "Harga Transparan",
    description: "Tanpa biaya tersembunyi. Harga sudah termasuk PPN. Bandingkan dan belanja dengan tenang.",
  },
  {
    icon: Award,
    title: "Pilihan Terlengkap",
    description: "Lebih dari 500 jenis alkes — dari tensimeter rumahan hingga peralatan klinik profesional.",
  },
  {
    icon: Clock,
    title: "Layanan Responsif",
    description: "Tim siap membantu Senin–Sabtu via WhatsApp, telepon, dan email. Respons rata-rata di bawah 1 jam.",
  },
];

export function Benefits() {
  return (
    <section className="border-y bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Keunggulan Kami
          </span>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Mengapa pelanggan memilih si4care?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Mitra terpercaya untuk kebutuhan alat kesehatan keluarga dan institusi medis Anda.
          </p>
        </motion.div>

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="group relative overflow-hidden rounded-3xl border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* hover accent corner */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-[2.4]" />
              <div className="relative">
                <div className="mb-5 grid h-13 w-13 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
