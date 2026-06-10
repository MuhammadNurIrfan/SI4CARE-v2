"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackagePlus, Plus, Trash2, Calculator, Boxes, AlertTriangle, Tag, Info, CheckCircle2 } from "lucide-react";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const productOptions = [
  { id: "v1", name: "Tensi Darah Digital Omron HEM-7120", sku: "ALK-TEN-001", hargaJual: 540000, edFlag: false },
  { id: "v2", name: "Termometer Tembak Infrared OneMed", sku: "ALK-TER-001", hargaJual: 150000, edFlag: false },
  { id: "v3", name: "Masker Medis 3-Ply (Box isi 50)", sku: "BHP-MSK-001", hargaJual: 25000, edFlag: true },
  { id: "v4", name: "Sarung Tangan Medis Latex (Box 100)", sku: "BHP-STG-001", hargaJual: 45000, edFlag: true },
  { id: "v5", name: "Betadine Antiseptik 300ml", sku: "BTD-ANT-300", hargaJual: 42000, edFlag: true },
];

interface DraftItem {
  key: string;
  productId: string;
  name: string;
  sku: string;
  batchNumber: string;
  qty: number;
  hpp: number;
  hargaJual: number;
  expDate: string;
  edFlag: boolean;
  stockMode: "fifo" | "fefo";
}

const recentBatches = [
  { batch: "B2026-051", produk: "Tensi Darah Digital Omron HEM-7120", qtyAwal: 20, sisa: 15, hpp: 420000, jual: 540000, ed: "-", supplier: "PT Omron Health", mode: "fifo" },
  { batch: "B2026-048", produk: "Masker Medis 3-Ply (Box isi 50)", qtyAwal: 100, sisa: 64, hpp: 18000, jual: 25000, ed: "2026-12-31", supplier: "CV Sehat Medika", mode: "fefo" },
  { batch: "B2026-045", produk: "Betadine Antiseptik 300ml", qtyAwal: 60, sisa: 12, hpp: 30000, jual: 42000, ed: "2026-08-15", supplier: "Mundipharma Dist.", mode: "fefo" },
  { batch: "B2026-039", produk: "Sarung Tangan Medis Latex (Box 100)", qtyAwal: 80, sisa: 5, hpp: 32000, jual: 45000, ed: "2026-06-30", supplier: "CV Sehat Medika", mode: "fefo" },
];

export default function InboundPage() {
  // Inbound header
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [tanggal, setTanggal] = useState("2026-06-06");

  // Item form
  const [productId, setProductId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [hpp, setHpp] = useState<number>(0);
  const [hargaJual, setHargaJual] = useState<number>(0);
  const [expDate, setExpDate] = useState("");
  const [stockMode, setStockMode] = useState<"fifo" | "fefo">("fifo");

  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [saved, setSaved] = useState(false);

  const selectedProduct = productOptions.find((p) => p.id === productId);

  function pickProduct(id: string) {
    setProductId(id);
    const p = productOptions.find((x) => x.id === id);
    if (p) {
      setHargaJual(p.hargaJual);
      setStockMode(p.edFlag ? "fefo" : "fifo");
    }
  }

  function addItem() {
    if (!selectedProduct || qty <= 0 || hpp <= 0) return;
    setDraft((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        productId: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        batchNumber: batchNumber || `B2026-${Math.floor(Math.random() * 900 + 100)}`,
        qty,
        hpp,
        hargaJual,
        expDate,
        edFlag: selectedProduct.edFlag,
        stockMode,
      },
    ]);
    setProductId("");
    setBatchNumber("");
    setQty(0);
    setHpp(0);
    setHargaJual(0);
    setExpDate("");
  }

  const totalModal = draft.reduce((s, i) => s + i.hpp * i.qty, 0);
  const totalUnit = draft.reduce((s, i) => s + i.qty, 0);
  const marginOf = (i: DraftItem) => (i.hargaJual > 0 ? ((i.hargaJual - i.hpp) / i.hargaJual) * 100 : 0);

  function saveInbound() {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setDraft([]);
      setSupplier("");
      setInvoiceNo("");
    }, 2500);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Transaksi Masuk (Batch)</h1>
          <p className="text-muted-foreground">
            Catat barang datang sebagai <strong>batch</strong> — input HPP, jumlah, kadaluarsa, pemasok, dan tetapkan harga jual.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1.5">
          <Info className="h-3.5 w-3.5" /> Stok &amp; HPP dihitung per batch (FIFO/FEFO)
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Form ── */}
        <div className="space-y-6">
          {/* Header */}
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

          {/* Item input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tambah Item / Batch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Produk / Varian</Label>
                <Select value={productId} onValueChange={(v) => { if (v) pickProduct(v); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                  <SelectContent>
                    {productOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs">No. Batch <span className="text-muted-foreground">(opsional, auto)</span></Label>
                  <Input placeholder="cth: B2026-052" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className="font-mono" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Jumlah (qty)</Label>
                  <Input type="number" min={0} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Calculator className="h-3 w-3" /> HPP / Modal per unit (Rp)</Label>
                  <Input type="number" min={0} value={hpp || ""} onChange={(e) => setHpp(Number(e.target.value))} placeholder="Harga beli per unit" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Tag className="h-3 w-3" /> Harga Jual per unit (Rp)</Label>
                  <Input type="number" min={0} value={hargaJual || ""} onChange={(e) => setHargaJual(Number(e.target.value))} placeholder="Harga jual aktif" />
                </div>
              </div>

              {/* live margin hint */}
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
                  <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} disabled={selectedProduct ? !selectedProduct.edFlag : false} />
                  {selectedProduct && !selectedProduct.edFlag && <p className="text-[11px] text-muted-foreground">Produk ini tanpa ED.</p>}
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

              <Button onClick={addItem} disabled={!selectedProduct || qty <= 0 || hpp <= 0} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Tambahkan ke Daftar
              </Button>
            </CardContent>
          </Card>

          {/* Draft items */}
          {draft.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Daftar Item Masuk ({draft.length})</CardTitle></CardHeader>
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
                            <p className="font-mono text-[11px] text-muted-foreground">{i.batchNumber}{i.expDate ? ` · ED ${i.expDate}` : ""} · {i.stockMode.toUpperCase()}</p>
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
                {/* Mobile cards */}
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

        {/* ── Summary ── */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Boxes className="h-4 w-4 text-primary" /> Ringkasan Penerimaan</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total item/batch</span><span className="font-medium">{draft.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total unit masuk</span><span className="font-medium">{totalUnit}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total Modal (HPP)</span>
                <span className="text-primary">{formatRp(totalModal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Nilai ini akan dicatat sebagai penambahan persediaan, bukan biaya — laba diakui saat barang terjual.</p>
              <Button className="w-full gap-2" disabled={draft.length === 0 || !supplier} onClick={saveInbound}>
                {saved ? <><CheckCircle2 className="h-4 w-4" /> Tersimpan &amp; stok diperbarui</> : "Simpan Transaksi Masuk"}
              </Button>
              {!supplier && draft.length > 0 && <p className="text-center text-[11px] text-amber-600">Isi nama pemasok untuk menyimpan.</p>}
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
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Produk</TableHead>
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
                  const low = b.sisa / b.qtyAwal < 0.2;
                  return (
                    <TableRow key={b.batch}>
                      <TableCell className="font-mono text-xs">{b.batch}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm font-medium">{b.produk}</TableCell>
                      <TableCell className="text-center">
                        <span className={low ? "font-semibold text-amber-600" : ""}>{b.sisa}</span>
                        <span className="text-muted-foreground"> / {b.qtyAwal}</span>
                        {low && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-amber-500" />}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatRp(b.hpp)}</TableCell>
                      <TableCell className="text-right text-sm">{formatRp(b.jual)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.ed}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.supplier}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{b.mode.toUpperCase()}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {recentBatches.map((b) => {
              const low = b.sisa / b.qtyAwal < 0.2;
              return (
                <div key={b.batch} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{b.produk}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{b.batch} · ED {b.ed}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{b.mode.toUpperCase()}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div><span className="text-muted-foreground">Sisa: </span><span className={`font-medium ${low ? "text-amber-600" : ""}`}>{b.sisa}/{b.qtyAwal}{low && " ⚠"}</span></div>
                    <div><span className="text-muted-foreground">Pemasok: </span><span className="font-medium truncate">{b.supplier}</span></div>
                    <div><span className="text-muted-foreground">HPP: </span><span className="font-medium">{formatRp(b.hpp)}</span></div>
                    <div><span className="text-muted-foreground">Jual: </span><span className="font-medium">{formatRp(b.jual)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
