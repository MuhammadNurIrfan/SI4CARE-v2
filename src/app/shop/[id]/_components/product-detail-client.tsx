"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Minus, Plus, ShoppingCart, Share2, Check, ShieldCheck, Truck, BadgeCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/context/CartContext";
import { PRODUCT_ART, HeartPulseArt } from "@/app/(landing)/_components/illustrations";
import { artKeyFor } from "@/lib/product-art";
import type { ShopProductDetail } from "@/lib/shop-queries";

const benefits = [
  { icon: BadgeCheck, text: "100% Original" },
  { icon: ShieldCheck, text: "Garansi Resmi" },
  { icon: Truck, text: "Kirim Nasional" },
  { icon: RotateCcw, text: "Retur Mudah" },
];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

/**
 * Detail produk dari DB. Dulu halaman ini mengabaikan ID di URL dan selalu menampilkan
 * satu produk demo (lengkap dengan rating, ulasan, dan jumlah "terjual" karangan) —
 * tombol keranjangnya bahkan menambahkan item ber-ID palsu yang ditolak saat checkout.
 * Rating/ulasan/terjual tidak ada di DB, jadi tidak ditampilkan.
 */
export function ProductDetailClient({ product }: { product: ShopProductDetail }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const outOfStock = variant.stock <= 0;
  const heroImage = product.imageUrl || product.categoryImageUrl;
  const Art = PRODUCT_ART[artKeyFor(product.name)] ?? HeartPulseArt;

  const changeQty = (t: "inc" | "dec") => {
    if (t === "inc" && quantity < variant.stock) setQuantity((q) => q + 1);
    else if (t === "dec" && quantity > 1) setQuantity((q) => q - 1);
  };

  const addToCart = () => {
    if (outOfStock) return false;
    addItem({
      productId: product.id,
      name: product.name,
      variantId: variant.id,
      variantName: product.variants.length > 1 ? variant.name : "Standar",
      price: variant.price,
      quantity,
      imageColor: "bg-blue-100",
    });
    return true;
  };

  const handleAdd = () => {
    if (!addToCart()) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (addToCart()) router.push("/cart");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard diblokir (mis. konteks tidak aman) — abaikan */
    }
  };

  const specs: Array<{ label: string; value: string }> = [
    ...(product.brand ? [{ label: "Merek", value: product.brand }] : []),
    { label: "Kategori", value: product.category },
    { label: "SKU", value: variant.sku },
    ...Object.entries(variant.attributes).map(([k, v]) => ({
      label: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Beranda</Link>
        <ChevronRight className="mx-1.5 h-4 w-4" />
        <Link href="/shop" className="hover:text-foreground">Katalog</Link>
        <ChevronRight className="mx-1.5 h-4 w-4" />
        <span className="max-w-[180px] truncate font-medium text-foreground sm:max-w-none">{product.name}</span>
      </nav>

      <div className="mb-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gambar */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border bg-gradient-to-br from-accent to-secondary/60">
          {heroImage ? (
            <Image src={heroImage} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover" />
          ) : (
            <>
              <div className="bg-dots absolute inset-0 opacity-40" />
              <div className="grid h-full place-items-center">
                <Art className="h-56 w-56" />
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{product.brand ?? " "}</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              onClick={handleShare}
              aria-label="Salin tautan produk"
            >
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Share2 className="h-5 w-5" />}
            </Button>
          </div>

          <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="secondary">{product.category}</Badge>
            {copied && <span className="text-xs text-emerald-600" role="status">Tautan disalin</span>}
          </div>

          <div className="mt-5 rounded-2xl bg-muted/40 p-4">
            <p className="font-heading text-3xl font-extrabold text-primary">{formatRupiah(variant.price)}</p>
          </div>

          {/* Varian — hanya bila ada lebih dari satu */}
          {product.variants.length > 1 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold">Pilih Varian</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setVariantId(v.id); setQuantity(1); }}
                    aria-pressed={variantId === v.id}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${variantId === v.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "hover:border-primary/50"} ${v.stock <= 0 ? "opacity-60" : ""}`}
                  >
                    {v.name}
                    {v.stock <= 0 && <span className="ml-2 text-xs text-muted-foreground">Habis</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Jumlah + stok */}
          <div className="mt-6 flex items-end gap-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Jumlah</h3>
              <div className="flex w-fit items-center rounded-xl border">
                <Button variant="ghost" size="icon" aria-label="Kurangi jumlah" onClick={() => changeQty("dec")} disabled={quantity <= 1 || outOfStock} className="h-10 w-10 rounded-none rounded-l-xl"><Minus className="h-4 w-4" /></Button>
                <div className="w-14 text-center text-sm font-bold" aria-live="polite">{quantity}</div>
                <Button variant="ghost" size="icon" aria-label="Tambah jumlah" onClick={() => changeQty("inc")} disabled={quantity >= variant.stock || outOfStock} className="h-10 w-10 rounded-none rounded-r-xl"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="flex-1 text-sm text-muted-foreground">
              {outOfStock ? (
                <span className="font-bold text-destructive">Stok habis</span>
              ) : (
                <>Sisa stok: <span className={`font-bold ${variant.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>{variant.stock}</span> unit</>
              )}
            </p>
          </div>

          {/* Aksi */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="outline" className="h-12 flex-1 gap-2 text-base" onClick={handleAdd} disabled={outOfStock}>
              {added ? <><Check className="h-5 w-5 text-emerald-500" /> Ditambahkan!</> : <><ShoppingCart className="h-5 w-5" /> Keranjang</>}
            </Button>
            <Button size="lg" className="h-12 flex-1 text-base" onClick={handleBuyNow} disabled={outOfStock}>Beli Langsung</Button>
          </div>

          {/* Keunggulan */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.text} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 text-center">
                <b.icon className="h-5 w-5 text-primary" />
                <span className="text-[11px] font-medium leading-tight text-muted-foreground">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab */}
      <Tabs defaultValue="description" className="gap-5">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList variant="line" className="w-max justify-start border-b">
            <TabsTrigger value="description" className="px-4 sm:px-5 whitespace-nowrap">Deskripsi</TabsTrigger>
            <TabsTrigger value="specs" className="px-4 sm:px-5 whitespace-nowrap">Spesifikasi</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="description" className="pt-4">
          <div className="max-w-3xl">
            {product.description ? (
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
            ) : (
              <p className="text-muted-foreground">Belum ada deskripsi untuk produk ini.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="specs" className="pt-4">
          <div className="max-w-3xl overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <tbody>
                {specs.map((s) => (
                  <tr key={s.label} className="border-b last:border-0">
                    <th className="w-1/3 bg-muted/30 px-4 py-3 font-medium">{s.label}</th>
                    <td className="px-4 py-3 text-muted-foreground">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
