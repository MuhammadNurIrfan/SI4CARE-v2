"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, Truck } from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";

type StatusPesanan = "pending" | "diproses" | "dikirim" | "selesai" | "dibatalkan";

type Pesanan = {
  id: string;
  noPesanan: string;
  pelanggan: string;
  tanggal: string;
  items: string;
  total: number;
  status: StatusPesanan;
  channel: "web" | "marketplace";
};

const initialOrders: Pesanan[] = [
  { id: "1", noPesanan: "ORD-0098", pelanggan: "Budi Santoso", tanggal: "2026-06-06", items: "Tensimeter OMRON x1", total: 450000, status: "pending", channel: "web" },
  { id: "2", noPesanan: "ORD-0097", pelanggan: "Siti Rahayu", tanggal: "2026-06-06", items: "Masker 3-ply x2, Betadine x1", total: 112000, status: "diproses", channel: "web" },
  { id: "3", noPesanan: "ORD-0096", pelanggan: "Hendra Wijaya", tanggal: "2026-06-05", items: "Kursi Roda Lipat x1", total: 1250000, status: "dikirim", channel: "marketplace" },
  { id: "4", noPesanan: "ORD-0095", pelanggan: "Rina Marlina", tanggal: "2026-06-05", items: "Pulse Oximeter x1", total: 175000, status: "selesai", channel: "web" },
  { id: "5", noPesanan: "ORD-0094", pelanggan: "Ahmad Fauzi", tanggal: "2026-06-04", items: "Nebulizer Omron x1", total: 620000, status: "selesai", channel: "marketplace" },
  { id: "6", noPesanan: "ORD-0093", pelanggan: "Dewi Kurniawan", tanggal: "2026-06-04", items: "Handscoon Latex M x3", total: 195000, status: "dibatalkan", channel: "web" },
  { id: "7", noPesanan: "ORD-0092", pelanggan: "Rudi Hermanto", tanggal: "2026-06-03", items: "Termometer Infrared x2", total: 370000, status: "selesai", channel: "web" },
  { id: "8", noPesanan: "ORD-0091", pelanggan: "Yuni Astuti", tanggal: "2026-06-03", items: "Tensimeter OMRON x1, Oximeter x1", total: 625000, status: "selesai", channel: "marketplace" },
];

const statusConfig: Record<StatusPesanan, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  diproses: { label: "Diproses", color: "bg-blue-100 text-blue-800 border-blue-200" },
  dikirim: { label: "Dikirim", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  selesai: { label: "Selesai", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  dibatalkan: { label: "Dibatalkan", color: "bg-red-100 text-red-800 border-red-200" },
};

function StatusBadge({ status }: { status: StatusPesanan }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Pesanan[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [selected, setSelected] = useState<Pesanan | null>(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.noPesanan.toLowerCase().includes(search.toLowerCase()) ||
      o.pelanggan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function updateStatus(id: string, status: StatusPesanan) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null);
  }

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    diproses: orders.filter((o) => o.status === "diproses").length,
    dikirim: orders.filter((o) => o.status === "dikirim").length,
    selesai: orders.filter((o) => o.status === "selesai").length,
    dibatalkan: orders.filter((o) => o.status === "dibatalkan").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Pesanan Web</h1>
        <p className="text-muted-foreground">Kelola pesanan dari toko online (web). Transaksi marketplace ada di menu Marketplace.</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {([["semua", "Semua", orders.length], ["pending", "Pending", counts.pending], ["diproses", "Diproses", counts.diproses], ["dikirim", "Dikirim", counts.dikirim], ["selesai", "Selesai", counts.selesai], ["dibatalkan", "Dibatalkan", counts.dibatalkan]] as [string, string, number][]).map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterStatus === val
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {label} <span className="ml-1 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari no. pesanan atau nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table (desktop) */}
      <Card>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Tidak ada pesanan ditemukan
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm font-medium">{o.noPesanan}</TableCell>
                  <TableCell>{o.pelanggan}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{o.tanggal}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{o.items}</TableCell>
                  <TableCell className="text-right font-medium">
                    Rp {o.total.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {o.channel === "web" ? "Web" : "Marketplace"}
                    </Badge>
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
              ))}
            </TableBody>
          </Table>
          </DesktopOnly>

          {/* Cards (mobile) */}
          <MobileList className="p-3">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada pesanan ditemukan</p>}
            {filtered.map((o) => (
              <RecordCard key={o.id}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{o.noPesanan}</p>
                    <p className="text-sm text-muted-foreground">{o.pelanggan}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <Field label="Tanggal" value={o.tanggal} />
                <Field label="Item" value={<span className="line-clamp-1 text-right">{o.items}</span>} />
                <Field label="Total" value={`Rp ${o.total.toLocaleString("id-ID")}`} />
                <Field label="Channel" value={<Badge variant="outline" className="text-xs">{o.channel === "web" ? "Web" : "Marketplace"}</Badge>} />
                <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 border-t" onClick={() => setSelected(o)}>
                  <Eye className="h-3.5 w-3.5" /> Lihat Detail
                </Button>
              </RecordCard>
            ))}
          </MobileList>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pesanan — {selected?.noPesanan}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{selected.pelanggan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{selected.tanggal}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Channel</p>
                  <p className="font-medium capitalize">{selected.channel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <div className="border rounded-lg p-3 text-sm space-y-2 bg-muted/30">
                <p className="font-medium">Item Pesanan</p>
                <p className="text-muted-foreground">{selected.items}</p>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rp {selected.total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {selected.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(selected.id, "diproses")}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Proses Pesanan
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(selected.id, "dibatalkan")}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Batalkan
                    </Button>
                  </>
                )}
                {selected.status === "diproses" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(selected.id, "dikirim")}
                  >
                    <Truck className="h-3.5 w-3.5 mr-1.5" />
                    Tandai Dikirim
                  </Button>
                )}
                {selected.status === "dikirim" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(selected.id, "selesai")}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Tandai Selesai
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
