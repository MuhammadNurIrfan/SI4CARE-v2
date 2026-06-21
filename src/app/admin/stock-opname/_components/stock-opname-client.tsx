"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  ClipboardCheck, ScanLine, CheckCircle2, AlertTriangle, Minus, Plus,
  FileCheck2, PackageSearch, Printer, Equal, Save, Loader2, History,
} from "lucide-react";
import {
  startSoSession, saveOpnameProgress, closeSession,
  type SoItemRow, type OpenSessionData, type SoSessionRow,
} from "@/actions/stock-opname";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type StatusFilter = "semua" | "belum" | "cocok" | "selisih";

const itemStatus = (i: SoItemRow): Exclude<StatusFilter, "semua"> =>
  i.physicalStock === null ? "belum" : i.physicalStock === i.systemStock ? "cocok" : "selisih";

type Props = {
  existingSession: OpenSessionData | null;
  userId: string;
  history: SoSessionRow[];
};

export function StockOpnameClient({ existingSession, userId, history }: Props) {
  const router = useRouter();
  const [isPending, startTx] = useTransition();

  // Local item state (loaded from DB session or empty)
  const [items, setItems] = useState<SoItemRow[]>(existingSession?.items ?? []);
  const [sessionId, setSessionId] = useState(existingSession?.session.id ?? "");
  const [sessionNo, setSessionNo] = useState(existingSession?.session.sessionNo ?? "");
  const [sessionDate, setSessionDate] = useState(
    existingSession ? new Date(existingSession.session.conductedAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : "",
  );
  const [done, setDone] = useState(existingSession?.session.status === "selesai");

  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [finishOpen, setFinishOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [savingMsg, setSavingMsg] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement | null>(null);

  const hasSession = !!sessionId;

  const kategoriList = useMemo(
    () => ["Semua", ...Array.from(new Set(items.map((i) => i.sku.split("-")[0] ?? "")))],
    [items],
  );

  const counted = items.filter((i) => i.physicalStock !== null).length;
  const matched = items.filter((i) => itemStatus(i) === "cocok").length;
  const diffs = items.filter((i) => itemStatus(i) === "selisih");
  const progress = items.length > 0 ? Math.round((counted / items.length) * 100) : 0;
  const totalSelisihQty = diffs.reduce((s, i) => s + ((i.physicalStock ?? 0) - i.systemStock), 0);
  const totalSelisihNilai = diffs.reduce((s, i) => s + ((i.physicalStock ?? 0) - i.systemStock) * i.hpp, 0);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const q = search.toLowerCase();
        const okSearch = !q || i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.barcode ?? "").includes(search);
        const okKat = kategori === "Semua" || i.sku.startsWith(kategori);
        const okStatus = status === "semua" || itemStatus(i) === status;
        return okSearch && okKat && okStatus;
      }),
    [items, search, kategori, status],
  );

  function setFisik(id: string, v: number | null) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, physicalStock: v === null ? null : Math.max(0, v) } : i)));
  }
  function setCatatan(id: string, v: string) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, notes: v } : i)));
  }
  function adjustFisik(id: string, d: number) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, physicalStock: Math.max(0, (i.physicalStock ?? i.systemStock) + d) } : i)));
  }
  function markSesuai(id: string) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, physicalStock: i.systemStock } : i)));
  }
  function handleScan(code: string) {
    const item = items.find((i) => i.barcode === code.trim() || i.sku === code.trim());
    if (item) { adjustFisik(item.id, 1); setSearch(""); }
  }

  function handleStart() {
    startTx(async () => {
      const res = await startSoSession(userId);
      router.refresh();
      setSessionId(res.sessionId);
      setSessionNo(res.sessionNo);
      setSessionDate(new Date().toLocaleDateString("id-ID", { dateStyle: "long" }));
    });
  }

  function handleSaveProgress() {
    startTx(async () => {
      await saveOpnameProgress(items.map((i) => ({ id: i.id, physicalStock: i.physicalStock, notes: i.notes ?? "" })));
      setSavingMsg("Progres disimpan ✓");
      setTimeout(() => setSavingMsg(null), 2000);
    });
  }

  function handleFinish() {
    startTx(async () => {
      await closeSession(sessionId, userId);
      setDone(true);
      setFinishOpen(false);
      router.refresh();
    });
  }

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: "semua", label: "Semua", count: items.length },
    { key: "belum", label: "Belum Dihitung", count: items.length - counted },
    { key: "cocok", label: "Cocok", count: matched },
    { key: "selisih", label: "Selisih", count: diffs.length },
  ];

  /* ── Empty state: no session yet ── */
  if (!hasSession) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight">
              <ClipboardCheck className="h-6 w-6 text-primary" /> Stock Opname
            </h1>
            <p className="text-sm text-muted-foreground">Belum ada sesi opname aktif.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHistOpen(true)}>
            <History className="h-4 w-4" /> Riwayat Sesi
          </Button>
        </div>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">Mulai Sesi Stock Opname Baru</p>
              <p className="text-sm text-muted-foreground mt-1">Sistem akan mengambil snapshot stok saat ini dari database sebagai acuan hitung fisik.</p>
            </div>
            <Button onClick={handleStart} disabled={isPending} className="gap-2 w-full">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              Mulai Sesi Baru
            </Button>
          </CardContent>
        </Card>
        <HistoryDialog open={histOpen} onClose={() => setHistOpen(false)} history={history} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Stock Opname
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Sesi <span className="font-mono font-medium text-foreground">{sessionNo}</span>
            {sessionDate && ` · ${sessionDate}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={done ? "default" : "secondary"} className={done ? "bg-emerald-600" : ""}>
            {done ? "Selesai & Disesuaikan" : "Sedang Berlangsung"}
          </Badge>
          {savingMsg && <span className="text-xs text-emerald-600 font-medium">{savingMsg}</span>}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHistOpen(true)}>
            <History className="h-3.5 w-3.5" /> Riwayat
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

      {/* Toolbar */}
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
          <button key={c.key} onClick={() => setStatus(c.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${status === c.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
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
                <TableHead>SKU</TableHead>
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
                const diff = i.physicalStock === null ? null : i.physicalStock - i.systemStock;
                return (
                  <TableRow key={i.id} className={st === "selisih" ? "bg-amber-50/40" : ""}>
                    <TableCell>
                      <p className="font-medium max-w-[220px] truncate">{i.productName}</p>
                      {i.barcode && <p className="font-mono text-[11px] text-muted-foreground">{i.barcode}</p>}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{i.sku}</TableCell>
                    <TableCell className="text-center font-semibold">{i.systemStock}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustFisik(i.id, -1)} disabled={i.physicalStock === 0} aria-label="Kurangi"><Minus className="h-3 w-3" /></Button>
                        <Input type="number" min={0} value={i.physicalStock ?? ""} placeholder="—"
                          onChange={(e) => setFisik(i.id, e.target.value === "" ? null : Number(e.target.value))}
                          className="h-7 w-16 text-center text-sm font-semibold" />
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
                      <Input value={i.notes ?? ""} onChange={(e) => setCatatan(i.id, e.target.value)}
                        placeholder={st === "selisih" ? "Wajib: alasan selisih..." : "Catatan..."}
                        className={`h-7 text-xs ${st === "selisih" && !i.notes ? "border-amber-400" : ""}`} />
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
          const diff = i.physicalStock === null ? null : i.physicalStock - i.systemStock;
          return (
            <Card key={i.id} className={`py-0 ${st === "selisih" ? "border-amber-300" : ""}`}>
              <CardContent className="p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{i.productName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{i.sku}</p>
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
                  <div className="text-xs text-muted-foreground">Sistem: <span className="font-bold text-foreground">{i.systemStock}</span></div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustFisik(i.id, -1)} disabled={i.physicalStock === 0} aria-label="Kurangi"><Minus className="h-3.5 w-3.5" /></Button>
                    <Input type="number" min={0} value={i.physicalStock ?? ""} placeholder="—"
                      onChange={(e) => setFisik(i.id, e.target.value === "" ? null : Number(e.target.value))}
                      className="h-8 w-16 text-center text-sm font-bold" />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustFisik(i.id, 1)} aria-label="Tambah"><Plus className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 text-[11px]" onClick={() => markSesuai(i.id)}>= Sistem</Button>
                  </div>
                </div>
                {st === "selisih" && (
                  <Input value={i.notes ?? ""} onChange={(e) => setCatatan(i.id, e.target.value)}
                    placeholder="Alasan selisih (rusak/hilang/salah input)..."
                    className={`h-8 text-xs ${!i.notes ? "border-amber-400" : ""}`} />
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSaveProgress} disabled={isPending || done}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Simpan Progres
          </Button>
          <Button className="gap-2 font-semibold" disabled={counted < items.length || done || isPending}
            onClick={() => setFinishOpen(true)}>
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
                  const d = (i.physicalStock ?? 0) - i.systemStock;
                  return (
                    <div key={i.id} className="flex items-center gap-3 p-2.5 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-xs">{i.productName}</p>
                        <p className="text-[11px] text-muted-foreground">{i.systemStock} → {i.physicalStock} {i.notes && `· ${i.notes}`}</p>
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
              <Label className="text-xs">Catatan Sesi</Label>
              <Input placeholder="Catatan penutupan sesi (opsional)" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Cetak Berita Acara</Button>
            <Button onClick={handleFinish} disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Konfirmasi &amp; Sesuaikan Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HistoryDialog open={histOpen} onClose={() => setHistOpen(false)} history={history} />
    </div>
  );
}

function HistoryDialog({ open, onClose, history }: { open: boolean; onClose: () => void; history: SoSessionRow[] }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80dvh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Riwayat Sesi Opname</DialogTitle></DialogHeader>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada sesi selesai.</p>
        ) : (
          <div className="divide-y">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-mono font-medium">{s.sessionNo}</p>
                  <p className="text-xs text-muted-foreground">{s.conductedAt}</p>
                </div>
                <Badge className={s.status === "selesai" ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs" : "text-xs"}>
                  {s.status === "selesai" ? "Selesai" : "Open"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
