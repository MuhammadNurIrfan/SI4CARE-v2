"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, VIEWPORT } from "@/lib/animationVariants";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  { name: "Ibu Dewi Kusuma", role: "Ibu Rumah Tangga · Surabaya", initials: "DK", content: "Tensimeter OMRON yang saya beli kondisinya mulus, segel masih utuh, dan lengkap dengan garansi resmi. Pengiriman cepat — 2 hari sudah sampai. Puas banget!" },
  { name: "dr. Aditya Prasetyo", role: "Dokter Umum · Klinik Pratama Sehat", initials: "AP", content: "Saya rutin beli masker dan sarung tangan medis untuk klinik. Kualitas terjaga, harga kompetitif, dan ada faktur untuk pembukuan. Pelayanan responsif." },
  { name: "Bpk. Hendra Wijaya", role: "Caregiver · Jakarta Selatan", initials: "HW", content: "Kursi roda untuk ayah saya tiba dalam kondisi sempurna, terbungkus rapi. CS membantu saya memilih ukuran yang tepat sebelum beli. Sangat merekomendasikan!" },
  { name: "Siti Rahayu, S.Farm.", role: "Apoteker · Apotek Keluarga Sehat", initials: "SR", content: "Sudah langganan untuk kebutuhan alkes apotek. Produk selalu tersedia, pengiriman tepat waktu, dan ada opsi faktur pajak yang memudahkan pembukuan kami." },
  { name: "Ibu Nana Marliana", role: "Pasien Hipertensi · Bandung", initials: "NM", content: "Sudah beli tensimeter 2 kali dan keduanya original. Harganya lebih murah dibanding toko offline. Proses belanja mudah dan ada panduan cara pakainya." },
  { name: "Bpk. Rudi Santoso", role: "Pemilik Home Care · Medan", initials: "RS", content: "Belanja alkes dalam jumlah banyak untuk layanan home care. Tim B2B membantu menegosiasikan harga terbaik dan pengiriman terjadwal. Sangat profesional." },
];

const avatarTints = [
  "bg-primary/12 text-primary",
  "bg-accent text-accent-foreground",
  "bg-primary/12 text-primary",
];

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setSelected(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };
    const raf = requestAnimationFrame(update);
    api.on("select", update);
    api.on("reInit", update);
    const id = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 5000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <section className="overflow-hidden bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">Ulasan Pelanggan</span>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Dipercaya ribuan keluarga &amp; tenaga medis</h2>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="font-bold">4.9</span>
            <span className="text-sm text-muted-foreground">· 2.847 ulasan terverifikasi</span>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-5">
              {testimonials.map((t, i) => (
                <CarouselItem key={i} className="basis-[88%] pl-5 md:basis-1/2 lg:basis-1/3">
                  <figure className="flex h-full flex-col rounded-3xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-lg">
                    <Quote className="h-8 w-8 text-primary/20" />
                    <blockquote className="mt-4 flex-1 leading-relaxed text-foreground/85">
                      {t.content}
                    </blockquote>
                    <div className="mt-3 flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <figcaption className="mt-5 flex items-center gap-3 border-t pt-5">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${avatarTints[i % avatarTints.length]}`}>
                        {t.initials}
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-sm font-semibold">
                          {t.name}
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        </p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </motion.div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => api?.scrollPrev()} aria-label="Sebelumnya">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                aria-label={`Ke ulasan ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === selected ? "w-7 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50"}`}
              />
            ))}
          </div>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => api?.scrollNext()} aria-label="Berikutnya">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
