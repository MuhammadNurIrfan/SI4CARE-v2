"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, Package, CheckCircle2, XCircle, FlaskConical, RotateCcw, Loader2, ArrowRight } from "lucide-react";
import { updateReturnStatus, type ReturnRow, type ReturnStatus } from "@/actions/returns";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";

const REASON_LABELS: Record<string, string> = {
  rusak: "Rusak / Cacat", tidak_sesuai: "Tidak Sesuai", kurang: "Kurang", expired: "Kadaluarsa", lainnya: "Lainnya",
};

const STATUS_CFG: Record<ReturnStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",     cls: "bg-amber-100 text-amber-800 border-amber-200",    icon: Package },
  inspeksi:   { label: "Inspeksi",    cls: "bg-blue-100 text-blue-800 border-blue-200",        icon: FlaskConical },
  layak_jual: { label: "Layak Jual",  cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  write_off:  { label: "Write-off",   cls: "bg-purple-100 text-purple-800 border-purple-200", icon: XCircle },
  ditolak:    { label: "Ditolak",     cls: "bg-red-100 text-red-800 border-red-200",           icon: XCircle },
};

export function ReturnsAdminClient({ initialRows }: { initialRows: ReturnRow[] }) {
  const [rows, setRows]       = useState(initialRows);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<string>("semua");
  const [selected, setSelected] = useState<ReturnRow | null>(null);
  const [notes, setNotes]     = useState("");
  const [isPending, startTx]  = useTransition();

  const filtered = rows.filter((r) => {
    const okS = filter === "semua" || r.status === filter;
    const q = search.toLowerCase();
    const okQ = !q || (r.userName ?? "").toLowerCase().includes(q) || r.orderId?.toLowerCase().includes(q) || "";
    return okS && okQ;
  });

  const counts = {
    semua:    rows.length,
    pending:  rows.filter((r) => r.status === "pending").length,
    inspeksi: rows.filter((r) => r.status === "inspeksi").length,
    layak_jual: rows.filter((r) => r.status === "layak_jual").length,
    write_off: rows.filter((r) => r.status === "write_off").length,
    ditolak:  rows.filter((r) => r.status === "ditolak").length,
  };

  function changeStatus(id: string, status: ReturnStatus) {
    startTx(async () => {
      await updateReturnStatus(id, status, notes || undefined);
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, status, inspectionNotes: notes || r.inspectionNotes } : r));
      setSelected(null);
      setNotes("");
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Manajemen Retur</h1>
          <p className="text-muted-foreground">Tinjau dan proses pengajuan retur pelanggan</p>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(["semua", "pending", "inspeksi", "layak_jual", "write_off", "ditolak"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-xl border p-3 text-center text-sm font-medium transition-colors ${filter === s ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50"}`}>
            <p className="text-2xl font-bold">{counts[s]}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{s === "layak_jual" ? "Layak Jual" : s === "write_off" ? "Write-off" : s.charAt(0).toUpperCase() + s.slice(1)}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari nama pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">ID Retur</th>
                  <th className="px-2 py-2 text-left font-medium">Pelanggan</th>
                  <th className="px-2 py-2 text-left font-medium">Alasan</th>
                  <th className="px-2 py-2 text-left font-medium">Tanggal</th>
                  <th className="px-2 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Tidak ada data retur</td></tr>
                )}
                {filtered.map((r) => {
                  const sc = STATUS_CFG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</td>
                      <td className="px-2 py-3 font-medium">{r.userName ?? "—"}</td>
                      <td className="px-2 py-3 text-muted-foreground">{REASON_LABELS[r.reason] ?? r.reason}</td>
                      <td className="px-2 py-3 text-muted-foreground">{r.createdAt}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sc.cls}`}>
                          <sc.icon className="h-3 w-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelected(r); setNotes(r.inspectionNotes ?? ""); }}>
                          Proses <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </DesktopOnly>

          <MobileList className="p-3">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada data retur</p>}
            {filtered.map((r) => {
              const sc = STATUS_CFG[r.status];
              return (
                <RecordCard key={r.id}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{r.userName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.createdAt}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sc.cls}`}><sc.icon className="h-3 w-3" /> {sc.label}</span>
                  </div>
                  <Field label="Alasan" value={REASON_LABELS[r.reason] ?? r.reason} />
                  {r.detail && <Field label="Detail" value={<span className="line-clamp-2 text-xs">{r.detail}</span>} />}
                  <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={() => { setSelected(r); setNotes(r.inspectionNotes ?? ""); }}>
                    Proses <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </RecordCard>
              );
            })}
          </MobileList>
        </CardContent>
      </Card>

      {/* Process dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Proses Retur — {selected?.id.slice(0, 8)}…</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-1">
              <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan</span><span className="font-medium">{selected.userName ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Alasan</span><span>{REASON_LABELS[selected.reason]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Diajukan</span><span>{selected.createdAt}</span></div>
                {selected.detail && (
                  <>
                    <Separator />
                    <p className="text-muted-foreground">{selected.detail}</p>
                  </>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Catatan Inspeksi</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hasil pemeriksaan barang..." className="min-h-[80px]" />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Alur Karantina</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Pending</span>
                  <ArrowRight className="h-3 w-3" /> Inspeksi
                  <ArrowRight className="h-3 w-3" /> Layak Jual / Write-off / Ditolak
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            {selected?.status === "pending" && (
              <Button variant="outline" className="gap-1.5" onClick={() => changeStatus(selected.id, "inspeksi")} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Mulai Inspeksi
              </Button>
            )}
            {(selected?.status === "pending" || selected?.status === "inspeksi") && (
              <>
                <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => changeStatus(selected.id, "layak_jual")} disabled={isPending}>
                  <CheckCircle2 className="h-4 w-4" /> Layak Jual
                </Button>
                <Button variant="outline" className="gap-1.5 text-purple-700 border-purple-300" onClick={() => changeStatus(selected.id, "write_off")} disabled={isPending}>
                  <RotateCcw className="h-4 w-4" /> Write-off
                </Button>
                <Button variant="outline" className="gap-1.5 text-destructive" onClick={() => changeStatus(selected.id, "ditolak")} disabled={isPending}>
                  <XCircle className="h-4 w-4" /> Tolak
                </Button>
              </>
            )}
            {(selected?.status === "layak_jual" || selected?.status === "write_off" || selected?.status === "ditolak") && (
              <p className="text-sm text-muted-foreground">Retur ini sudah selesai diproses.</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
