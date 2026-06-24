"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useCategories } from "@/context/CategoryContext";
import { PRODUCT_ART, HeartPulseArt } from "@/app/(landing)/_components/illustrations";

export interface Product {
  id: string;
  variantId: string;   // UUID nyata dari DB — wajib untuk checkout
  name: string;
  price: number;
  imageUrl?: string | null;
  originalPrice?: number;
  category: string;
  stock: number;
  art?: string;
  brand?: string | null;
  rating?: number;
  sold?: number;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { getCategoryImage } = useCategories();
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);

  const categoryImage = getCategoryImage(product.category);
  const Art = (product.art && PRODUCT_ART[product.art]) || HeartPulseArt;
  const out = product.stock === 0;
  const low = !out && product.stock <= 5;
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (out) return;
    addItem({
      productId: product.id,
      name: product.name,
      variantId: product.variantId,
      variantName: "Standar",
      price: product.price,
      quantity: 1,
      imageColor: "bg-blue-100",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      <Link href={`/shop/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-accent to-secondary/60">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : categoryImage ? (
            <Image
              src={categoryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div className="bg-dots absolute inset-0 opacity-40" />
              <div className="grid h-full place-items-center">
                <Art className="h-16 w-16 sm:h-28 sm:w-28 transition-transform duration-500 group-hover:scale-110" />
              </div>
            </>
          )}

          {/* badges */}
          <div className="absolute left-1.5 top-1.5 sm:left-3 sm:top-3 flex flex-col gap-1">
            {discount > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-destructive-foreground shadow">−{discount}%</span>
            )}
            {low && <span className="rounded-full bg-amber-500 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-white shadow">Stok {product.stock}</span>}
            {out && <span className="rounded-full bg-muted-foreground px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-white shadow">Habis</span>}
          </div>

          {/* wishlist — sembunyikan di mobile untuk efisiensi ruang */}
          <button
            onClick={(e) => { e.preventDefault(); setWished((w) => !w); }}
            aria-label="Simpan ke wishlist"
            className="hidden sm:grid absolute right-3 top-3 h-9 w-9 place-items-center rounded-full bg-card/90 text-muted-foreground shadow backdrop-blur transition-colors hover:text-rose-500"
          >
            <Heart className={`h-4 w-4 ${wished ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-5">
        <p className="mb-0.5 sm:mb-1.5 text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">{product.category}</p>
        <Link href={`/shop/${product.id}`}>
          <h3 className="line-clamp-2 text-xs sm:text-base font-semibold leading-snug transition-colors group-hover:text-primary">{product.name}</h3>
        </Link>

        {/* rating */}
        <div className="mt-1 sm:mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{(product.rating ?? 4.8).toFixed(1)}</span>
          </span>
          <span className="truncate">· {product.sold ?? 0} terjual</span>
        </div>

        <div className="mt-1.5 sm:mt-3 mb-2 sm:mb-4 mt-auto flex flex-wrap items-baseline gap-x-1.5">
          {product.originalPrice && (
            <span className="text-[10px] sm:text-sm text-muted-foreground line-through">{formatRupiah(product.originalPrice)}</span>
          )}
          <span className="text-sm sm:text-lg font-extrabold">{formatRupiah(product.price)}</span>
        </div>

        <Button onClick={handleAdd} disabled={out} variant={added ? "default" : "secondary"} size="sm" className="w-full gap-1 sm:gap-2 h-8 sm:h-9 text-[11px] sm:text-sm px-2">
          {added ? <><Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="truncate">Ditambahkan</span></> : <><ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="truncate">{out ? "Habis" : "Tambah"}</span></>}
        </Button>
      </div>
    </div>
  );
}
