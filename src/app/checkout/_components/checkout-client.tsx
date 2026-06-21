"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Truck, Ticket, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/context/CartContext";
import { validateVoucher } from "@/actions/vouchers";
import { calcDiscount } from "@/lib/utils/discount";
import { createOrder } from "@/actions/orders";
import type { AddressRow } from "@/actions/addresses";
import type { ShippingOption } from "@/app/api/shipping/cost/route";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const SERVICE_FEE = 4500;
const PPN_RATE = 0.12;

type Props = {
  addresses: AddressRow[];
};

type VoucherState = {
  code: string;
  voucherId: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  discount: number;
};

export function CheckoutClient({ addresses }: Props) {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isPrimary)?.id ?? addresses[0]?.id ?? "",
  );
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherState | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [isPendingVoucher, startVoucherTransition] = useTransition();

  const [isPaying, startPayTransition] = useTransition();
  const [payError, setPayError] = useState("");

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = voucher?.discount ?? 0;
  const shippingCost = selectedShipping?.price ?? 0;
  const ppn = Math.round((subtotal - discount) * PPN_RATE);
  const total = subtotal - discount + shippingCost + ppn + SERVICE_FEE;

  // Muat opsi ongkir saat alamat berubah
  const loadShipping = useCallback(async (city: string) => {
    setLoadingShipping(true);
    setSelectedShipping(null);
    try {
      const res = await fetch(`/api/shipping/cost?destination=${encodeURIComponent(city)}&weight=1000`);
      const data = (await res.json()) as { options: ShippingOption[] };
      setShippingOptions(data.options ?? []);
      if (data.options?.length) setSelectedShipping(data.options[0]);
    } catch {
      setShippingOptions([]);
    } finally {
      setLoadingShipping(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAddress?.city) {
      loadShipping(selectedAddress.city);
    }
  }, [selectedAddress?.city, loadShipping]);

  function applyVoucher() {
    setVoucherError("");
    startVoucherTransition(async () => {
      const result = await validateVoucher(voucherInput.trim(), subtotal);
      if (!result.ok) {
        setVoucher(null);
        setVoucherError(result.error);
        return;
      }
      const discountAmt = calcDiscount(result, subtotal);
      setVoucher({
        code: voucherInput.trim().toUpperCase(),
        voucherId: result.voucherId,
        type: result.type,
        value: result.value,
        maxDiscount: result.maxDiscount,
        discount: discountAmt,
      });
    });
  }

  function handlePay() {
    if (!selectedAddress) { setPayError("Pilih alamat pengiriman"); return; }
    if (!selectedShipping) { setPayError("Pilih opsi pengiriman"); return; }
    if (items.length === 0) { setPayError("Keranjang kosong"); return; }
    setPayError("");

    startPayTransition(async () => {
      const result = await createOrder({
        addressId: selectedAddress.id,
        courier: selectedShipping.courier,
        courierService: selectedShipping.service,
        shippingCost: selectedShipping.price,
        voucherCode: voucher?.code ?? null,
        items: items.map((i) => ({
          variantId: i.variantId,
          productName: i.name,
          sku: i.variantName,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });

      if (!result.ok) {
        setPayError(result.error);
        return;
      }

      if (!window.snap) {
        setPayError("Midtrans Snap belum termuat. Refresh halaman dan coba lagi.");
        return;
      }

      window.snap.pay(result.snapToken, {
        onSuccess: () => {
          clearCart();
          router.push(`/checkout/success?orderId=${result.orderId}`);
        },
        onPending: () => {
          clearCart();
          router.push(`/checkout/success?orderId=${result.orderId}&status=pending`);
        },
        onError: () => {
          setPayError("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          // User menutup popup — pesanan tetap ada di DB dengan status pending_payment
        },
      });
    });
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <p className="text-muted-foreground mb-6">Keranjang kamu kosong.</p>
        <Link href="/shop"><Button>Mulai Belanja</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
      <Link href="/cart" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Keranjang
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* Kiri */}
        <div className="space-y-6">
          {/* Alamat */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Alamat Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addresses.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30">
                  Belum ada alamat tersimpan.{" "}
                  <Link href="/account/addresses" className="text-primary underline underline-offset-2">
                    Tambah alamat
                  </Link>
                </div>
              ) : (
                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      htmlFor={`addr-${addr.id}`}
                      className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/30 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
                    >
                      <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} className="mt-0.5" />
                      <div className="text-sm flex-1">
                        <p className="font-semibold">
                          {addr.name}{" "}
                          {addr.isPrimary && (
                            <span className="text-[10px] font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Utama</span>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5">{addr.phone}</p>
                        <p className="text-muted-foreground">{addr.address}, {addr.city}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
              <Link href="/account/addresses">
                <Button variant="outline" size="sm" className="mt-1">+ Tambah Alamat Baru</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pengiriman */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Pilih Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingShipping ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Menghitung ongkir...
                </div>
              ) : shippingOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {selectedAddress ? "Gagal memuat ongkir — coba pilih alamat lain." : "Pilih alamat terlebih dahulu."}
                </p>
              ) : (
                <RadioGroup
                  value={selectedShipping ? `${selectedShipping.courier}-${selectedShipping.service}` : ""}
                  onValueChange={(v) => {
                    const opt = shippingOptions.find((o) => `${o.courier}-${o.service}` === v);
                    if (opt) setSelectedShipping(opt);
                  }}
                  className="space-y-2"
                >
                  {shippingOptions.map((opt) => {
                    const key = `${opt.courier}-${opt.service}`;
                    return (
                      <label
                        key={key}
                        htmlFor={`ship-${key}`}
                        className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/30 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={key} id={`ship-${key}`} />
                          <div className="text-sm">
                            <p className="font-medium">{opt.courierName} {opt.service}</p>
                            <p className="text-muted-foreground text-xs">{opt.description} · Est. {opt.etd}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold shrink-0">{fmt(opt.price)}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Produk */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Produk Dipesan ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className={`w-14 h-14 shrink-0 rounded-md border ${item.imageColor} flex items-center justify-center`}>
                    <span className="text-[9px] text-muted-foreground">Foto</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.variantName} · {item.quantity} × {fmt(item.price)}</p>
                  </div>
                  <p className="font-bold text-sm shrink-0">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Kanan — Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-28">
          {/* Voucher */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Ticket className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-lg">Kode Promo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan kode promo"
                  value={voucherInput}
                  onChange={(e) => { setVoucherInput(e.target.value); setVoucherError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") applyVoucher(); }}
                  disabled={!!voucher || isPendingVoucher}
                />
                {voucher ? (
                  <Button variant="outline" onClick={() => { setVoucher(null); setVoucherInput(""); }}>
                    Hapus
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={applyVoucher} disabled={!voucherInput.trim() || isPendingVoucher}>
                    {isPendingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pakai"}
                  </Button>
                )}
              </div>
              {voucher && (
                <p className="mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  ✓ {voucher.code} — hemat {fmt(voucher.discount)}
                </p>
              )}
              {voucherError && <p className="mt-2 text-xs text-destructive">{voucherError}</p>}
            </CardContent>
          </Card>

          {/* Ringkasan */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Ringkasan Belanja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item)</span>
                  <span className="text-foreground font-medium">{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-sm">
                    <span>Diskon ({voucher?.code})</span>
                    <span className="font-medium">−{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkos Kirim</span>
                  <span className="text-foreground font-medium">
                    {selectedShipping ? fmt(shippingCost) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>PPN (12%)</span>
                  <span className="text-foreground font-medium">{fmt(ppn)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Biaya Layanan</span>
                  <span className="text-foreground font-medium">{fmt(SERVICE_FEE)}</span>
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Total Tagihan</span>
                <span className="font-bold text-xl text-primary">{fmt(total)}</span>
              </div>

              {payError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="bg-primary/5 text-primary border border-primary/20 rounded-lg p-3 text-sm flex gap-3 mb-4">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p>Transaksi aman diproses oleh Midtrans.</p>
              </div>

              <Button
                size="lg"
                className="w-full text-base font-semibold"
                onClick={handlePay}
                disabled={isPaying || !selectedAddress || !selectedShipping || items.length === 0}
              >
                {isPaying ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                ) : (
                  "Bayar Sekarang"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
