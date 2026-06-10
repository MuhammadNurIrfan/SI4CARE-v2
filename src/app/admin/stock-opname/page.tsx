"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck, Search, ScanLine, CheckCircle2, AlertTriangle, Minus, Plus,
  RotateCcw, FileCheck2, PackageSearch, Printer, Equal,
} from "lucide-react";

/* ── Data item opname (mock) ── */
type SoItem = {
  id: string;
  nama: string;
  sku: string;
  barcode: string;
  kategori: string;
  lokasi: string;
  hpp: number;        // nilai per unit utk hitung nilai selisih
  stokSistem: number;
  stokFisik: number | null; // null = belum dihitung
  catatan: string;
};

const initialItems: SoItem[] = [
  { id: "1", nama: "Tensimeter Digital OMRON HEM-7130", sku: "OMR-TEN-001", barcode: "8991234500017", kategori: "Alat Diagnostik", lokasi: "Rak A1", hpp: 380000, stokSistem: 24, stokFisik: null, catatan: "" },
  { id: "2", nama: "Nebulizer Omron NE-C28", sku: "OMR-NEB-001", barcode: "8991234500024", kategori: "Alat Terapi", lokasi: "Rak A2", hpp: 510000, stokSistem: 3, stokFisik: null, catatan: "" },
  { id: "3", nama: "Masker Bedah 3-ply (50 pcs)", sku: "MSK-BDH-050", barcode: "8991234500031", kategori: "APD", lokasi: "Rak B1", hpp: 22000, stokSistem: 150, stokFisik: null, catatan: "" },
  { id: "4", nama: "Pulse Oximeter Fingertip", sku: "OXI-FNG-001", barcode: "8991234500048", kategori: "Alat Diagnostik", lokasi: "Rak A1", hpp: 120000, stokSistem: 18, stokFisik: null, catatan: "" },
  { id: "5", nama: "Betadine Antiseptik 300ml", sku: "BTD-ANT-300", barcode: "8991234500055", kategori: "Antiseptik", lokasi: "Rak C2", hpp: 30000, stokSistem: 45, stokFisik: null, catatan: "" },
  { id: "6", nama: "Kursi Roda Lipat Standar", sku: "KRS-LPT-001", barcode: "8991234500062", kategori: "Alat Bantu Jalan", lokasi: "Gudang", hpp: 980000, stokSistem: 7, stokFisik: null, catatan: "" },
  { id: "7", nama: "Termometer Infrared Digital", sku: "TRM-INF-001", barcode: "8991234500079", kategori: "Alat Diagnostik", lokasi: "Rak A3", hpp: 130000, stokSistem: 12, stokFisik: null, catatan: "" },
  { id: "8", nama: "Handscoon Latex M (100 pcs)", sku: "HND-LTX-M", barcode: "8991234500086", kategori: "APD", lokasi: "Rak B2", hpp: 48000, stokSistem: 80, stokFisik: null, catatan: "" },
  { id: "9", nama: "Kasa Steril 16x16 (Box 10)", sku: "BHP-KAS-001", barcode: "8991234500093", kategori: "Bahan Habis Pakai", lokasi: "Rak B3", hpp: 8000, stokSistem: 200, stokFisik: null, catatan: "" },
  { id: "10", nama: "Stetoskop Littmann Classic III", sku: "ALK-STE-001", barcode: "8991234500109", kategori: "Alat Diagnostik", lokasi: "Etalase", hpp: 1450000, stokSistem: 4, stokFisik: null, catatan: "" },
];

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type StatusFilter = "semua" | "belum" | "cocok" | "selisih";

const itemStatus = (i: SoItem): Exclude<StatusFilter, "semua"> =>
  i.stokFisik === null ? "belum" : i.stokFisik === i.stokSistem ? "cocok" : "selisih";

export default function StockOpnamePage() {
  const [items, setItems] = useState<SoItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [finishOpen, setFinishOpen] = useState(false);
  const [done, setDone] = useState(false);
  const scanRef = useRef<HTMLInputElement | null>(null);

  const sessionNo = "SO-2026-0610-01";

  const kategoriList = ["Semua", ...Array.from(new Set(items.map((i) => i.kategori)))];

  /* ── statistik ── */
  const counted = items.filter((i) => i.stokFisik !== null).length;
  const matched = items.filter((i) => itemStatus(i) === "cocok").length;
  const diffs = items.filter((i) => itemStatus(i) === "selisih");
  const progress = Math.round((counted / items.length) * 100);
  const totalSelisihQty = diffs.reduce((s, i) => s + ((i.stokFisik ?? 0) - i.stokSistem), 0);
  const totalSelisihNilai = diffs.reduce((s, i) => s + ((i.stokFisik ?? 0) - i.stokSistem) * i.hpp, 0);

  /* ── filter ── */
  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const q = search.toLowerCase();
        const okSearch = !q || i.nama.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.barcode.includes(search);
        const okKat = kategori === "Semua" || i.kategori === kategori;
        const okStatus = status === "semua" || itemStatus(i) === status;
        return okSearch && okKat && okStatus;
      }),
    [items, search, kategori, status]
  );

  /* ── aksi ── */
  const setFisik = (id: string, v: number | null) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, stokFisik: v === null ? null : Math.max(0, v) } : i)));
  const setCatatan = (id: string, v: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, catatan: v } : i)));
  const adjustFisik = (id: string, d: number) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, stokFisik: Math.max(0, (i.stokFisik ?? 0) + d) } : i)));
  const markSesuai = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, stokFisik: i.stokSistem } : i)));

  /** Scan barcode: cocokkan, lalu +1 stok fisik item tsb */
  const handleScan = (code: string) => {
    const item = items.find((i) => i.barcode === code.trim() || i.sku === code.trim());
    if (item) {
      adjustFisik(item.id, 1);
      setSearch("");
    }
  };

  const resetAll = () => {
    setItems(initialItems);
    setDone(false);
  };

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: "semua", label: "Semua", count: items.length },
    { key: "belum", label: "Belum Dihitung", count: items.length - counted },
    { key: "cocok", label: "Cocok", count: matched },
    { key: "selisih", label: "Selisih", count: diffs.length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Stock Opname
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Sesi <span className="font-mono font-medium text-foreground">{sessionNo}</span> · 10 Juni 2026 · Petugas: Super Admin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={done ? "default" : "secondary"} className={done ? "bg-emerald-600" : ""}>
            {done ? "Selesai & Disesuaikan" : "Sedang Berlangsung"}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={resetAll}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Progress & stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground">Progress Hitung</p>
            <p className="text-xl font-bold">{counted}/{items.length} <span className="text-sm font-medium text-muted-foreground">item</span></p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground">Stok Cocok</p>
            <p className="text-xl font-bold text-emerald-600">{matched}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">fisik = sistem</p>
          </CardContent>
        </Card>
        <Card className={`py-0 ${diffs.length > 0 ? "border-amber-300 bg-amber-50/50" : ""}`}>
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground">Item Selisih</p>
            <p className="text-xl font-bold text-amber-600">{diffs.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{totalSelisihQty >= 0 ? "+" : ""}{totalSelisihQty} unit total</p>
          </CardContent>
        </Card>
        <Card className={`py-0 ${totalSelisihNilai < 0 ? "border-destructive/30 bg-destructive/5" : ""}`}>
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground">Nilai Selisih (HPP)</p>
            <p className={`text-lg font-bold ${totalSelisihNilai < 0 ? "text-destructive" : totalSelisihNilai > 0 ? "text-emerald-600" : ""}`}>
              {totalSelisihNilai >= 0 ? "+" : ""}{formatRp(totalSelisihNilai)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: scan + search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            ref={scanRef}
            placeholder="Scan barcode (Enter) atau cari nama / SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleScan(search); }}
            className="pl-9"
          />
        </div>
        <Select value={kategori} onValueChange={(v) => { if (v) setKategori(v); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {kategoriList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {statusChips.map((c) => (
          <button
            key={c.key}
            onClick={() => setStatus(c.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${status === c.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
          >
            {c.label} <span className={status === c.key ? "opacity-80" : "text-muted-foreground"}>({c.count})</span>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden lg:block py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-center">Stok Sistem</TableHead>
                <TableHead className="text-center w-[180px]">Stok Fisik</TableHead>
                <TableHead className="text-center">Selisih</TableHead>
                <TableHead className="w-[200px]">Catatan</TableHead>
                <TableHead className="text-right">Aksi Cepat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Tidak ada item</TableCell></TableRow>
              )}
              {filtered.map((i) => {
                const st = itemStatus(i);
                const diff = i.stokFisik === null ? null : i.stokFisik - i.stokSistem;
                return (
                  <TableRow key={i.id} className={st === "selisih" ? "bg-amber-50/40" : ""}>
                    <TableCell>
                      <p className="font-medium max-w-[220px] truncate">{i.nama}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{i.sku} · {i.barcode}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.lokasi}</TableCell>
                    <TableCell className="text-center font-semibold">{i.stokSistem}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustFisik(i.id, -1)} disabled={i.stokFisik === null || i.stokFisik === 0} aria-label="Kurangi"><Minus className="h-3 w-3" /></Button>
                        <Input
                          type="number"
                          min={0}
                          value={i.stokFisik ?? ""}
                          placeholder="—"
                          onChange={(e) => setFisik(i.id, e.target.value === "" ? null : Number(e.target.value))}
                          className="h-7 w-16 text-center text-sm font-semibold"
                        />
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustFisik(i.id, 1)} aria-label="Tambah"><Plus className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {diff === null ? (
                        <Badge variant="secondary" className="text-[10px]">Belum</Badge>
                      ) : diff === 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> Cocok</Badge>
                      ) : (
                        <Badge className={`text-[10px] gap-1 ${diff < 0 ? "bg-red-100 text-red-800 border-red-200" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                          <AlertTriangle className="h-3 w-3" /> {diff > 0 ? "+" : ""}{diff}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={i.catatan}
                        onChange={(e) => setCatatan(i.id, e.target.value)}
                        placeholder={st === "selisih" ? "Wajib: alasan selisih..." : "Catatan..."}
                        className={`h-7 text-xs ${st === "selisih" && !i.catatan ? "border-amber-400" : ""}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => markSesuai(i.id)}>
                        <Equal className="h-3 w-3" /> Sesuai Sistem
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-2.5 lg:hidden">
        {filtered.length === 0 && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground"><PackageSearch className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada item</CardContent></Card>
        )}
        {filtered.map((i) => {
          const st = itemStatus(i);
          const diff = i.stokFisik === null ? null : i.stokFisik - i.stokSistem;
          return (
            <Card key={i.id} className={`py-0 ${st === "selisih" ? "border-amber-300" : ""}`}>
              <CardContent className="p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{i.nama}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{i.sku} · {i.lokasi}</p>
                  </div>
                  {diff === null ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">Belum</Badge>
                  ) : diff === 0 ? (
                    <Badge className="shrink-0 bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">Cocok</Badge>
                  ) : (
                    <Badge className={`shrink-0 text-[10px] ${diff < 0 ? "bg-red-100 text-red-800 border-red-200" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                      Selisih {diff > 0 ? "+" : ""}{diff}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    Sistem: <span className="font-bold text-foreground">{i.stokSistem}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustFisik(i.id, -1)} disabled={i.stokFisik === null || i.stokFisik === 0} aria-label="Kurangi"><Minus className="h-3.5 w-3.5" /></Button>
                    <Input
                      type="number" min={0} value={i.stokFisik ?? ""} placeholder="—"
                      onChange={(e) => setFisik(i.id, e.target.value === "" ? null : Number(e.target.value))}
                      className="h-8 w-16 text-center text-sm font-bold"
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustFisik(i.id, 1)} aria-label="Tambah"><Plus className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 text-[11px]" onClick={() => markSesuai(i.id)}>= Sistem</Button>
                  </div>
                </div>
                {st === "selisih" && (
                  <Input
                    value={i.catatan}
                    onChange={(e) => setCatatan(i.id, e.target.value)}
                    placeholder="Alasan selisih (rusak/hilang/salah input)..."
                    className={`h-8 text-xs ${!i.catatan ? "border-amber-400" : ""}`}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div className="lg:static fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="flex items-center gap-3 lg:justify-end">
          <div className="flex-1 text-xs text-muted-foreground lg:hidden">
            {counted}/{items.length} dihitung · {diffs.length} selisih
          </div>
          <Button
            className="gap-2 font-semibold"
            disabled={counted < items.length || done}
            onClick={() => setFinishOpen(true)}
          >
            <FileCheck2 className="h-4 w-4" />
            {done ? "Sudah Disesuaikan" : counted < items.length ? `Hitung Semua Dulu (${items.length - counted})` : "Selesaikan Opname"}
          </Button>
        </div>
      </div>

      {/* Finish dialog */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-primary" /> Ringkasan Penyesuaian Stok</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border p-2.5">
                <p className="text-lg font-bold">{items.length}</p>
                <p className="text-[11px] text-muted-foreground">Item dihitung</p>
              </div>
              <div className="rounded-lg border p-2.5">
                <p className="text-lg font-bold text-emerald-600">{matched}</p>
                <p className="text-[11px] text-muted-foreground">Cocok</p>
              </div>
              <div className="rounded-lg border p-2.5">
                <p className="text-lg font-bold text-amber-600">{diffs.length}</p>
                <p className="text-[11px] text-muted-foreground">Selisih</p>
              </div>
            </div>

            {diffs.length > 0 ? (
              <div className="rounded-lg border divide-y overflow-hidden">
                {diffs.map((i) => {
                  const d = (i.stokFisik ?? 0) - i.stokSistem;
                  return (
                    <div key={i.id} className="flex items-center gap-3 p-2.5 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-xs">{i.nama}</p>
                        <p className="text-[11px] text-muted-foreground">{i.stokSistem} → {i.stokFisik} {i.catatan && `· ${i.catatan}`}</p>
                      </div>
                      <span className={`shrink-0 font-bold text-xs ${d < 0 ? "text-destructive" : "text-blue-600"}`}>{d > 0 ? "+" : ""}{d}</span>
                      <span className={`shrink-0 w-24 text-right text-xs font-medium ${d * i.hpp < 0 ? "text-destructive" : "text-emerald-600"}`}>{formatRp(d * i.hpp)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between bg-muted/30 p-2.5 text-sm font-bold">
                  <span>Total Nilai Penyesuaian</span>
                  <span className={totalSelisihNilai < 0 ? "text-destructive" : "text-emerald-600"}>{totalSelisihNilai >= 0 ? "+" : ""}{formatRp(totalSelisihNilai)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
                <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6" /> Semua stok cocok — tidak ada penyesuaian yang diperlukan.
              </div>
            )}

            <Separator />
            <div className="grid gap-1.5">
              <Label className="text-xs">Disetujui oleh</Label>
              <Input placeholder="Nama Owner / Penanggung jawab" defaultValue="Super Admin" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Cetak Berita Acara</Button>
            <Button
              onClick={() => { setDone(true); setFinishOpen(false); }}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" /> Konfirmasi & Sesuaikan Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
