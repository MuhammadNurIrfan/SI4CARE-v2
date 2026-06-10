"use client";

import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Keranjang Anda Kosong</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Sepertinya Anda belum menambahkan produk apapun. Yuk temukan produk yang Anda butuhkan!
        </p>
        <Link href="/shop"><Button size="lg">Mulai Belanja</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 pb-28 lg:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-5 md:mb-7">
        Keranjang Belanja <span className="text-base font-normal text-muted-foreground">({totalQty} item)</span>
      </h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Cart Items — daftar padat */}
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0 divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <div className={`w-14 h-14 shrink-0 rounded-md border ${item.imageColor} flex items-center justify-center`}>
                  <span className="text-[10px] text-muted-foreground">Foto</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.productId}`} className="hover:text-primary transition-colors">
                    <h3 className="font-medium text-sm leading-snug line-clamp-1">{item.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRupiah(item.price)} / item</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="font-bold text-sm">{formatRupiah(item.price * item.quantity)}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      aria-label="Hapus item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-none rounded-l-md" disabled={item.quantity <= 1} aria-label="Kurangi">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-8 text-center font-medium text-xs">{item.quantity}</div>
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-none rounded-r-md" aria-label="Tambah">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-28">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-base font-bold mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2.5 mb-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Harga ({totalQty} item)</span>
                  <span className="text-foreground font-medium">{formatRupiah(totalPrice)}</span>
                </div>
              </div>
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/15 p-2.5 text-xs text-muted-foreground">
                <TicketPercent className="h-4 w-4 shrink-0 text-primary" />
                <span>Punya voucher atau kode promo? Masukkan di halaman <strong className="text-foreground">checkout</strong>. Diskon, ongkir, dan rincian akhir dihitung di sana.</span>
              </div>
              <Separator className="mb-4" />
              <div className="flex justify-between items-center mb-5">
                <span className="font-bold">Total Belanja</span>
                <span className="font-bold text-xl text-primary">{formatRupiah(totalPrice)}</span>
              </div>
              <Link href="/checkout" className="block w-full">
                <Button size="lg" className="w-full text-base font-semibold">
                  Lanjut ke Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile: sticky checkout bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground leading-none mb-1">Total Belanja</p>
            <p className="font-bold text-primary">{formatRupiah(totalPrice)}</p>
          </div>
          <Link href="/checkout">
            <Button className="h-11 px-6 font-semibold">
              Checkout ({totalQty}) <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
