"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { fadeInUp, VIEWPORT } from "@/lib/animationVariants";
import { ProductCard, type Product } from "@/components/shop/product-card";

/** Produk dari DB (dipilih server di page.tsx). Dulu 7 produk karangan, termasuk yang tak ada di toko. */
export function FeaturedProducts({ products }: { products: Product[] }) {
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
            {products.map((p) => (
              <CarouselItem key={p.variantId} className="basis-[78%] pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <ProductCard product={p} />
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
