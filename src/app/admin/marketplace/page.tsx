"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Search, Wallet, Clock, CheckCircle2, AlertTriangle, Calculator, Store, ArrowRight,
} from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type Status = "pending" | "dana_masuk" | "selesai";

interface Trx {
  id: string;
  noPesanan: string;
  platform: string;
  tanggal: string;
  pembeli: string;
  items: number;
  nilaiBarang: number;
  hpp: number;
  komisi: number;   // komisi platform (Rp)
  mdr: number;      // biaya pembayaran (Rp)
  biayaLayanan: number;
  netDiharapkan: number; // yang seharusnya diterima
  danaDiterima: number | null;
  status: Status;
}

const seed: Omit<Trx, "netDiharapkan">[] = [
  { id: "1", noPesanan: "TKP/0612/8841", platform: "Tokopedia", tanggal: "2026-06-06", pembeli: "Andi Saputra", items: 1, nilaiBarang: 540000, hpp: 420000, komisi: 9720, mdr: 3780, biayaLayanan: 1000, danaDiterima: null, status: "pending" },
  { id: "2", noPesanan: "SHP/0606/2210", platform: "Shopee", tanggal: "2026-06-06", pembeli: "Maria Lestari", items: 3, nilaiBarang: 135000, hpp: 96000, komisi: 2970, mdr: 945, biayaLayanan: 1250, danaDiterima: null, status: "pending" },
  { id: "3", noPesanan: "TKP/0605/8830", platform: "Tokopedia", tanggal: "2026-06-05", pembeli: "Budi Hartono", items: 1, nilaiBarang: 1250000, hpp: 980000, komisi: 22500, mdr: 8750, biayaLayanan: 1000, danaDiterima: 1216500, status: "dana_masuk" },
  { id: "4", noPesanan: "LZD/0605/1190", platform: "Lazada", tanggal: "2026-06-05", pembeli: "Sinta Dewi", items: 2, nilaiBarang: 350000, hpp: 240000, komisi: 8750, mdr: 2450, biayaLayanan: 1500, danaDiterima: null, status: "pending" },
  { id: "5", noPesanan: "SHP/0604/2188", platform: "Shopee", tanggal: "2026-06-04", pembeli: "Rudi Wijaya", items: 1, nilaiBarang: 620000, hpp: 470000, komisi: 13640, mdr: 4340, biayaLayanan: 1250, danaDiterima: 600770, status: "selesai" },
  { id: "6", noPesanan: "TKP/0604/8801", platform: "Tokopedia", tanggal: "2026-06-04", pembeli: "Lina Marlina", items: 4, nilaiBarang: 180000, hpp: 128000, komisi: 3240, mdr: 1260, biayaLayanan: 1000, danaDiterima: 170000, status: "dana_masuk" },
];

const withExpected = (t: Omit<Trx, "netDiharapkan">): Trx => ({
  ...t,
  netDiharapkan: t.nilaiBarang - t.komisi - t.mdr - t.biayaLayanan,
});

const statusCfg: Record<Status, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "Pending Validasi", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  dana_masuk: { label: "Dana Masuk Rekening", cls: "bg-blue-100 text-blue-800 border-blue-200", icon: Wallet },
  selesai: { label: "Selesai (Final)", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
};

export default function MarketplacePage() {
  const [rows, setRows] = useState<Trx[]>(seed.map(withExpected));
  const [platform, setPlatform] = useState("semua");
  const [status, setStatus] = useState("semua");
  const [search, setSearch] = useState("");
  const [verify, setVerify] = useState<Trx | null>(null);
  const [diterimaInput, setDiterimaInput] = useState("");

  const filtered = useMemo(() => rows.filter((r) => {
    const okP = platform === "semua" || r.platform === platform;
    const okS = status === "semua" || r.status === status;
    const q = search.toLowerCase();
    const okQ = !q || r.noPesanan.toLowerCase().includes(q) || r.pembeli.toLowerCase().includes(q);
    return okP && okS && okQ;
  }), [rows, platform, status, search]);

  // summary
  const pendingRows = rows.filter((r) => r.status === "pending");
  const danaPending = pendingRows.reduce((s, r) => s + r.netDiharapkan, 0);
  const danaMasuk = rows.filter((r) => r.status !== "pending").reduce((s, r) => s + (r.danaDiterima ?? 0), 0);
  const selisihTotal = rows.filter((r) => r.danaDiterima !== null).reduce((s, r) => s + ((r.danaDiterima ?? 0) - r.netDiharapkan), 0);

  function openVerify(t: Trx) {
    setVerify(t);
    setDiterimaInput(t.danaDiterima !== null ? String(t.danaDiterima) : String(t.netDiharapkan));
  }
  function applyStatus(newStatus: Status) {
    if (!verify) return;
    const diterima = Number(diterimaInput) || 0;
    setRows((prev) => prev.map((r) => r.id === verify.id ? { ...r, status: newStatus, danaDiterima: newStatus === "pending" ? null : diterima } : r));
    setVerify(null);
  }

  const selisihPreview = verify ? (Number(diterimaInput) || 0) - verify.netDiharapkan : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Transaksi E-commerce (Input Manual)</h1>
          <p className="max-w-2xl text-muted-foreground">
            Catatan transaksi tiap marketplace yang diinput manual oleh admin (tanpa API). Verifikasi di sini saat <strong>dana sudah masuk rekening</strong> hingga transaksi <strong>selesai &amp; laba final</strong>.
          </p>
        </div>
        <Link href="/admin/pos">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Input Transaksi Baru</Button>
        </Link>
      </div>

      {/* Info strip */}
      <div className="flex gap-3 rounded-xl border bg-muted/40 p-3.5 text-sm">
        <Store className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          Alur: input di <Link href="/admin/pos" className="font-medium text-primary underline-offset-2 hover:underline">Kasir → Transaksi Marketplace</Link> → muncul di sini sebagai <strong>Pending</strong> &amp; masuk <em>Dana Pending</em> di Dashboard → tandai <strong>Dana Masuk Rekening</strong> saat settlement diterima → <strong>Selesai</strong> untuk mengakui laba final.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="mb-1 flex items-center gap-1.5 text-amber-700"><Clock className="h-4 w-4" /><p className="text-xs">Pending Validasi</p></div>
            <p className="text-2xl font-bold text-amber-700">{pendingRows.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">transaksi</p>
          </CardContent>
        </Card>
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="mb-1 flex items-center gap-1.5 text-amber-700"><Wallet className="h-4 w-4" /><p className="text-xs">Dana Belum Masuk</p></div>
            <p className="text-2xl font-bold text-amber-700">{formatRp(danaPending)}</p>
            <p className="mt-1 text-xs text-muted-foreground">estimasi net diharapkan</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-300 bg-emerald-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="mb-1 flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><p className="text-xs">Dana Sudah Masuk</p></div>
            <p className="text-2xl font-bold text-emerald-700">{formatRp(danaMasuk)}</p>
            <p className="mt-1 text-xs text-muted-foreground">tervalidasi</p>
          </CardContent>
        </Card>
        <Card className={selisihTotal < 0 ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardContent className="pt-4 pb-3">
            <div className="mb-1 flex items-center gap-1.5 text-muted-foreground"><Calculator className="h-4 w-4" /><p className="text-xs">Selisih Settlement</p></div>
            <p className={`text-2xl font-bold ${selisihTotal < 0 ? "text-destructive" : "text-foreground"}`}>{formatRp(selisihTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">diterima − diharapkan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari no. pesanan atau pembeli…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={platform} onValueChange={(v) => { if (v) setPlatform(v); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Platform</SelectItem>
              <SelectItem value="Tokopedia">Tokopedia</SelectItem>
              <SelectItem value="Shopee">Shopee</SelectItem>
              <SelectItem value="Lazada">Lazada</SelectItem>
              <SelectItem value="Blibli">Blibli</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="pending">Pending Validasi</SelectItem>
              <SelectItem value="dana_masuk">Dana Masuk Rekening</SelectItem>
              <SelectItem value="selesai">Selesai (Final)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table (desktop) */}
      <Card>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pesanan</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Pembeli</TableHead>
                  <TableHead className="text-right">Nilai Barang</TableHead>
                  <TableHead className="text-right">Net Diharapkan</TableHead>
                  <TableHead className="text-right">Dana Diterima</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Tidak ada transaksi</TableCell></TableRow>
                )}
                {filtered.map((r) => {
                  const cfg = statusCfg[r.status];
                  const selisih = r.danaDiterima !== null ? r.danaDiterima - r.netDiharapkan : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell><p className="font-mono text-xs">{r.noPesanan}</p><p className="text-[11px] text-muted-foreground">{r.tanggal} · {r.items} item</p></TableCell>
                      <TableCell><Badge variant="outline">{r.platform}</Badge></TableCell>
                      <TableCell className="text-sm">{r.pembeli}</TableCell>
                      <TableCell className="text-right text-sm">{formatRp(r.nilaiBarang)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatRp(r.netDiharapkan)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {r.danaDiterima !== null ? (
                          <span>{formatRp(r.danaDiterima)}
                            {selisih !== null && selisih !== 0 && (
                              <span className={`block text-[11px] ${selisih < 0 ? "text-destructive" : "text-emerald-600"}`}>{selisih > 0 ? "+" : ""}{formatRp(selisih)}</span>
                            )}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                          <cfg.icon className="h-3 w-3" /> {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant={r.status === "selesai" ? "ghost" : "outline"} size="sm" onClick={() => openVerify(r)} className="gap-1.5">
                          {r.status === "selesai" ? "Lihat" : "Verifikasi"} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DesktopOnly>

          {/* Cards (mobile) */}
          <MobileList className="p-3">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada transaksi</p>}
            {filtered.map((r) => {
              const cfg = statusCfg[r.status];
              const selisih = r.danaDiterima !== null ? r.danaDiterima - r.netDiharapkan : null;
              return (
                <RecordCard key={r.id}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold">{r.noPesanan}</p>
                      <p className="text-xs text-muted-foreground">{r.tanggal} · {r.pembeli}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}>
                      <cfg.icon className="h-3 w-3" /> {cfg.label}
                    </span>
                  </div>
                  <Field label="Platform" value={<Badge variant="outline">{r.platform}</Badge>} />
                  <Field label="Nilai barang" value={formatRp(r.nilaiBarang)} />
                  <Field label="Net diharapkan" value={formatRp(r.netDiharapkan)} />
                  <Field
                    label="Dana diterima"
                    value={r.danaDiterima !== null ? (
                      <span>{formatRp(r.danaDiterima)}{selisih !== null && selisih !== 0 && <span className={`block text-[11px] ${selisih < 0 ? "text-destructive" : "text-emerald-600"}`}>{selisih > 0 ? "+" : ""}{formatRp(selisih)}</span>}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  />
                  <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 border-t" onClick={() => openVerify(r)}>
                    {r.status === "selesai" ? "Lihat" : "Verifikasi"} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </RecordCard>
              );
            })}
          </MobileList>
        </CardContent>
      </Card>

      {/* Verify dialog */}
      <Dialog open={!!verify} onOpenChange={(o) => !o && setVerify(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verifikasi Settlement — {verify?.noPesanan}</DialogTitle>
          </DialogHeader>
          {verify && (
            <div className="space-y-4 py-1">
              {/* Breakdown */}
              <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Nilai barang</span><span className="font-medium">{formatRp(verify.nilaiBarang)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>HPP</span><span>−{formatRp(verify.hpp)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Komisi platform</span><span>−{formatRp(verify.komisi)}</span></div>
                <div className="flex justify-between text-amber-700"><span>MDR / biaya bayar</span><span>−{formatRp(verify.mdr)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Biaya layanan</span><span>−{formatRp(verify.biayaLayanan)}</span></div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold"><span>Net diharapkan masuk</span><span>{formatRp(verify.netDiharapkan)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Estimasi laba (net − HPP)</span><span>{formatRp(verify.netDiharapkan - verify.hpp)}</span></div>
              </div>

              {/* Input */}
              <div className="grid gap-1.5">
                <Label className="text-xs">Dana yang benar-benar masuk rekening (Rp)</Label>
                <Input type="number" value={diterimaInput} onChange={(e) => setDiterimaInput(e.target.value)} />
              </div>
              <div className={`flex items-center gap-2 rounded-lg p-2.5 text-sm ${selisihPreview < 0 ? "bg-red-50 text-red-700" : selisihPreview > 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {selisihPreview < 0 ? <AlertTriangle className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
                Selisih vs diharapkan: <strong>{selisihPreview > 0 ? "+" : ""}{formatRp(selisihPreview)}</strong>
                {selisihPreview < 0 && " — dana kurang dari ekspektasi."}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {verify?.status !== "pending" && (
              <Button variant="ghost" className="text-muted-foreground" onClick={() => applyStatus("pending")}>Kembalikan ke Pending</Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1.5" onClick={() => applyStatus("dana_masuk")}>
                <Wallet className="h-4 w-4" /> Dana Masuk Rekening
              </Button>
              <Button className="gap-1.5" onClick={() => applyStatus("selesai")}>
                <CheckCircle2 className="h-4 w-4" /> Selesai &amp; Validasi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
