"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { fadeInUp, VIEWPORT } from "@/lib/animationVariants";
import { PRODUCT_ART } from "./illustrations";
import { FEATURED_PRODUCTS } from "@/lib/mock-data";

const products = FEATURED_PRODUCTS.map((p) => ({ ...p, Art: PRODUCT_ART[p.art] }));

export function FeaturedProducts() {
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
    }, 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row"
        >
          <div className="max-w-2xl">
            <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">Etalase</span>
            <h2 className="font-heading text-3xl font-bold md:text-4xl">Produk unggulan</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alat kesehatan berkualitas dengan harga terbaik — langsung terhubung dengan stok gudang yang terjamin.
            </p>
          </div>
          <Link href="/shop" className="hidden md:block">
            <Button variant="outline" className="gap-2">Lihat Semua <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </motion.div>

        <Carousel setApi={setApi} opts={{ align: "start", loop: false }}>
          <CarouselContent className="-ml-5">
            {products.map((p, i) => (
              <CarouselItem key={i} className="basis-[78%] pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-accent to-secondary/60">
                    <div className="absolute inset-0 bg-dots opacity-40" />
                    <div className="grid h-full place-items-center">
                      <p.Art className="h-28 w-28 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    {p.badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{p.category}</p>
                    <h3 className="mb-3 line-clamp-2 flex-1 font-semibold leading-snug transition-colors group-hover:text-primary">{p.name}</h3>
                    <div className="mb-4">
                      {p.original && <span className="mr-2 text-sm text-muted-foreground line-through">{p.original}</span>}
                      <span className="text-lg font-extrabold">{p.price}</span>
                    </div>
                    <Button variant="secondary" className="w-full gap-2">
                      <ShoppingCart className="h-4 w-4" /> Tambah
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${i === selected ? "w-7 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50"}`}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center md:hidden">
          <Link href="/shop" className="w-full">
            <Button variant="outline" className="w-full gap-2">Lihat Semua Produk <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
