"use client";

import Link from "next/link";
import { CheckCircle2, Package, MapPin, ArrowRight, Home, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ORDER_SUCCESS_ITEMS } from "@/lib/mock-data";

const orderNumber = "INV/2026/" + Math.random().toString(36).substring(2, 8).toUpperCase();

const orderItems = ORDER_SUCCESS_ITEMS;

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
const shipping = 25000;
const ppn = subtotal * 0.12;
const total = subtotal + shipping + ppn + 4500;

const estimasiTiba = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-2xl">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Pesanan Berhasil!</h1>
        <p className="text-muted-foreground text-lg">
          Terima kasih. Pembayaran Anda telah dikonfirmasi.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-mono font-medium">
          <span className="text-muted-foreground">No. Pesanan:</span>
          <span>{orderNumber}</span>
        </div>
      </div>

      {/* Estimasi Pengiriman */}
      <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
            <Clock className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Estimasi Tiba</p>
            <p className="text-emerald-800 font-medium text-lg">{estimasiTiba}</p>
            <p className="text-emerald-700 text-sm mt-0.5">Pengiriman via JNE REG — Lacak pesanan Anda di halaman Pesanan Saya</p>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan Pesanan */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Ringkasan Pesanan
          </h2>
          <div className="space-y-3 mb-4">
            {orderItems.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">{item.variant} × {item.qty}</p>
                </div>
                <p className="font-medium shrink-0">{formatRupiah(item.price * item.qty)}</p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ongkos Kirim</span><span>{formatRupiah(shipping)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>PPN 12%</span><span>{formatRupiah(ppn)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Layanan</span><span>{formatRupiah(4500)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>Total Dibayar</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alamat Pengiriman */}
      <Card className="mb-8">
        <CardContent className="p-5 flex items-start gap-4">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Alamat Pengiriman</p>
            <p className="text-muted-foreground mt-1">Budi Santoso (+62 812-3456-7890)</p>
            <p className="text-muted-foreground">Jl. Merdeka No. 45, Kel. Menteng, Kec. Menteng</p>
            <p className="text-muted-foreground">Jakarta Pusat, DKI Jakarta 10310</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/account/orders" className="flex-1">
          <Button size="lg" className="w-full gap-2">
            Lacak Pesanan <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/shop" className="flex-1">
          <Button size="lg" variant="outline" className="w-full gap-2">
            <Home className="h-4 w-4" /> Lanjut Belanja
          </Button>
        </Link>
      </div>
    </div>
  );
}
