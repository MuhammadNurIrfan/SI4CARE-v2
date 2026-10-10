"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, TrendingUp, Wallet, AlertTriangle, Globe, Store, ShoppingCart, Boxes, Download, Package,
} from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";
import { PERIODS, PERIOD_LABEL } from "@/lib/dashboard-range";
import { rp, rpShort } from "./dashboard-format";
import { MdrCard } from "./mdr-card";
import { RecentTransactionsCard } from "./recent-transactions-card";
import type { DashboardData, ChannelKey } from "@/lib/dashboard-query";


const CHANNEL_ICON = { pos: ShoppingCart, web: Globe, marketplace: Store } as const;
function ChannelIcon({ k, className }: { k: ChannelKey; className?: string }) {
  const Icon = CHANNEL_ICON[k];
  return <Icon className={className} />;
}
const channelColor: Record<string, string> = { pos: "hsl(221,83%,53%)", web: "hsl(160,60%,45%)", marketplace: "hsl(38,92%,55%)" };

/** Unduh ringkasan kanal & platform sebagai CSV (dibuka langsung di Excel / Google Sheets). */
function downloadCsv(data: DashboardData) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Periode", `${data.range.from} s/d ${data.range.to}`],
    [],
    ["Kanal", "Transaksi", "Omzet", "HPP", "Laba Kotor", "MDR + Biaya", "Laba Bersih", "Belum Masuk"],
    ...data.channels.map((c) => [c.label, c.trx, Math.round(c.omzet), Math.round(c.hpp), Math.round(c.omzet - c.hpp), Math.round(c.mdr + c.biaya), Math.round(c.omzet - c.hpp - c.mdr - c.biaya), Math.round(c.pending)]),
    [],
    ["Platform", "Transaksi", "Omzet", "Komisi + MDR", "Dana Masuk", "Pending"],
    ...data.ecommerce.map((e) => [e.platform, e.trx, Math.round(e.omzet), Math.round(e.komisi + e.mdr), Math.round(e.danaMasuk), Math.round(e.pending)]),
  ];
  const csv = "\uFEFF" + lines.map((l) => l.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard-si4care-${data.range.from}_${data.range.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Periode ada di URL (?period=) karena dihitung server; kanal & pencarian cukup disaring di client.
  const period = data.period;
  const [channel, setChannel] = useState("semua");
  const [search, setSearch] = useState("");

  const changePeriod = (v: string | null) => {
    if (!v || v === period) return;
    startTransition(() => router.push(`/admin?period=${v}`));
  };

  const channels = useMemo(
    () => data.channels.filter((c) => channel === "semua" || c.key === channel),
    [data.channels, channel],
  );

  const omzet = channels.reduce((s, c) => s + c.omzet, 0);
  const hpp = channels.reduce((s, c) => s + c.hpp, 0);
  const mdrTot = channels.reduce((s, c) => s + c.mdr, 0);
  const biaya = channels.reduce((s, c) => s + c.biaya, 0);
  const pending = channels.reduce((s, c) => s + c.pending, 0);
  const labaKotor = omzet - hpp;
  const labaBersih = labaKotor - mdrTot - biaya;
  const trx = channels.reduce((s, c) => s + c.trx, 0);
  const marginPct = omzet > 0 ? (labaBersih / omzet) * 100 : 0;

  const channelPie = data.channels.map((c) => ({ name: c.label, value: c.omzet }));
  const trendBase = data.trend;
  const ecommerceBase = data.ecommerce;
  const mdrDetail = data.mdr;
  const lowStock = data.lowStock;

  const filteredTrx = data.recent.filter((t) => {
    const okCh = channel === "semua" || t.channel === (channel as ChannelKey);
    const okQ = !search || t.produk.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return okCh && okQ;
  });

  const kpis = [
    { label: "Omzet", value: rp(omzet), icon: DollarSign, sub: `${trx} transaksi`, tone: "" },
    { label: "Laba Kotor (setelah HPP)", value: rp(labaKotor), icon: TrendingUp, sub: `HPP ${rpShort(hpp)}`, tone: "text-emerald-700" },
    { label: "Laba Bersih (setelah biaya)", value: rp(labaBersih), icon: Wallet, sub: `Margin ${marginPct.toFixed(1)}% · MDR ${rpShort(mdrTot)}`, tone: "text-emerald-700" },
    { label: "Belum Masuk Rekening", value: rp(pending), icon: AlertTriangle, sub: "Dana marketplace tertahan (semua periode)", tone: "text-amber-700", warn: true },
  ];

  return (
    <div className={`p-4 md:p-6 space-y-6 transition-opacity ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      {/* Header + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Evaluasi menyeluruh — {PERIOD_LABEL[period]}{channel !== "semua" ? ` · ${data.channels.find((c) => c.key === channel)?.label}` : " · Semua Kanal"}.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label className="text-[11px] text-muted-foreground">Periode</Label>
            <Select value={period} onValueChange={changePeriod}>
              <SelectTrigger className="w-36"><SelectValue>{PERIOD_LABEL[period]}</SelectValue></SelectTrigger>
              <SelectContent>
                {PERIODS.map((k) => <SelectItem key={k} value={k}>{PERIOD_LABEL[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[11px] text-muted-foreground">Kanal</Label>
            <Select value={channel} onValueChange={(v) => { if (v) setChannel(v); }}>
              <SelectTrigger className="w-40"><SelectValue>{channel === "semua" ? "Semua Kanal" : data.channels.find((c) => c.key === channel)?.label}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kanal</SelectItem>
                <SelectItem value="pos">POS / Kasir</SelectItem>
                <SelectItem value="web">Web Olshop</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => downloadCsv(data)}><Download className="h-4 w-4" /> Ekspor</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className={k.warn ? "border-amber-300 bg-amber-50/40" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.warn ? "text-amber-600" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent className="pb-4">
              <div className={`text-2xl font-bold ${k.tone}`}>{k.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Omzet per Kanal (7 hari)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendBase} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  {Object.entries(channelColor).map(([k, c]) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="t" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={rpShort} tick={{ fontSize: 11 }} width={64} />
                <Tooltip formatter={(v) => rp(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {(channel === "semua" || channel === "pos") && <Area type="monotone" dataKey="pos" name="POS" stroke={channelColor.pos} strokeWidth={2} fill="url(#g-pos)" />}
                {(channel === "semua" || channel === "web") && <Area type="monotone" dataKey="web" name="Web" stroke={channelColor.web} strokeWidth={2} fill="url(#g-web)" />}
                {(channel === "semua" || channel === "marketplace") && <Area type="monotone" dataKey="marketplace" name="Marketplace" stroke={channelColor.marketplace} strokeWidth={2} fill="url(#g-marketplace)" />}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Kontribusi Kanal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={channelPie} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ value }) => rpShort(value as number)} labelLine={false}>
                  {channelPie.map((_, i) => <Cell key={i} fill={Object.values(channelColor)[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => rp(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Rincian Penjualan per Kanal</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kanal</TableHead>
                  <TableHead className="text-center">Transaksi</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">HPP</TableHead>
                  <TableHead className="text-right">Laba Kotor</TableHead>
                  <TableHead className="text-right">MDR + Biaya</TableHead>
                  <TableHead className="text-right">Laba Bersih</TableHead>
                  <TableHead className="text-right">Belum Masuk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((c) => {
                  const lk = (c.omzet - c.hpp);
                  const lb = (c.omzet - c.hpp - c.mdr - c.biaya);
                  return (
                    <TableRow key={c.key}>
                      <TableCell><span className="flex items-center gap-2 font-medium"><ChannelIcon k={c.key} className="h-4 w-4 text-muted-foreground" /> {c.label}</span></TableCell>
                      <TableCell className="text-center">{Math.round(c.trx)}</TableCell>
                      <TableCell className="text-right">{rp(c.omzet)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{rp(c.hpp)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-700">{rp(lk)}</TableCell>
                      <TableCell className="text-right text-amber-700">−{rp((c.mdr + c.biaya))}</TableCell>
                      <TableCell className="text-right font-semibold">{rp(lb)}</TableCell>
                      <TableCell className="text-right">{c.pending > 0 ? <span className="text-amber-700">{rp(c.pending)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DesktopOnly>

          <MobileList className="p-3">
            {channels.map((c) => {
              const lk = (c.omzet - c.hpp);
              const lb = (c.omzet - c.hpp - c.mdr - c.biaya);
              return (
                <RecordCard key={c.key}>
                  <p className="mb-2 flex items-center gap-2 font-semibold"><ChannelIcon k={c.key} className="h-4 w-4 text-muted-foreground" /> {c.label}</p>
                  <Field label="Transaksi" value={Math.round(c.trx)} />
                  <Field label="Omzet" value={rp(c.omzet)} />
                  <Field label="HPP" value={<span className="text-muted-foreground">{rp(c.hpp)}</span>} />
                  <Field label="Laba kotor" value={<span className="text-emerald-700">{rp(lk)}</span>} />
                  <Field label="MDR + biaya" value={<span className="text-amber-700">−{rp((c.mdr + c.biaya))}</span>} />
                  <Field label="Laba bersih" value={<span className="font-semibold">{rp(lb)}</span>} />
                  <Field label="Belum masuk" value={c.pending > 0 ? <span className="text-amber-700">{rp(c.pending)}</span> : "—"} />
                </RecordCard>
              );
            })}
          </MobileList>
        </CardContent>
      </Card>

      {/* Per-ecommerce + Stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4 text-primary" /> Penjualan per E-commerce</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DesktopOnly className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-center">Trx</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Komisi+MDR</TableHead>
                    <TableHead className="text-right">Dana Masuk</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecommerceBase.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada transaksi marketplace pada periode ini</TableCell></TableRow>
                  )}
                  {ecommerceBase.map((e) => (
                    <TableRow key={e.platform}>
                      <TableCell><Badge variant="outline">{e.platform}</Badge></TableCell>
                      <TableCell className="text-center">{Math.round(e.trx)}</TableCell>
                      <TableCell className="text-right">{rp(e.omzet)}</TableCell>
                      <TableCell className="text-right text-amber-700">−{rp((e.komisi + e.mdr))}</TableCell>
                      <TableCell className="text-right text-emerald-700">{rp(e.danaMasuk)}</TableCell>
                      <TableCell className="text-right text-amber-700">{rp(e.pending)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopOnly>

            <MobileList className="p-3">
              {ecommerceBase.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi marketplace pada periode ini</p>}
              {ecommerceBase.map((e) => (
                <RecordCard key={e.platform}>
                  <p className="mb-2 font-semibold">{e.platform}</p>
                  <Field label="Transaksi" value={Math.round(e.trx)} />
                  <Field label="Omzet" value={rp(e.omzet)} />
                  <Field label="Komisi + MDR" value={<span className="text-amber-700">−{rp((e.komisi + e.mdr))}</span>} />
                  <Field label="Dana masuk" value={<span className="text-emerald-700">{rp(e.danaMasuk)}</span>} />
                  <Field label="Pending" value={<span className="text-amber-700">{rp(e.pending)}</span>} />
                </RecordCard>
              ))}
            </MobileList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Boxes className="h-4 w-4 text-primary" /> Ringkasan Stok</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Total Produk", v: String(data.stock.totalProduk), c: "" },
                { l: "Stok Rendah", v: String(data.stock.stokRendah), c: data.stock.stokRendah > 0 ? "text-amber-600" : "" },
                { l: "Stok Habis", v: String(data.stock.stokHabis), c: data.stock.stokHabis > 0 ? "text-destructive" : "" },
                { l: "Mendekati ED", v: String(data.stock.mendekatiEd), c: data.stock.mendekatiEd > 0 ? "text-amber-600" : "" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border bg-muted/30 p-3 text-center">
                  <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                  <p className="text-[11px] text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-3">
              <span className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4 text-primary" /> Nilai Persediaan (HPP)</span>
              <span className="font-bold text-primary">{rp(data.stock.nilaiPersediaan)}</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Perlu perhatian:</p>
              {lowStock.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-3 text-center text-sm text-muted-foreground">Semua stok di atas batas minimum.</p>
              )}
              {lowStock.map((s) => (
                <div key={s.sku} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{s.nama}</span>
                  <span className={`shrink-0 font-medium ${s.stok === 0 ? "text-destructive" : "text-amber-600"}`}>{s.stok}/{s.min}{s.ed !== "-" ? ` · ED ${s.ed}` : ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <MdrCard mdrDetail={mdrDetail} />

      <RecentTransactionsCard rows={filteredTrx} search={search} onSearch={setSearch} />
    </div>
  );
}
