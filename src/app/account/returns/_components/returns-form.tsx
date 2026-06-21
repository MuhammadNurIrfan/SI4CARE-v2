"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Package } from "lucide-react";
import type { CustomerOrderOption, ReturnRow, ReturnReason } from "@/actions/returns";
import { submitReturn } from "@/actions/returns";

const REASON_LABELS: Record<ReturnReason, string> = {
  rusak:        "Barang Rusak / Cacat",
  tidak_sesuai: "Barang Tidak Sesuai Deskripsi",
  kurang:       "Jumlah Barang Kurang",
  expired:      "Barang Mendekati / Lewat Expired",
  lainnya:      "Alasan Lain",
};

const STATUS_CFG = {
  pending:    { label: "Menunggu Review",   cls: "bg-amber-100 text-amber-800 border-amber-200" },
  inspeksi:   { label: "Sedang Diinspeksi", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  layak_jual: { label: "Disetujui — Layak Jual", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  write_off:  { label: "Write-off Diproses", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  ditolak:    { label: "Ditolak",           cls: "bg-red-100 text-red-800 border-red-200" },
};

export function ReturnsForm({
  orders,
  myReturns,
}: {
  orders: CustomerOrderOption[];
  myReturns: ReturnRow[];
}) {
  const [orderId, setOrderId]   = useState("");
  const [reason, setReason]     = useState<ReturnReason | "">("");
  const [detail, setDetail]     = useState("");
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTx]    = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId || !reason) return;
    setError(null);
    startTx(async () => {
      const result = await submitReturn({ orderId, reason: reason as ReturnReason, detail });
      if (result.ok) {
        setSuccess(true);
        setOrderId(""); setReason(""); setDetail("");
      } else {
        setError(result.error ?? "Gagal mengajukan retur");
      }
    });
  }

  if (success) {
    return (
      <Card className="max-w-lg">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <div>
            <h2 className="font-bold text-lg">Pengajuan Retur Diterima</h2>
            <p className="text-muted-foreground text-sm mt-1">Tim kami akan meninjau permintaan Anda dalam 1×24 jam. Pantau status di bawah ini.</p>
          </div>
          <Button variant="outline" onClick={() => setSuccess(false)}>Ajukan Retur Lain</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Form Retur</CardTitle>
          <CardDescription>Pilih pesanan dan jelaskan alasan retur secara detail.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Pilih Pesanan</Label>
              {orders.length === 0
                ? <p className="text-sm text-muted-foreground border rounded-lg px-4 py-3">Tidak ada pesanan yang memenuhi syarat retur (status: Terkirim).</p>
                : (
                  <Select value={orderId} onValueChange={(v) => { if (v) setOrderId(v); }} required>
                    <SelectTrigger><SelectValue placeholder="Pilih invoice yang sudah diterima..." /></SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.refNumber ?? o.id.slice(0, 8)} — {o.createdAt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }
            </div>

            <div className="space-y-2">
              <Label>Alasan Retur</Label>
              <Select value={reason} onValueChange={(v) => { if (v) setReason(v as ReturnReason); }} required>
                <SelectTrigger><SelectValue placeholder="Pilih alasan..." /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(REASON_LABELS) as ReturnReason[]).map((r) => (
                    <SelectItem key={r} value={r}>{REASON_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detail Kendala</Label>
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Ceritakan secara spesifik kendala yang Anda alami..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Bukti Foto / Video (Wajib)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">Klik untuk upload atau drag &amp; drop</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, atau MP4 (Maks. 10MB)</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto" disabled={!orderId || !reason || isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Mengirim...</> : "Ajukan Retur"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Riwayat retur */}
      {myReturns.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Package className="h-5 w-5" /> Riwayat Pengajuan Retur</h2>
          <div className="space-y-3">
            {myReturns.map((r) => {
              const sc = STATUS_CFG[r.status];
              return (
                <Card key={r.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium">{REASON_LABELS[r.reason]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Diajukan: {r.createdAt}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.cls}`}>{sc.label}</span>
                    </div>
                    {r.detail && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.detail}</p>}
                    {r.inspectionNotes && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-xs text-muted-foreground"><strong>Catatan admin:</strong> {r.inspectionNotes}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
