"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Heart, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useCategories } from "@/context/CategoryContext";
import { PRODUCT_ART, HeartPulseArt } from "@/app/(landing)/_components/illustrations";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  art?: string;
  brand?: string;
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
      variantId: "default",
      variantName: "Standar",
      price: product.price,
      quantity: 1,
      imageColor: "bg-blue-100",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      <Link href={`/shop/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-accent to-secondary/60">
          {categoryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={categoryImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div className="bg-dots absolute inset-0 opacity-40" />
              <div className="grid h-full place-items-center">
                <Art className="h-28 w-28 transition-transform duration-500 group-hover:scale-110" />
              </div>
            </>
          )}

          {/* badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground shadow">−{discount}%</span>
            )}
            {low && <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">Stok {product.stock}</span>}
            {out && <span className="rounded-full bg-muted-foreground px-2.5 py-1 text-[11px] font-bold text-white shadow">Habis</span>}
          </div>

          {/* wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setWished((w) => !w); }}
            aria-label="Simpan ke wishlist"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-muted-foreground shadow backdrop-blur transition-colors hover:text-rose-500"
          >
            <Heart className={`h-4 w-4 ${wished ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <Link href={`/shop/${product.id}`}>
          <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">{product.name}</h3>
        </Link>

        {/* rating */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{(product.rating ?? 4.8).toFixed(1)}</span>
          </span>
          <span>· {product.sold ?? 0} terjual</span>
        </div>

        <div className="mt-3 mb-4 mt-auto">
          {product.originalPrice && (
            <span className="mr-2 text-sm text-muted-foreground line-through">{formatRupiah(product.originalPrice)}</span>
          )}
          <span className="text-lg font-extrabold">{formatRupiah(product.price)}</span>
        </div>

        <Button onClick={handleAdd} disabled={out} variant={added ? "default" : "secondary"} className="w-full gap-2">
          {added ? <><Check className="h-4 w-4" /> Ditambahkan</> : <><ShoppingCart className="h-4 w-4" /> {out ? "Stok Habis" : "Tambah"}</>}
        </Button>
      </div>
    </div>
  );
}
