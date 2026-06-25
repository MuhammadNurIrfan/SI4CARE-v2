"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateOrderStatus } from "@/actions/orders";
import type { AdminOrderRow } from "@/actions/orders";
import { checkMidtransStatus, type MidtransStatusResult } from "@/actions/payment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, CheckCircle, XCircle, Truck, RefreshCw } from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";

// ─── Tipe & konstanta ─────────────────────────────────────────────────────────

type DbStatus = AdminOrderRow["status"];

const STATUS_CONFIG: Record<DbStatus, { label: string; color: string }> = {
  pending_payment: { label: "Menunggu Bayar", color: "bg-amber-100 text-amber-800 border-amber-200"  },
  paid:            { label: "Dibayar",         color: "bg-blue-100 text-blue-800 border-blue-200"    },
  processing:      { label: "Diproses",        color: "bg-blue-100 text-blue-800 border-blue-200"    },
  shipped:         { label: "Dikirim",         color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delivered:       { label: "Selesai",         color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled:       { label: "Dibatalkan",      color: "bg-red-100 text-red-800 border-red-200"       },
};

// Status yang bisa ditransisikan dari status sumber
const NEXT_STATUSES: Partial<Record<DbStatus, DbStatus[]>> = {
  pending_payment: ["processing", "cancelled"],
  paid:            ["processing", "cancelled"],
  processing:      ["shipped",    "cancelled"],
  shipped:         ["delivered"],
};

const STATUS_FILTERS: { value: "semua" | DbStatus; label: string }[] = [
  { value: "semua",           label: "Semua"          },
  { value: "pending_payment", label: "Menunggu Bayar" },
  { value: "paid",            label: "Dibayar"        },
  { value: "processing",      label: "Diproses"       },
  { value: "shipped",         label: "Dikirim"        },
  { value: "delivered",       label: "Selesai"        },
  { value: "cancelled",       label: "Dibatalkan"     },
];

const fmtRp  = (v: string | number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(Number(v));
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DbStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function DetailDialog({
  order,
  onClose,
  onStatusChange,
  isPending,
}: {
  order: AdminOrderRow;
  onClose: () => void;
  onStatusChange: (id: string, status: DbStatus) => void;
  isPending: boolean;
}) {
  const nexts = NEXT_STATUSES[order.status] ?? [];
  const [checking, setChecking] = useState(false);
  const [midtransResult, setMidtransResult] = useState<MidtransStatusResult | null>(null);

  async function handleCheckMidtrans() {
    setChecking(true);
    setMidtransResult(null);
    try {
      setMidtransResult(await checkMidtransStatus(order.id));
    } finally {
      setChecking(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detail Pesanan — {order.midtransOrderId ?? order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Status + tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tanggal</p>
              <p className="font-medium">{fmtDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Pelanggan</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Metode Bayar</p>
              <p className="font-medium capitalize">{order.paymentMethod ?? "—"}</p>
            </div>
          </div>

          {/* Alamat */}
          <div className="border rounded-lg p-3 bg-muted/30 space-y-0.5">
            <p className="font-medium mb-1">Alamat Pengiriman</p>
            <p>{order.snapAddress?.name} · {order.snapAddress?.phone}</p>
            <p className="text-muted-foreground">{order.snapAddress?.address}</p>
            <p className="text-muted-foreground">{order.snapAddress?.city}</p>
            {(order.courier || order.courierService) && (
              <p className="text-muted-foreground text-xs pt-1">
                Kurir: {[order.courier?.toUpperCase(), order.courierService].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Ringkasan harga */}
          <div className="border rounded-lg p-3 space-y-1.5">
            <p className="font-medium mb-2">Ringkasan Harga</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({order.itemCount} produk)</span>
              <span>{fmtRp(order.subtotal)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon</span>
                <span>-{fmtRp(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Ongkir</span>
              <span>{fmtRp(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>PPN 12%</span>
              <span>{fmtRp(order.ppn)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Layanan</span>
              <span>{fmtRp(order.serviceFee)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-1">
              <span>Total</span>
              <span>{fmtRp(order.totalAmount)}</span>
            </div>
          </div>

          {/* Verifikasi pembayaran ke Midtrans (read-only) */}
          {order.midtransOrderId && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">Verifikasi Pembayaran</p>
                <Button size="sm" variant="outline" disabled={checking} onClick={handleCheckMidtrans}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${checking ? "animate-spin" : ""}`} />
                  {checking ? "Mengecek…" : "Cek Status Midtrans"}
                </Button>
              </div>

              {midtransResult && midtransResult.ok && (
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Midtrans</span>
                    <span className="font-semibold capitalize">{midtransResult.transactionStatus}</span>
                  </div>
                  {midtransResult.paymentType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metode</span>
                      <span className="font-medium capitalize">{midtransResult.paymentType.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {midtransResult.grossAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nominal</span>
                      <span className="font-medium">{fmtRp(midtransResult.grossAmount)}</span>
                    </div>
                  )}
                  {midtransResult.mismatch ? (
                    <p className="mt-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1.5">
                      ⚠️ Midtrans menyatakan dana <strong>sudah masuk</strong>, tetapi pesanan masih
                      &ldquo;Menunggu Bayar&rdquo;. Webhook kemungkinan terlewat — silakan proses
                      pesanan secara manual di bawah.
                    </p>
                  ) : midtransResult.settled ? (
                    <p className="mt-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1.5">
                      ✓ Pembayaran terverifikasi settle di Midtrans, konsisten dengan status pesanan.
                    </p>
                  ) : (
                    <p className="mt-1.5 rounded bg-muted px-2 py-1.5 text-muted-foreground">
                      Dana belum settle di Midtrans (pelanggan kemungkinan belum menyelesaikan pembayaran).
                    </p>
                  )}
                </div>
              )}

              {midtransResult && !midtransResult.ok && (
                <p className="text-xs rounded bg-red-50 border border-red-200 text-red-700 px-2 py-1.5">
                  {midtransResult.error}
                </p>
              )}
            </div>
          )}

          {/* Aksi transisi status */}
          {nexts.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {nexts.includes("processing") && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => onStatusChange(order.id, "processing")}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Proses Pesanan
                </Button>
              )}
              {nexts.includes("shipped") && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => onStatusChange(order.id, "shipped")}
                >
                  <Truck className="h-3.5 w-3.5 mr-1.5" /> Tandai Dikirim
                </Button>
              )}
              {nexts.includes("delivered") && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => onStatusChange(order.id, "delivered")}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Tandai Selesai
                </Button>
              )}
              {nexts.includes("cancelled") && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => onStatusChange(order.id, "cancelled")}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" /> Batalkan
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Komponen utama ────────────────────────────────────────────────────────────

export function AdminOrdersClient({ initialOrders }: { initialOrders: AdminOrderRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminOrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | DbStatus>("semua");
  const [selected, setSelected] = useState<AdminOrderRow | null>(null);
  const [isPending, startTx] = useTransition();

  // Sinkronkan tabel dengan data server terbaru setiap kali router.refresh()
  // mengganti prop initialOrders (useState hanya memakai nilai awal sekali).
  useEffect(() => {
    setRows(initialOrders);
  }, [initialOrders]);

  // Auto-update status: selama masih ada pesanan "Menunggu Bayar", poll server
  // tiap 15 dtk agar status berubah otomatis begitu webhook Midtrans masuk —
  // admin tidak perlu refresh manual.
  const hasPendingPayment = rows.some((o) => o.status === "pending_payment");
  useEffect(() => {
    if (!hasPendingPayment) return;
    const t = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(t);
  }, [hasPendingPayment, router]);

  const filtered = useMemo(() => {
    return rows.filter((o) => {
      const matchStatus = filterStatus === "semua" || o.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (o.midtransOrderId ?? "").toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [rows, filterStatus, search]);

  const counts = useMemo(() => {
    const c: Partial<Record<DbStatus, number>> = {};
    for (const o of rows) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [rows]);

  function handleStatusChange(id: string, status: DbStatus) {
    // Optimistic update
    setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelected((s) => (s?.id === id ? { ...s, status } : s));

    startTx(async () => {
      const result = await adminUpdateOrderStatus(id, status);
      if (!result.ok) {
        // Revert on error
        setRows(initialOrders);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => {
          const count = value === "semua" ? rows.length : (counts[value as DbStatus] ?? 0);
          return (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filterStatus === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari no. pesanan, nama, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          title="Refresh"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabel desktop */}
      <Card>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Tidak ada pesanan ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {o.midtransOrderId ?? o.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium leading-tight">{o.customerName}</p>
                        <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {fmtDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                        {o.firstItemName}
                        {o.itemCount > 1 && (
                          <span className="ml-1 text-xs opacity-60">+{o.itemCount - 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {fmtRp(o.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelected(o)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DesktopOnly>

          {/* Card mobile */}
          <MobileList className="p-3">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada pesanan ditemukan</p>
            )}
            {filtered.map((o) => (
              <RecordCard key={o.id}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">
                      {o.midtransOrderId ?? o.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{o.customerName}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <Field label="Tanggal" value={fmtDate(o.createdAt)} />
                <Field
                  label="Produk"
                  value={
                    <span className="line-clamp-1 text-right">
                      {o.firstItemName}
                      {o.itemCount > 1 && <span className="ml-1 opacity-60">+{o.itemCount - 1}</span>}
                    </span>
                  }
                />
                <Field label="Total" value={fmtRp(o.totalAmount)} />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1.5"
                  onClick={() => setSelected(o)}
                >
                  <Eye className="h-3.5 w-3.5" /> Lihat Detail
                </Button>
              </RecordCard>
            ))}
          </MobileList>
        </CardContent>
      </Card>

      {/* Dialog detail */}
      {selected && (
        <DetailDialog
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          isPending={isPending}
        />
      )}

      {/* Bulk status update via Select (tampil di atas tabel saat ada filter aktif) */}
      {filterStatus !== "semua" && filtered.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{filtered.length} pesanan ditampilkan</Badge>
        </div>
      )}
    </div>
  );
}
