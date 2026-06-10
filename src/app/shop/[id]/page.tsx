"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingCart, Heart, Share2, Check, Star, ShieldCheck, Truck, BadgeCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { PRODUCT_ART } from "@/app/(landing)/_components/illustrations";

const productData = {
  id: "1",
  name: "Tensimeter Digital Omron HEM-7120",
  description:
    "OMRON HEM-7120 adalah tensimeter digital lengan atas dengan teknologi IntelliSense yang memberikan pembacaan cepat, nyaman, dan akurat. Dirancang khusus untuk pemantauan tekanan darah harian di rumah.",
  brand: "Omron",
  category: "Alat Diagnostik",
  art: "tensimeter",
  rating: 4.9,
  reviews: 124,
  sold: 324,
  variants: [
    { id: "v1", name: "Standar (Tanpa Adaptor)", price: 540000, originalPrice: 620000, stock: 15 },
    { id: "v2", name: "Paket + Adaptor", price: 650000, originalPrice: 700000, stock: 8 },
  ],
  specs: [
    { label: "Metode Pengukuran", value: "Oscillometric" },
    { label: "Rentang Pengukuran", value: "Tekanan 0–299 mmHg · Nadi 40–180/menit" },
    { label: "Akurasi", value: "Tekanan ±3 mmHg · Nadi ±5%" },
    { label: "Baterai", value: "4× AA" },
    { label: "Garansi", value: "5 Tahun Resmi Omron" },
  ],
  features: [
    "Lampu indikator pemakaian manset",
    "Indikator tingkat tekanan darah",
    "Deteksi detak jantung tidak beraturan",
    "Memori pengukuran terakhir",
  ],
};

const tints = [
  "from-accent to-secondary/60",
  "from-secondary/60 to-accent",
  "from-blue-50 to-teal-50",
  "from-teal-50 to-blue-50",
];

const benefits = [
  { icon: BadgeCheck, text: "100% Original" },
  { icon: ShieldCheck, text: "Garansi 5 Thn" },
  { icon: Truck, text: "Kirim Nasional" },
  { icon: RotateCcw, text: "Retur Mudah" },
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  use(params);
  const [variantId, setVariantId] = useState(productData.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const { addItem } = useCart();

  const variant = productData.variants.find((v) => v.id === variantId) || productData.variants[0];
  const Art = PRODUCT_ART[productData.art];
  const discount = variant.originalPrice ? Math.round((1 - variant.price / variant.originalPrice) * 100) : 0;

  const formatRupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const changeQty = (t: "inc" | "dec") => {
    if (t === "inc" && quantity < variant.stock) setQuantity((q) => q + 1);
    else if (t === "dec" && quantity > 1) setQuantity((q) => q - 1);
  };

  const handleAdd = () => {
    addItem({
      productId: productData.id,
      name: productData.name,
      variantId: variant.id,
      variantName: variant.name,
      price: variant.price,
      quantity,
      imageColor: "bg-blue-100",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Beranda</Link>
        <ChevronRight className="mx-1.5 h-4 w-4" />
        <Link href="/shop" className="hover:text-foreground">Katalog</Link>
        <ChevronRight className="mx-1.5 h-4 w-4" />
        <span className="max-w-[180px] truncate font-medium text-foreground sm:max-w-none">{productData.name}</span>
      </nav>

      <div className="mb-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="space-y-4">
          <div className={`relative aspect-square overflow-hidden rounded-3xl border bg-gradient-to-br ${tints[imgIdx]}`}>
            <div className="bg-dots absolute inset-0 opacity-40" />
            <div className="grid h-full place-items-center">
              <Art className="h-56 w-56" />
            </div>
            {discount > 0 && <Badge variant="destructive" className="absolute left-4 top-4 px-3 py-1 text-sm">−{discount}%</Badge>}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {tints.map((t, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`relative grid aspect-square place-items-center overflow-hidden rounded-2xl border bg-gradient-to-br ${t} transition-all ${i === imgIdx ? "ring-2 ring-primary" : "hover:opacity-80"}`}
              >
                <Art className="h-12 w-12" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{productData.brand}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-rose-500" onClick={() => setWished((w) => !w)}>
                <Heart className={`h-5 w-5 ${wished ? "fill-rose-500 text-rose-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground"><Share2 className="h-5 w-5" /></Button>
            </div>
          </div>

          <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">{productData.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <strong>{productData.rating}</strong>
              <span className="text-muted-foreground">({productData.reviews} ulasan)</span>
            </span>
            <span className="text-muted-foreground">· {productData.sold} terjual</span>
            <Badge variant="secondary">{productData.category}</Badge>
          </div>

          <div className="mt-5 flex items-end gap-3 rounded-2xl bg-muted/40 p-4">
            <p className="font-heading text-3xl font-extrabold text-primary">{formatRupiah(variant.price)}</p>
            {variant.originalPrice && (
              <>
                <p className="mb-1 text-lg text-muted-foreground line-through">{formatRupiah(variant.originalPrice)}</p>
                <Badge variant="destructive" className="mb-1.5">Hemat {formatRupiah(variant.originalPrice - variant.price)}</Badge>
              </>
            )}
          </div>

          {/* Variants */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold">Pilih Varian</h3>
            <div className="flex flex-wrap gap-3">
              {productData.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVariantId(v.id); setQuantity(1); }}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${variantId === v.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "hover:border-primary/50"}`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + stock */}
          <div className="mt-6 flex items-end gap-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Jumlah</h3>
              <div className="flex w-fit items-center rounded-xl border">
                <Button variant="ghost" size="icon" onClick={() => changeQty("dec")} disabled={quantity <= 1} className="h-10 w-10 rounded-none rounded-l-xl"><Minus className="h-4 w-4" /></Button>
                <div className="w-14 text-center text-sm font-bold">{quantity}</div>
                <Button variant="ghost" size="icon" onClick={() => changeQty("inc")} disabled={quantity >= variant.stock} className="h-10 w-10 rounded-none rounded-r-xl"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="flex-1 text-sm text-muted-foreground">
              Sisa stok: <span className={`font-bold ${variant.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>{variant.stock}</span> unit
            </p>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="outline" className="h-12 flex-1 gap-2 text-base" onClick={handleAdd}>
              {added ? <><Check className="h-5 w-5 text-emerald-500" /> Ditambahkan!</> : <><ShoppingCart className="h-5 w-5" /> Keranjang</>}
            </Button>
            <Button size="lg" className="h-12 flex-1 text-base" onClick={handleAdd}>Beli Langsung</Button>
          </div>

          {/* Benefits row */}
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

      {/* Tabs */}
      <Tabs defaultValue="description" className="gap-5">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList variant="line" className="w-max justify-start border-b">
            <TabsTrigger value="description" className="px-4 sm:px-5 whitespace-nowrap">Deskripsi</TabsTrigger>
            <TabsTrigger value="specs" className="px-4 sm:px-5 whitespace-nowrap">Spesifikasi</TabsTrigger>
            <TabsTrigger value="reviews" className="px-4 sm:px-5 whitespace-nowrap">Ulasan ({productData.reviews})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="description" className="pt-4">
          <div className="max-w-3xl space-y-4">
            <p className="leading-relaxed text-muted-foreground">{productData.description}</p>
            <p className="font-semibold">Fitur unggulan:</p>
            <ul className="space-y-2">
              {productData.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="pt-4">
          <div className="max-w-3xl overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <tbody>
                {productData.specs.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <th className="w-1/3 bg-muted/30 px-4 py-3 font-medium">{s.label}</th>
                    <td className="px-4 py-3 text-muted-foreground">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="pt-4">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border bg-muted/30 p-5">
              <div className="text-center">
                <p className="font-heading text-4xl font-extrabold">{productData.rating}</p>
                <div className="mt-1 flex gap-0.5">{[0,1,2,3,4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <p className="text-sm text-muted-foreground">Berdasarkan <strong className="text-foreground">{productData.reviews}</strong> ulasan terverifikasi dari pembeli.</p>
            </div>
            {[
              { n: "Dewi K.", t: "Akurat dan mudah dipakai. Pengiriman cepat, segel utuh.", s: 5 },
              { n: "dr. Aditya P.", t: "Cocok untuk pemakaian klinik. Original dan bergaransi.", s: 5 },
            ].map((r) => (
              <div key={r.n} className="rounded-2xl border p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold">{r.n}</p>
                  <div className="flex gap-0.5">{Array.from({ length: r.s }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                </div>
                <p className="text-sm text-muted-foreground">{r.t}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
