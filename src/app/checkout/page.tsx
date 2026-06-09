"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Truck, Ticket, Wallet, ShieldCheck, CreditCard, ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Dummy data
const checkoutItems = [
  { id: "c1", name: "Tensi Darah Digital Omron HEM-7120", variantName: "Standar", price: 540000, quantity: 1, imageColor: "bg-blue-100" },
  { id: "c2", name: "Masker Medis 3-Ply (Box isi 50)", variantName: "Biru", price: 25000, quantity: 3, imageColor: "bg-amber-100" },
];

export default function CheckoutPage() {
  const [isSnapOpen, setIsSnapOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const router = useRouter();

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const subtotal = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = 25000;
  const ppn = subtotal * 0.12; // PPN 12% sesuai requirement
  const serviceFee = 4500;
  const total = subtotal + shippingCost + ppn + serviceFee;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSnapOpen(true);
    }, 1500);
  };

  const handlePaymentSuccess = () => {
    setIsSnapOpen(false);
    router.push("/checkout/success");
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
      <Link href="/cart" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Keranjang
      </Link>

      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* Main Checkout Form */}
        <div className="space-y-6">
          {/* Alamat Pengiriman */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Alamat Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Budi Santoso <span className="font-normal text-muted-foreground">(Utama)</span></p>
                    <p className="text-sm text-foreground mt-1">0812-3456-7890</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jl. Kesehatan Raya No. 123, Blok B, RT 01/RW 02<br />
                      Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12345
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Ubah</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pengiriman */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Pilih Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="reguler" className="space-y-3">
                <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="reguler" id="reguler" />
                    <Label htmlFor="reguler" className="cursor-pointer">
                      <p className="font-medium text-base">JNE Reguler</p>
                      <p className="text-sm text-muted-foreground">Estimasi 2-3 hari kerja</p>
                    </Label>
                  </div>
                  <span className="font-semibold">{formatRupiah(25000)}</span>
                </div>
                <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/30 opacity-70">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="yes" id="yes" disabled />
                    <Label htmlFor="yes">
                      <p className="font-medium text-base">JNE YES</p>
                      <p className="text-sm text-muted-foreground">Estimasi 1 hari kerja</p>
                    </Label>
                  </div>
                  <span className="font-semibold">{formatRupiah(40000)}</span>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Daftar Produk */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Produk Dipesan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className={`w-16 h-16 shrink-0 rounded-md border ${item.imageColor}`} />
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Varian: {item.variantName} • {item.quantity} x {formatRupiah(item.price)}</p>
                  </div>
                  <p className="font-bold">{formatRupiah(item.price * item.quantity)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6 sticky top-28">
          {/* Voucher */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Ticket className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Makin Hemat Pakai Promo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="Masukkan kode promo" />
                <Button variant="secondary">Terapkan</Button>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan Belanja */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Ringkasan Belanja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Harga ({checkoutItems.length} barang)</span>
                  <span className="text-foreground font-medium">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Ongkos Kirim</span>
                  <span className="text-foreground font-medium">{formatRupiah(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>PPN (12%)</span>
                  <span className="text-foreground font-medium">{formatRupiah(ppn)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Biaya Layanan</span>
                  <span className="text-foreground font-medium">{formatRupiah(serviceFee)}</span>
                </div>
              </div>
              
              <Separator className="mb-4" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total Tagihan</span>
                <span className="font-bold text-xl text-primary">{formatRupiah(total)}</span>
              </div>

              <div className="bg-primary/5 text-primary border border-primary/20 rounded-lg p-3 text-sm flex gap-3 mb-6">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p>Transaksi aman. Anda akan diarahkan ke halaman pembayaran yang aman.</p>
              </div>
              
              <Button size="lg" className="w-full text-base font-semibold" onClick={handlePay} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...
                  </>
                ) : (
                  "Pilih Pembayaran"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Midtrans Snap Mockup */}
      <Dialog open={isSnapOpen} onOpenChange={setIsSnapOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          {/* Header Mockup */}
          <div className="bg-slate-900 text-white p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="font-semibold text-sm tracking-widest uppercase">si4care</span>
              </div>
              <p className="text-xs text-white/60">ID: ORD-{Math.floor(Math.random() * 1000000)}</p>
            </div>
            <p className="text-white/80 text-sm mb-1">Total Pembayaran</p>
            <p className="text-2xl font-bold">{formatRupiah(total)}</p>
          </div>
          
          <div className="p-6">
            <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase">Pilih Metode Pembayaran</h4>
            
            <div className="space-y-3">
              <button 
                className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all ${paymentMethod === 'qris' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted'}`}
                onClick={() => setPaymentMethod('qris')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white shadow-sm border rounded flex items-center justify-center">
                    <ScanLine className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">QRIS</p>
                    <p className="text-xs text-muted-foreground">GoPay, ShopeePay, M-Banking</p>
                  </div>
                </div>
              </button>
              
              <button 
                className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all ${paymentMethod === 'va' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted'}`}
                onClick={() => setPaymentMethod('va')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white shadow-sm border rounded flex items-center justify-center font-bold text-blue-800">
                    BCA
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">BCA Virtual Account</p>
                    <p className="text-xs text-muted-foreground">Bayar dari ATM/M-BCA</p>
                  </div>
                </div>
              </button>
              
              <button 
                className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all ${paymentMethod === 'cc' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted'}`}
                onClick={() => setPaymentMethod('cc')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white shadow-sm border rounded flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Kartu Kredit / Debit</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, JCB</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-8">
              <Button className="w-full h-12" onClick={handlePaymentSuccess}>
                Bayar dengan {paymentMethod.toUpperCase()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
