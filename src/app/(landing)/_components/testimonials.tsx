"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, VIEWPORT } from "@/lib/animationVariants";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useContent } from "@/context/ContentContext";

/** Inisial otomatis dari nama, mis. "Ibu Dewi Kusuma" → "DK" */
function getInitials(name: string) {
  const words = name.replace(/[.,]/g, "").split(/\s+/).filter((w) => !["ibu", "bpk", "dr", "bapak"].includes(w.toLowerCase()));
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "??";
}

const avatarTints = [
  "bg-primary/12 text-primary",
  "bg-accent text-accent-foreground",
  "bg-primary/12 text-primary",
];

export function Testimonials() {
  const { content } = useContent();
  const testimonials = content.testimonials;
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
                        {getInitials(t.name)}
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
