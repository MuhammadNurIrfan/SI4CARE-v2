"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAccountDetail, type AccountDetail } from "@/actions/accounts";
import { RoleBadge, dateFmt } from "./role-badge";

const PROVIDER_LABEL: Record<string, string> = { credential: "Email & password", google: "Google" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-all">{children}</dd>
    </div>
  );
}

export function AccountViewDialog({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let alive = true;
    getAccountDetail(accountId)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        setState(d ? "ready" : "missing");
      })
      .catch(() => alive && setState("error"));
    return () => { alive = false; };
  }, [accountId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detail akun</DialogTitle>
          <DialogDescription>Informasi akun dan aktivitasnya.</DialogDescription>
        </DialogHeader>

        {state === "loading" && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat…
          </div>
        )}
        {state === "missing" && <p className="py-6 text-center text-sm text-muted-foreground">Akun tidak ditemukan (mungkin sudah dihapus).</p>}
        {state === "error" && <p role="alert" className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">Gagal memuat detail akun.</p>}

        {state === "ready" && detail && (
          <dl className="divide-y">
            <Row label="Nama">{detail.name}</Row>
            <Row label="Email">{detail.email}</Row>
            <Row label="Telepon">{detail.phone ?? "—"}</Row>
            <Row label="Peran"><RoleBadge role={detail.role} /></Row>
            <Row label="Email terverifikasi">{detail.emailVerified ? "Ya" : "Belum"}</Row>
            <Row label="Metode login">{detail.providers.length ? detail.providers.map((p) => PROVIDER_LABEL[p] ?? p).join(", ") : "—"}</Row>
            <Row label="Dibuat">{dateFmt(detail.createdAt)}</Row>
            <Row label="Pesanan">{detail.orderCount}</Row>
            <Row label="Alamat tersimpan">{detail.addressCount}</Row>
            <Row label="Sesi aktif">{detail.activeSessions}</Row>
          </dl>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
