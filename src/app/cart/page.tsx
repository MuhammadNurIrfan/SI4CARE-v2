"use client";

import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem } = useCart();

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
    <div className="container mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Keranjang Belanja</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className={`w-24 h-24 shrink-0 rounded-lg border ${item.imageColor} flex items-center justify-center`}>
                  <span className="text-xs text-muted-foreground">Foto</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.productId}`} className="hover:text-primary transition-colors">
                    <h3 className="font-semibold text-base md:text-lg line-clamp-2">{item.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">Varian: {item.variantName}</p>
                  <p className="font-bold text-foreground mt-2">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 mt-2 sm:mt-0">
                  <div className="flex items-center border rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-none rounded-l-lg" disabled={item.quantity <= 1}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-10 text-center font-medium text-sm">{item.quantity}</div>
                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-none rounded-r-lg">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block w-28">
                      <p className="font-bold">{formatRupiah(item.price * item.quantity)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="sticky top-28">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Harga ({items.length} Produk)</span>
                  <span className="text-foreground font-medium">{formatRupiah(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Diskon</span>
                  <span className="text-emerald-600 font-medium">-Rp 0</span>
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total Belanja</span>
                <span className="font-bold text-xl text-primary">{formatRupiah(totalPrice)}</span>
              </div>
              <Link href="/checkout" className="block w-full">
                <Button size="lg" className="w-full text-base font-semibold">
                  Beli ({items.length}) <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
