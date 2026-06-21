"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Clock, Package, CheckCircle2, Search, Bell, BellOff, TrendingDown, CreditCard } from "lucide-react";
import type { AlarmItem, AlarmType } from "@/actions/alarms";

type AlarmStatus = "aktif" | "selesai";

const typeConfig: Record<AlarmType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  stok_rendah:  { label: "Stok Rendah",     icon: AlertTriangle, color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200" },
  stok_habis:   { label: "Stok Habis",       icon: Package,       color: "text-red-700",     bg: "bg-red-50 border-red-200" },
  exp_dekat:    { label: "Mendekati ED",     icon: Clock,         color: "text-orange-700",  bg: "bg-orange-50 border-orange-200" },
  exp_lewat:    { label: "Sudah Kadaluarsa", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  margin_tipis: { label: "Margin Tipis",     icon: TrendingDown,  color: "text-amber-700",   bg: "bg-amber-50 border-amber-300" },
  margin_minus: { label: "Margin MINUS",     icon: CreditCard,    color: "text-destructive", bg: "bg-destructive/15 border-destructive/50" },
};

export function AlarmsClient({ alarms: initial }: { alarms: AlarmItem[] }) {
  // Track dismissed IDs client-side (ephemeral — resets on refresh)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter]  = useState<"semua" | "aktif" | "selesai">("semua");

  const withStatus = initial.map((a) => ({
    ...a,
    status: dismissed.has(a.id) ? ("selesai" as AlarmStatus) : ("aktif" as AlarmStatus),
  }));

  const filtered = withStatus.filter((a) => {
    const okS = filterStatus === "semua" || a.status === filterStatus;
    const okQ = !search || a.produk.toLowerCase().includes(search.toLowerCase()) || a.sku.toLowerCase().includes(search.toLowerCase());
    return okS && okQ;
  });

  const aktifCount  = withStatus.filter((a) => a.status === "aktif").length;
  const selesaiCount = withStatus.filter((a) => a.status === "selesai").length;
  const marginMinus = withStatus.filter((a) => a.type === "margin_minus" && a.status === "aktif").length;
  const marginTipis = withStatus.filter((a) => a.type === "margin_tipis" && a.status === "aktif").length;

  function dismiss(id: string) {
    setDismissed((s) => new Set(s).add(id));
  }
  function restore(id: string) {
    setDismissed((s) => { const n = new Set(s); n.delete(id); return n; });
  }
  function dismissAll() {
    setDismissed(new Set(withStatus.filter((a) => a.status === "aktif").map((a) => a.id)));
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pusat Alarm</h1>
          <p className="text-muted-foreground">Peringatan langsung dari DB — stok, kadaluarsa, margin</p>
        </div>
        {aktifCount > 0 && (
          <Button variant="outline" onClick={dismissAll}>
            <BellOff className="h-4 w-4 mr-2" /> Tandai Semua Selesai
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Alarm Aktif",  count: aktifCount,   color: "text-destructive", bg: "border-destructive/20 bg-destructive/5" },
          { label: "Margin Minus", count: marginMinus,  color: "text-destructive", bg: "border-destructive/30 bg-destructive/8" },
          { label: "Margin Tipis", count: marginTipis,  color: "text-amber-700",   bg: "border-amber-300 bg-amber-50/60" },
          { label: "Dari DB",      count: initial.length, color: "text-primary",   bg: "" },
          { label: "Selesai",      count: selesaiCount, color: "text-emerald-600", bg: "" },
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
          {(["semua", "aktif", "selesai"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
            >
              {s === "semua" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
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
              <p>{initial.length === 0 ? "Tidak ada alarm — semua dalam kondisi baik!" : "Tidak ada alarm ditemukan"}</p>
            </CardContent>
          </Card>
        )}
        {filtered.map((alarm) => {
          const cfg  = typeConfig[alarm.type];
          const Icon = cfg.icon;
          const done = alarm.status === "selesai";
          return (
            <div key={alarm.id} className={`flex items-start gap-4 p-4 rounded-xl border ${done ? "opacity-60 bg-muted/20" : cfg.bg}`}>
              <div className={`p-2 rounded-lg shrink-0 ${done ? "bg-muted" : "bg-white/80"}`}>
                <Icon className={`h-5 w-5 ${done ? "text-muted-foreground" : cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className={`text-xs font-semibold ${cfg.color} uppercase tracking-wide`}>{cfg.label}</span>
                    <p className="font-semibold text-sm mt-0.5">{alarm.produk}</p>
                    <p className="text-xs text-muted-foreground font-mono">{alarm.sku}</p>
                  </div>
                  <Badge variant={done ? "outline" : "default"}>{done ? "Selesai" : "Aktif"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{alarm.detail}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{alarm.tanggal}</span>
                  {done
                    ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => restore(alarm.id)}>Aktifkan Lagi</Button>
                    : <Button size="sm" className="h-7 text-xs gap-1" onClick={() => dismiss(alarm.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                      </Button>
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
