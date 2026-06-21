"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, Trash2, Calculator, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveMarketplaceTransaction, type PosProduct } from "@/actions/pos";
import {
  PLATFORM_COMMISSION, calcMarketplaceNet,
  type MpItem, type CustomFee, type CustomFeeRow,
} from "@/lib/pos-calc";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export function MarketplaceTab({ products }: { products: PosProduct[] }) {
  const [isPending, startTransition] = useTransition();
  const [platform, setPlatform] = useState("tokopedia");
  const [noPesanan, setNoPesanan] = useState("");
  const [namaPembeli, setNamaPembeli] = useState("");
  const [items, setItems] = useState<MpItem[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [komisiPlatform, setKomisiPlatform] = useState(PLATFORM_COMMISSION["tokopedia"]);
  const [mdrPersen, setMdrPersen] = useState(0.7);
  const [biayaLayanan, setBiayaLayanan] = useState(1000);
  const [ongkirDiterima, setOngkirDiterima] = useState(0);
  const [ongkirKurir, setOngkirKurir] = useState(0);
  const [subsidiOngkir, setSubsidiOngkir] = useState(0);
  const [voucherPlatform, setVoucherPlatform] = useState(0);
  const [customFees, setCustomFees] = useState<CustomFee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const addCustomFee = () =>
    setCustomFees((p) => [...p, { id: String(Date.now()), name: "", kind: "rp", value: 0, sign: "minus" }]);
  const updateCustomFee = (id: string, patch: Partial<CustomFee>) =>
    setCustomFees((p) => p.map((f) => f.id === id ? { ...f, ...patch } : f));
  const removeCustomFee = (id: string) =>
    setCustomFees((p) => p.filter((f) => f.id !== id));

  const addItem = () => {
    const prod = products.find((p) => p.id === selectedVariantId);
    if (!prod) return;
    setItems((prev) => {
      const ex = prev.find((i) => i.id === prod.id);
      if (ex) return prev.map((i) => i.id === prod.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { id: prod.id, name: prod.name, sku: prod.sku, qty, price: prod.price, hpp: prod.hpp }];
    });
    setQty(1);
  };

  const calc = calcMarketplaceNet(items, {
    komisiPlatform, mdrPersen, biayaLayanan,
    ongkirDiterima, subsidiOngkir, ongkirKurir,
    voucherPlatform, customFees,
  });

  const customFeeRows: CustomFeeRow[] = calc.customFeeRows;

  const handleSave = () => {
    setError(null);
    setSuccessRef(null);
    startTransition(async () => {
      try {
        const result = await saveMarketplaceTransaction({
          platform, platformOrderId: noPesanan, customerName: namaPembeli,
          items: items.map((i) => ({ variantId: i.id, name: i.name, sku: i.sku, price: i.price, qty: i.qty })),
          komisiPlatform, mdrPersen, biayaLayanan,
          ongkirDiterima, subsidiOngkir, ongkirKurir,
          voucherPlatform, customFees,
        });
        if (result.ok) {
          setSuccessRef(result.refNumber);
          setItems([]);
          setNoPesanan("");
          setNamaPembeli("");
          setCustomFees([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    });
  };

  return (
    <ScrollArea className="flex-1 min-h-0 p-4 md:p-5">
      <div className="max-w-3xl mx-auto space-y-5 pb-8">
        <div>
          <h2 className="text-lg font-bold">Input Transaksi Marketplace (Manual)</h2>
          <p className="text-sm text-muted-foreground">Catat pesanan dari marketplace beserta rincian biaya platform.</p>
        </div>

        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm">
          <Info className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-amber-900">
            <p className="font-semibold">Disimpan sebagai &ldquo;Pending — Menunggu Validasi Settlement&rdquo;</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
              Stok langsung dibooking. Laba diakui setelah settlement divalidasi Owner.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

        {/* Informasi Pesanan */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Informasi Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <Select value={platform} onValueChange={(v) => { if (v) { setPlatform(v); if (v !== "custom") setKomisiPlatform(PLATFORM_COMMISSION[v] ?? 0); } }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tokopedia">Tokopedia (1.8%)</SelectItem>
                    <SelectItem value="shopee">Shopee (2.2%)</SelectItem>
                    <SelectItem value="lazada">Lazada (2.5%)</SelectItem>
                    <SelectItem value="blibli">Blibli (3.0%)</SelectItem>
                    <SelectItem value="custom">Platform Lain (Kustom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">No. Pesanan Platform</Label>
                <Input placeholder="cth: INV/20260606/XXX" value={noPesanan} onChange={(e) => setNoPesanan(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Pembeli</Label>
              <Input placeholder="Nama pelanggan" value={namaPembeli} onChange={(e) => setNamaPembeli(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Produk */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Produk yang Dijual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedVariantId} onValueChange={(v) => { if (v) setSelectedVariantId(v); }}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty((q) => q + 1)}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              <Button onClick={addItem} disabled={!selectedVariantId}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
            </div>
            {items.length > 0 && (
              <div className="border rounded-lg divide-y overflow-hidden">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">HPP: {fmt(item.hpp)} · Jual: {fmt(item.price)}</p>
                    </div>
                    <span className="text-xs">{item.qty}×</span>
                    <span className="font-bold text-xs w-24 text-right">{fmt(item.price * item.qty)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-muted/30 text-sm font-bold">
                  <span>Subtotal Nilai Barang</span><span>{fmt(calc.nilaiBarang)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biaya Platform */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Biaya & Potongan Platform</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Komisi/Admin Fee (%)</Label>
                <Input type="number" step="0.1" value={komisiPlatform} onChange={(e) => setKomisiPlatform(Number(e.target.value))} />
                <p className="text-[11px] text-muted-foreground">= {fmt(calc.komisiNominal)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">MDR / Biaya Pembayaran (%)</Label>
                <Input type="number" step="0.1" value={mdrPersen} onChange={(e) => setMdrPersen(Number(e.target.value))} />
                <p className="text-[11px] text-muted-foreground">= {fmt(calc.mdrNominal)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Biaya Layanan Tetap (Rp)</Label>
                <Input type="number" value={biayaLayanan} onChange={(e) => setBiayaLayanan(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Voucher Ditanggung Platform (Rp)</Label>
                <Input type="number" value={voucherPlatform} onChange={(e) => setVoucherPlatform(Number(e.target.value))} />
                <p className="text-[11px] text-emerald-600">Tambah ke pendapatan</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Biaya Tambahan</p>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={addCustomFee}><Plus className="h-3.5 w-3.5" /> Tambah Kolom</Button>
              </div>
              {customFees.length === 0 && (
                <p className="rounded-lg border border-dashed py-3 text-center text-[11px] text-muted-foreground">Belum ada komponen tambahan.</p>
              )}
              {customFees.map((f, idx) => {
                const row = customFeeRows[idx];
                return (
                  <div key={f.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border bg-muted/20 p-2.5">
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Nama</Label>
                      <Input placeholder="cth: Biaya Iklan" value={f.name} onChange={(e) => updateCustomFee(f.id, { name: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="col-span-5 sm:col-span-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Tipe</Label>
                      <div className="flex h-8 rounded-md border overflow-hidden">
                        {(["rp", "pct"] as const).map((k) => (
                          <button key={k} type="button" onClick={() => updateCustomFee(f.id, { kind: k })} className={`flex-1 text-[11px] font-medium ${f.kind === k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>{k === "rp" ? "Rp" : "%"}</button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-7 sm:col-span-3 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Nilai</Label>
                      <Input type="number" min={0} step={f.kind === "pct" ? "0.1" : "1"} value={f.value || ""} onChange={(e) => updateCustomFee(f.id, { value: Number(e.target.value) })} className="h-8 text-xs" />
                    </div>
                    <div className="col-span-9 sm:col-span-1 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Arah</Label>
                      <Select value={f.sign} onValueChange={(v) => { if (v === "plus" || v === "minus") updateCustomFee(f.id, { sign: v }); }}>
                        <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="minus">−</SelectItem><SelectItem value="plus">+</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeCustomFee(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    {row && (
                      <div className="col-span-12 -mt-1 flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{f.kind === "pct" ? `${f.value || 0}% × nilai barang` : "Nominal tetap"}</span>
                        <span className={row.sign === "plus" ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>{row.sign === "plus" ? "+" : "−"}{fmt(row.nominal)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ongkir */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Ongkos Kirim</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Ongkir dari Pembeli (Rp)</Label><Input type="number" value={ongkirDiterima} onChange={(e) => setOngkirDiterima(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Subsidi Ongkir Platform (Rp)</Label><Input type="number" value={subsidiOngkir} onChange={(e) => setSubsidiOngkir(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Ongkir Dibayar ke Kurir (Rp)</Label><Input type="number" value={ongkirKurir} onChange={(e) => setOngkirKurir(Number(e.target.value))} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Rekap */}
        {items.length > 0 && (
          <Card className={calc.isMinus ? "border-destructive/40 bg-destructive/5" : calc.isTipis ? "border-amber-300 bg-amber-50/50" : "border-emerald-300 bg-emerald-50/50"}>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" /> Rekap Kalkulasi Bersih</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex justify-between text-muted-foreground"><span>Nilai Barang</span><span className="text-foreground font-medium">{fmt(calc.nilaiBarang)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>HPP Total</span><span className="text-foreground font-medium">{fmt(calc.nilaiHpp)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Komisi Platform</span><span>-{fmt(calc.komisiNominal)}</span></div>
                <div className="flex justify-between text-amber-700"><span>MDR</span><span>-{fmt(calc.mdrNominal)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Biaya Layanan</span><span>-{fmt(biayaLayanan)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Voucher Platform</span><span>+{fmt(voucherPlatform)}</span></div>
                {customFeeRows.map((f) => (
                  <div key={f.id} className={`flex justify-between ${f.sign === "plus" ? "text-emerald-700" : "text-amber-700"}`}>
                    <span className="truncate">{f.name || "(Tanpa nama)"}</span>
                    <span>{f.sign === "plus" ? "+" : "−"}{fmt(f.nominal)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-muted-foreground col-span-2 pt-1 border-t">
                  <span>Net Ongkir</span>
                  <span className={calc.netOngkir >= 0 ? "text-emerald-700" : "text-destructive"}>{calc.netOngkir >= 0 ? "+" : ""}{fmt(calc.netOngkir)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Net Diterima</span><span className={calc.netDiterima < 0 ? "text-destructive" : ""}>{fmt(calc.netDiterima)}</span></div>
              <div className={`flex justify-between font-bold text-base ${calc.isMinus ? "text-destructive" : calc.isTipis ? "text-amber-700" : "text-emerald-700"}`}>
                <span className="flex items-center gap-1.5">{(calc.isMinus || calc.isTipis) && <AlertTriangle className="h-4 w-4" />}Margin Bersih</span>
                <span>{fmt(calc.marginKotor)} ({calc.marginPct.toFixed(1)}%)</span>
              </div>
              {calc.isMinus && <p className="text-xs text-destructive font-medium">⚠ Transaksi ini rugi!</p>}
              {calc.isTipis && <p className="text-xs text-amber-700 font-medium">⚠ Margin sangat tipis (&lt;10%).</p>}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleSave} disabled={items.length === 0 || !noPesanan || isPending}>
            {isPending ? "Menyimpan..." : "Simpan sebagai Pending Validasi"}
          </Button>
          <Button variant="outline" onClick={() => { setItems([]); setNoPesanan(""); setNamaPembeli(""); setCustomFees([]); }}>Reset</Button>
        </div>

        {successRef && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
            ✓ Tersimpan sebagai Pending Validasi — Ref: <strong>{successRef}</strong>
          </p>
        )}
      </div>

      {/* Success dialog (optional) */}
      <Dialog open={!!successRef} onOpenChange={() => setSuccessRef(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle>Transaksi Marketplace Disimpan</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Stok telah dibooking. Validasi settlement setelah dana diterima.</p>
          <p className="font-mono text-lg font-bold text-primary mt-2">{successRef}</p>
          <Button className="mt-4 w-full" onClick={() => setSuccessRef(null)}>Tutup</Button>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
