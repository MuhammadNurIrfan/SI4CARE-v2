"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Clock, Package, CheckCircle2, Search, Bell, BellOff, TrendingDown, CreditCard } from "lucide-react";

type AlarmType = "stok_rendah" | "stok_habis" | "exp_dekat" | "exp_lewat" | "margin_tipis" | "margin_minus";
type AlarmStatus = "aktif" | "dibaca" | "selesai";

type Alarm = {
  id: string;
  type: AlarmType;
  produk: string;
  sku: string;
  detail: string;
  tanggal: string;
  status: AlarmStatus;
};

const initialAlarms: Alarm[] = [
  { id: "1",  type: "stok_rendah",  produk: "Nebulizer Omron NE-C28",          sku: "OMR-NEB-001", detail: "Stok tersisa 3 unit, di bawah batas minimum (5 unit)", tanggal: "2026-06-06 14:30", status: "aktif" },
  { id: "2",  type: "margin_minus", produk: "Sarung Tangan Vinyl S (100 pcs)",  sku: "GLV-VNL-S",   detail: "Margin bersih −1.8% setelah MDR 2.5% (Shopee). HPP: Rp 42.000 — Jual: Rp 44.000. Transaksi ini menghasilkan kerugian Rp 760 per unit.", tanggal: "2026-06-06 13:15", status: "aktif" },
  { id: "3",  type: "exp_dekat",    produk: "Masker Bedah 3-ply (50 pcs)",      sku: "MSK-BDH-050", detail: "Batch #B2024-045 kadaluarsa dalam 25 hari (31 Des 2026)", tanggal: "2026-06-06 10:00", status: "aktif" },
  { id: "4",  type: "stok_habis",   produk: "Termometer Infrared Digital",       sku: "TRM-INF-001", detail: "Stok habis. Segera lakukan pemesanan ulang.", tanggal: "2026-06-05 16:45", status: "aktif" },
  { id: "5",  type: "margin_tipis", produk: "Masker Bedah 3-ply (50 pcs)",      sku: "MSK-BDH-050", detail: "Margin bersih hanya 8.4% setelah komisi platform Tokopedia 1.8% + MDR 0.7%. Threshold minimum: 10%. Pertimbangkan menaikkan harga jual ke Rp 28.000.", tanggal: "2026-06-05 12:00", status: "aktif" },
  { id: "6",  type: "exp_dekat",    produk: "Handscoon Latex M (100 pcs)",       sku: "HND-LTX-M",   detail: "Batch #B2023-112 kadaluarsa dalam 24 hari (30 Jun 2026)", tanggal: "2026-06-05 09:15", status: "aktif" },
  { id: "7",  type: "margin_tipis", produk: "Kasa Steril 16x16 (Box isi 10)",   sku: "BHP-KAS-001", detail: "Margin bersih 5.2% setelah biaya Shopee. Produk ini dijual Rp 12.000 dengan HPP Rp 8.000, namun komisi+MDR menyerap sebagian besar selisih.", tanggal: "2026-06-04 15:30", status: "dibaca" },
  { id: "8",  type: "stok_rendah",  produk: "Pulse Oximeter Fingertip",          sku: "OXI-FNG-001", detail: "Stok tersisa 4 unit, di bawah batas minimum (10 unit)", tanggal: "2026-06-04 11:20", status: "dibaca" },
  { id: "9",  type: "exp_lewat",    produk: "Gloves Vinyl M (100 pcs)",          sku: "GLV-VNL-M",   detail: "Batch #B2022-078 sudah kadaluarsa sejak 15 Mei 2026. Segera pisahkan dari stok aktif!", tanggal: "2026-06-01 08:00", status: "dibaca" },
  { id: "10", type: "stok_rendah",  produk: "Betadine Antiseptik 300ml",         sku: "BTD-ANT-300", detail: "Stok tersisa 8 unit, di bawah batas minimum (15 unit)", tanggal: "2026-05-30 14:00", status: "selesai" },
  { id: "11", type: "stok_habis",   produk: "Alkohol 70% 500ml",                 sku: "ALK-70P-500", detail: "Stok habis. Pemesanan ulang sudah dilakukan.", tanggal: "2026-05-28 09:30", status: "selesai" },
];

const typeConfig: Record<AlarmType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  stok_rendah:  { label: "Stok Rendah",      icon: AlertTriangle,  color: "text-yellow-700",    bg: "bg-yellow-50 border-yellow-200" },
  stok_habis:   { label: "Stok Habis",        icon: Package,        color: "text-red-700",        bg: "bg-red-50 border-red-200" },
  exp_dekat:    { label: "Mendekati ED",      icon: Clock,          color: "text-orange-700",     bg: "bg-orange-50 border-orange-200" },
  exp_lewat:    { label: "Sudah Kadaluarsa",  icon: AlertTriangle,  color: "text-destructive",    bg: "bg-destructive/10 border-destructive/30" },
  margin_tipis: { label: "Margin Tipis",      icon: TrendingDown,   color: "text-amber-700",      bg: "bg-amber-50 border-amber-300" },
  margin_minus: { label: "Margin MINUS",      icon: CreditCard,     color: "text-destructive",    bg: "bg-destructive/15 border-destructive/50" },
};

const statusConfig: Record<AlarmStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  aktif: { label: "Aktif", variant: "default" },
  dibaca: { label: "Dibaca", variant: "secondary" },
  selesai: { label: "Selesai", variant: "outline" },
};

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>(initialAlarms);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  const filtered = alarms.filter((a) => {
    const matchSearch = a.produk.toLowerCase().includes(search.toLowerCase()) || a.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const markAs = (id: string, status: AlarmStatus) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const markAllRead = () => {
    setAlarms((prev) => prev.map((a) => (a.status === "aktif" ? { ...a, status: "dibaca" } : a)));
  };

  const counts = {
    aktif: alarms.filter((a) => a.status === "aktif").length,
    dibaca: alarms.filter((a) => a.status === "dibaca").length,
    selesai: alarms.filter((a) => a.status === "selesai").length,
    margin_minus: alarms.filter((a) => a.type === "margin_minus" && a.status === "aktif").length,
    margin_tipis: alarms.filter((a) => a.type === "margin_tipis" && a.status === "aktif").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pusat Alarm</h1>
          <p className="text-muted-foreground">Pantau peringatan stok, kadaluarsa, dan margin produk</p>
        </div>
        {counts.aktif > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <BellOff className="h-4 w-4 mr-2" /> Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Alarm Aktif",     count: counts.aktif,         color: "text-destructive",  bg: "border-destructive/20 bg-destructive/5" },
          { label: "Margin Minus",    count: counts.margin_minus,   color: "text-destructive",  bg: "border-destructive/30 bg-destructive/8" },
          { label: "Margin Tipis",    count: counts.margin_tipis,   color: "text-amber-700",    bg: "border-amber-300 bg-amber-50/60" },
          { label: "Dibaca",          count: counts.dibaca,         color: "text-yellow-600",   bg: "border-yellow-200 bg-yellow-50/50" },
          { label: "Selesai",         count: counts.selesai,        color: "text-emerald-600",  bg: "" },
        ].map((s) => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk atau SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["semua", "aktif", "dibaca", "selesai"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
            >
              {s === "semua" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "semua" && <span className="ml-1.5 opacity-70">({counts[s as AlarmStatus] ?? 0})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Alarm List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada alarm ditemukan</p>
            </CardContent>
          </Card>
        )}
        {filtered.map((alarm) => {
          const cfg = typeConfig[alarm.type];
          const Icon = cfg.icon;
          return (
            <div key={alarm.id} className={`flex items-start gap-4 p-4 rounded-xl border ${alarm.status === "selesai" ? "opacity-60 bg-muted/20" : cfg.bg}`}>
              <div className={`p-2 rounded-lg shrink-0 ${alarm.status === "selesai" ? "bg-muted" : "bg-white/80"}`}>
                <Icon className={`h-5 w-5 ${alarm.status === "selesai" ? "text-muted-foreground" : cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className={`text-xs font-semibold ${cfg.color} uppercase tracking-wide`}>{cfg.label}</span>
                    <p className="font-semibold text-sm mt-0.5">{alarm.produk}</p>
                    <p className="text-xs text-muted-foreground font-mono">{alarm.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusConfig[alarm.status].variant}>{statusConfig[alarm.status].label}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{alarm.detail}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{alarm.tanggal}</span>
                  <div className="flex gap-2">
                    {alarm.status === "aktif" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAs(alarm.id, "dibaca")}>
                        Tandai Dibaca
                      </Button>
                    )}
                    {alarm.status !== "selesai" && (
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => markAs(alarm.id, "selesai")}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
