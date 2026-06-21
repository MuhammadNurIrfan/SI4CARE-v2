"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PackagePlus, Plus, Trash2, Calculator, Boxes, AlertTriangle,
  Tag, Info, CheckCircle2, Loader2,
} from "lucide-react";
import { createBatch } from "@/actions/batches";
import type { VariantRow } from "@/actions/products";
import type { RecentBatchRow } from "@/actions/batches";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface DraftItem {
  key: string;
  variantId: string;
  name: string;
  sku: string;
  batchNumber: string;
  qty: number;
  hpp: number;
  hargaJual: number;
  expDate: string;
  stockMode: "fifo" | "fefo";
}

type Props = {
  variants: VariantRow[];
  recentBatches: RecentBatchRow[];
};

export function InboundClient({ variants, recentBatches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  const [variantId, setVariantId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [hpp, setHpp] = useState<number>(0);
  const [hargaJual, setHargaJual] = useState<number>(0);
  const [expDate, setExpDate] = useState("");
  const [stockMode, setStockMode] = useState<"fifo" | "fefo">("fifo");

  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const selectedVariant = variants.find((v) => v.variantId === variantId);

  function pickVariant(id: string) {
    setVariantId(id);
    const v = variants.find((x) => x.variantId === id);
    if (v) {
      setHargaJual(Number(v.activePrice));
      setStockMode(v.stockMode);
    }
  }

  function addItem() {
    if (!selectedVariant || qty <= 0 || hpp <= 0) return;
    setDraft((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        variantId: selectedVariant.variantId,
        name: selectedVariant.productName,
        sku: selectedVariant.sku,
        batchNumber: batchNumber || `B${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        qty,
        hpp,
        hargaJual,
        expDate,
        stockMode,
      },
    ]);
    setVariantId("");
    setBatchNumber("");
    setQty(0);
    setHpp(0);
    setHargaJual(0);
    setExpDate("");
  }

  const totalModal = draft.reduce((s, i) => s + i.hpp * i.qty, 0);
  const totalUnit = draft.reduce((s, i) => s + i.qty, 0);
  const marginOf = (i: DraftItem) =>
    i.hargaJual > 0 ? ((i.hargaJual - i.hpp) / i.hargaJual) * 100 : 0;

  function saveInbound() {
    setSaveError("");
    startTransition(async () => {
      try {
        await Promise.all(
          draft.map((item) =>
            createBatch({
              variantId: item.variantId,
              batchNumber: item.batchNumber,
              hpp: item.hpp,
              quantity: item.qty,
              expiredDate: item.expDate || null,
              supplier: supplier || null,
            }),
          ),
        );
        setSaved(true);
        setDraft([]);
        setSupplier("");
        setInvoiceNo("");
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Transaksi Masuk (Batch)</h1>
          <p className="text-muted-foreground">
            Catat barang datang sebagai <strong>batch</strong> — input HPP, jumlah, kadaluarsa,
            pemasok, dan tetapkan harga jual.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1.5">
          <Info className="h-3.5 w-3.5" /> Stok &amp; HPP dihitung per batch (FIFO/FEFO)
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PackagePlus className="h-4 w-4 text-primary" /> Informasi Penerimaan
              </CardTitle>
              <CardDescription>Satu transaksi bisa berisi banyak item/batch sekaligus.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Pemasok</Label>
                <Input placeholder="cth: CV Sehat Medika" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">No. Faktur / Surat Jalan</Label>
                <Input placeholder="cth: INV/2026/0612" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tanggal Masuk</Label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tambah Item / Batch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Produk / Varian</Label>
                <Select value={variantId} onValueChange={(v) => { if (v) pickVariant(v); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                  <SelectContent>
                    {variants.length === 0 && (
                      <SelectItem value="_none" disabled>
                        Belum ada produk — tambah di halaman Produk
                      </SelectItem>
                    )}
                    {variants.map((v) => (
                      <SelectItem key={v.variantId} value={v.variantId}>
                        {v.productName} · {v.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs">No. Batch <span className="text-muted-foreground">(opsional, auto)</span></Label>
                  <Input
                    placeholder="cth: B2026-052"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Jumlah (qty)</Label>
                  <Input type="number" min={0} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Calculator className="h-3 w-3" /> HPP / Modal per unit (Rp)
                  </Label>
                  <Input type="number" min={0} value={hpp || ""} onChange={(e) => setHpp(Number(e.target.value))} placeholder="Harga beli per unit" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Tag className="h-3 w-3" /> Harga Jual per unit (Rp)
                  </Label>
                  <Input type="number" min={0} value={hargaJual || ""} onChange={(e) => setHargaJual(Number(e.target.value))} placeholder="Harga jual aktif" />
                </div>
              </div>

              {hpp > 0 && hargaJual > 0 && (
                <div className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${hargaJual <= hpp ? "bg-red-50 text-red-700" : (hargaJual - hpp) / hargaJual < 0.1 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {hargaJual <= hpp ? <AlertTriangle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                  Margin kotor: <strong>{(((hargaJual - hpp) / hargaJual) * 100).toFixed(1)}%</strong> ({formatRp(hargaJual - hpp)}/unit)
                  {hargaJual <= hpp && " — harga jual di bawah/sama dengan HPP!"}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Tanggal Kadaluarsa (ED)</Label>
                  <Input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    disabled={selectedVariant?.stockMode === "fifo"}
                  />
                  {selectedVariant?.stockMode === "fifo" && (
                    <p className="text-[11px] text-muted-foreground">Produk ini tanpa ED (mode FIFO).</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Mode Konsumsi Stok</Label>
                  <Select value={stockMode} onValueChange={(v) => { if (v === "fifo" || v === "fefo") setStockMode(v); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fifo">FIFO (masuk pertama, keluar pertama)</SelectItem>
                      <SelectItem value="fefo">FEFO (kadaluarsa terdekat keluar dulu)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={addItem} disabled={!selectedVariant || qty <= 0 || hpp <= 0} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Tambahkan ke Daftar
              </Button>
            </CardContent>
          </Card>

          {draft.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daftar Item Masuk ({draft.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk / Batch</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">HPP</TableHead>
                        <TableHead className="text-right">Jual</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draft.map((i) => (
                        <TableRow key={i.key}>
                          <TableCell>
                            <p className="font-medium text-sm">{i.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {i.batchNumber}{i.expDate ? ` · ED ${i.expDate}` : ""} · {i.stockMode.toUpperCase()}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">{i.qty}</TableCell>
                          <TableCell className="text-right text-sm">{formatRp(i.hpp)}</TableCell>
                          <TableCell className="text-right text-sm">{formatRp(i.hargaJual)}</TableCell>
                          <TableCell className={`text-right text-sm font-medium ${marginOf(i) <= 0 ? "text-destructive" : marginOf(i) < 10 ? "text-amber-600" : "text-emerald-600"}`}>
                            {marginOf(i).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDraft((p) => p.filter((x) => x.key !== i.key))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden divide-y">
                  {draft.map((i) => (
                    <div key={i.key} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm leading-tight">{i.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{i.batchNumber}{i.expDate ? ` · ED ${i.expDate}` : ""} · {i.stockMode.toUpperCase()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDraft((p) => p.filter((x) => x.key !== i.key))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div><span className="text-muted-foreground">Qty: </span><span className="font-medium">{i.qty}</span></div>
                        <div><span className="text-muted-foreground">Margin: </span><span className={`font-medium ${marginOf(i) <= 0 ? "text-destructive" : marginOf(i) < 10 ? "text-amber-600" : "text-emerald-600"}`}>{marginOf(i).toFixed(0)}%</span></div>
                        <div><span className="text-muted-foreground">HPP: </span><span className="font-medium">{formatRp(i.hpp)}</span></div>
                        <div><span className="text-muted-foreground">Jual: </span><span className="font-medium">{formatRp(i.hargaJual)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Boxes className="h-4 w-4 text-primary" /> Ringkasan Penerimaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total item/batch</span><span className="font-medium">{draft.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total unit masuk</span><span className="font-medium">{totalUnit}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total Modal (HPP)</span>
                <span className="text-primary">{formatRp(totalModal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Nilai ini dicatat sebagai penambahan persediaan — laba diakui saat barang terjual.
              </p>
              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              <Button
                className="w-full gap-2"
                disabled={draft.length === 0 || !supplier || isPending}
                onClick={saveInbound}
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : saved ? (
                  <><CheckCircle2 className="h-4 w-4" /> Tersimpan &amp; stok diperbarui</>
                ) : (
                  "Simpan Transaksi Masuk"
                )}
              </Button>
              {!supplier && draft.length > 0 && (
                <p className="text-center text-[11px] text-amber-600">Isi nama pemasok untuk menyimpan.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Batch &amp; Stok Tersisa</CardTitle>
          <CardDescription>Telusuri sisa stok per batch beserta HPP dan tanggal kadaluarsa.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentBatches.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada batch. Tambah produk via inbound di atas.
            </p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Batch</TableHead>
                      <TableHead>Produk / SKU</TableHead>
                      <TableHead className="text-center">Sisa / Awal</TableHead>
                      <TableHead className="text-right">HPP</TableHead>
                      <TableHead className="text-right">Harga Jual</TableHead>
                      <TableHead>ED</TableHead>
                      <TableHead>Pemasok</TableHead>
                      <TableHead className="text-center">Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBatches.map((b) => {
                      const low = b.quantity > 0 && b.remaining / b.quantity < 0.2;
                      return (
                        <TableRow key={b.batchId}>
                          <TableCell className="font-mono text-xs">{b.batchNumber ?? "—"}</TableCell>
                          <TableCell className="max-w-[220px] truncate text-sm font-medium">
                            {b.productName}
                            <span className="block font-mono text-[10px] text-muted-foreground">{b.sku}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={low ? "font-semibold text-amber-600" : ""}>{b.remaining}</span>
                            <span className="text-muted-foreground"> / {b.quantity}</span>
                            {low && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-amber-500" />}
                          </TableCell>
                          <TableCell className="text-right text-sm">{formatRp(Number(b.hpp))}</TableCell>
                          <TableCell className="text-right text-sm">{formatRp(Number(b.activePrice))}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{b.expiredDate ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{b.supplier ?? "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px]">{b.stockMode.toUpperCase()}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {recentBatches.map((b) => {
                  const low = b.quantity > 0 && b.remaining / b.quantity < 0.2;
                  return (
                    <div key={b.batchId} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{b.productName}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {b.batchNumber ?? "—"} · ED {b.expiredDate ?? "—"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{b.stockMode.toUpperCase()}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div><span className="text-muted-foreground">Sisa: </span><span className={`font-medium ${low ? "text-amber-600" : ""}`}>{b.remaining}/{b.quantity}{low && " ⚠"}</span></div>
                        <div><span className="text-muted-foreground">Pemasok: </span><span className="font-medium truncate">{b.supplier ?? "—"}</span></div>
                        <div><span className="text-muted-foreground">HPP: </span><span className="font-medium">{formatRp(Number(b.hpp))}</span></div>
                        <div><span className="text-muted-foreground">Jual: </span><span className="font-medium">{formatRp(Number(b.activePrice))}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
