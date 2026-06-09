"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Download, TrendingUp, ShoppingCart, Package, DollarSign, FileText, AlertTriangle, CreditCard, ChevronRight, BookOpen, Wallet, Search } from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";

const omzetData = [
  { bulan: "Jan", omzet: 18500000, target: 20000000 },
  { bulan: "Feb", omzet: 22300000, target: 20000000 },
  { bulan: "Mar", omzet: 19800000, target: 22000000 },
  { bulan: "Apr", omzet: 25600000, target: 22000000 },
  { bulan: "Mei", omzet: 28100000, target: 25000000 },
  { bulan: "Jun", omzet: 21400000, target: 25000000 },
];

const topProducts = [
  { nama: "Tensimeter Digital OMRON HEM-7130", terjual: 48, omzet: 21600000 },
  { nama: "Nebulizer Omron NE-C28", terjual: 31, omzet: 19220000 },
  { nama: "Masker Bedah 3-ply (50 pcs)", terjual: 210, omzet: 7350000 },
  { nama: "Pulse Oximeter Fingertip", terjual: 65, omzet: 11375000 },
  { nama: "Kursi Roda Lipat Standar", terjual: 12, omzet: 15000000 },
];

const channelData = [
  { name: "POS / Kasir", value: 55 },
  { name: "Web", value: 30 },
  { name: "Marketplace", value: 15 },
];
const COLORS = ["hsl(221, 83%, 53%)", "hsl(160, 60%, 45%)", "hsl(38, 92%, 55%)"];

const transactionData = [
  { hari: "Sen", jumlah: 28 }, { hari: "Sel", jumlah: 35 }, { hari: "Rab", jumlah: 22 },
  { hari: "Kam", jumlah: 41 }, { hari: "Jum", jumlah: 38 }, { hari: "Sab", jumlah: 51 }, { hari: "Min", jumlah: 29 },
];

const formatRp = (n: number) => {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`;
  return `Rp ${n}`;
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("bulan_ini");
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo] = useState("2026-06-30");
  const [channel, setChannel] = useState("semua");

  const totalOmzet = omzetData.reduce((s, d) => s + d.omzet, 0);
  const totalTransaksi = 244;
  const avgTransaksi = Math.round(totalOmzet / totalTransaksi);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Ringkasan performa penjualan dan bisnis</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Ekspor CSV
        </Button>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Periode</Label>
              <Select value={period} onValueChange={(v) => { if (v) setPeriod(v); }}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari_ini">Hari Ini</SelectItem>
                  <SelectItem value="minggu_ini">Minggu Ini</SelectItem>
                  <SelectItem value="bulan_ini">Bulan Ini</SelectItem>
                  <SelectItem value="kuartal">Kuartal Ini</SelectItem>
                  <SelectItem value="tahun">Tahun Ini</SelectItem>
                  <SelectItem value="kustom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "kustom" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dari</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sampai</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Kanal</Label>
              <Select value={channel} onValueChange={(v) => { if (v) setChannel(v); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kanal</SelectItem>
                  <SelectItem value="pos">POS / Kasir</SelectItem>
                  <SelectItem value="web">Web Olshop</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm">Tampilkan</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Omzet", value: `Rp ${(totalOmzet / 1000000).toFixed(1)}jt`, icon: DollarSign, trend: "+18% vs periode lalu", trendUp: true },
          { label: "Total Transaksi", value: totalTransaksi.toString(), icon: ShoppingCart, trend: "+12% vs periode lalu", trendUp: true },
          { label: "Rata-rata Transaksi", value: `Rp ${(avgTransaksi / 1000).toFixed(0)}rb`, icon: TrendingUp, trend: "+5% vs periode lalu", trendUp: true },
          { label: "Produk Terjual", value: "1.842 unit", icon: Package, trend: "+23% vs periode lalu", trendUp: true },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-emerald-600 mt-1">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Omzet Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tren Omzet 6 Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={omzetData}>
                <defs>
                  <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatRp} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v) => [formatRp(Number(v))]} />
                <Area type="monotone" dataKey="omzet" name="Omzet" stroke="hsl(221, 83%, 53%)" strokeWidth={2} fill="url(#repGrad)" />
                <Area type="monotone" dataKey="target" name="Target" stroke="hsl(0,0%,60%)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penjualan per Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="45%" outerRadius={70} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
                  {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jumlah Transaksi per Hari (Minggu Ini)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hari" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Transaksi" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Produk Terlaris</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Ekspor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.nama}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{p.nama}</p>
                      <p className="text-xs text-muted-foreground">{p.terjual} unit terjual</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">Rp {(p.omzet / 1000000).toFixed(1)}jt</p>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(p.terjual / topProducts[0].terjual) * 100}%` }}
                  />
                </div>
                {i < topProducts.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── MDR Monitoring ── */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Pemantauan Beban MDR & Biaya Transaksi
        </h2>
      </div>

      {/* MDR KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Beban MDR", value: "Rp 1,24jt", sub: "Bulan ini", warn: false },
          { label: "MDR % dari Omzet", value: "0.82%", sub: "Rata-rata tertimbang", warn: false },
          { label: "Biaya Platform MP", value: "Rp 3,18jt", sub: "Komisi + layanan", warn: false },
          { label: "Margin Setelah Biaya", value: "18.4%", sub: "vs 21.2% bulan lalu", warn: true },
        ].map((k) => (
          <Card key={k.label} className={k.warn ? "border-amber-300 bg-amber-50/50" : ""}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.warn ? "text-amber-700" : ""}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MDR per metode bayar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Beban MDR per Metode Pembayaran</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" /> Ekspor</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-2 font-medium">Metode Pembayaran</th>
                <th className="text-right py-2 font-medium">Volume Transaksi</th>
                <th className="text-right py-2 font-medium">Total Omzet</th>
                <th className="text-right py-2 font-medium">Rate MDR</th>
                <th className="text-right py-2 font-medium">Beban MDR</th>
                <th className="text-right py-2 font-medium">Net Diterima</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { metode: "Tunai", vol: 82, omzet: 58200000, mdr: 0, warn: false },
                { metode: "Transfer Bank", vol: 44, omzet: 31800000, mdr: 0, warn: false },
                { metode: "QRIS", vol: 76, omzet: 45600000, mdr: 0.7, warn: false },
                { metode: "Kartu Debit", vol: 28, omzet: 18400000, mdr: 1.0, warn: false },
                { metode: "Kartu Kredit", vol: 14, omzet: 9800000,  mdr: 2.5, warn: true },
                { metode: "Tokopedia", vol: 31, omzet: 22400000, mdr: 1.8, warn: false },
                { metode: "Shopee", vol: 18, omzet: 13100000, mdr: 2.2, warn: false },
              ].map((r) => {
                const beban = r.omzet * (r.mdr / 100);
                const net   = r.omzet - beban;
                return (
                  <tr key={r.metode} className={r.warn ? "bg-amber-50/40" : "hover:bg-muted/30"}>
                    <td className="py-2.5 font-medium flex items-center gap-1.5">
                      {r.warn && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      {r.metode}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{r.vol}×</td>
                    <td className="py-2.5 text-right">Rp {(r.omzet/1000000).toFixed(1)}jt</td>
                    <td className="py-2.5 text-right">
                      <span className={r.mdr > 1.5 ? "text-amber-600 font-medium" : ""}>{r.mdr}%</span>
                    </td>
                    <td className="py-2.5 text-right text-destructive font-medium">
                      {beban > 0 ? `-Rp ${(beban/1000).toFixed(0)}rb` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">Rp {(net/1000000).toFixed(2)}jt</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td className="py-2.5">TOTAL</td>
                <td className="py-2.5 text-right text-muted-foreground">293×</td>
                <td className="py-2.5 text-right">Rp 199,3jt</td>
                <td className="py-2.5 text-right text-muted-foreground">—</td>
                <td className="py-2.5 text-right text-destructive">-Rp 1.638rb</td>
                <td className="py-2.5 text-right text-emerald-700">Rp 197,6jt</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Margin setelah biaya per produk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Produk dengan Margin Tipis (setelah MDR & biaya platform)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { nama: "Masker Bedah 3-ply (50 pcs)", hpp: 18000, jual: 25000, mdrEfektif: 2.2, marginPct: 8.4, warn: "tipis" },
              { nama: "Kasa Steril 16x16 (Box isi 10)", hpp: 8000,  jual: 12000, mdrEfektif: 2.2, marginPct: 5.2, warn: "tipis" },
              { nama: "Sarung Tangan Vinyl S (100 pcs)", hpp: 42000, jual: 44000, mdrEfektif: 2.5, marginPct: -1.8, warn: "minus" },
            ].map((p) => (
              <div key={p.nama} className={`flex items-center gap-4 p-3 rounded-lg border text-sm ${p.warn === "minus" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <AlertTriangle className={`h-5 w-5 shrink-0 ${p.warn === "minus" ? "text-destructive" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.nama}</p>
                  <p className="text-xs text-muted-foreground">HPP: Rp {p.hpp.toLocaleString("id-ID")} · Jual: Rp {p.jual.toLocaleString("id-ID")} · MDR efektif: {p.mdrEfektif}%</p>
                </div>
                <div className={`shrink-0 text-right ${p.warn === "minus" ? "text-destructive" : "text-amber-700"}`}>
                  <p className="font-bold text-base">{p.marginPct.toFixed(1)}%</p>
                  <p className="text-xs">{p.warn === "minus" ? "⚠ RUGI" : "Margin Tipis"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Real money vs pending ── */}
      <div>
        <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Uang Riil vs Dana Pending
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-300 bg-emerald-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Uang Riil (sudah settle &amp; tervalidasi)</p>
              <p className="text-2xl font-bold text-emerald-700">Rp 142,8jt</p>
              <p className="text-xs text-muted-foreground mt-1">Laba final diakui</p>
            </CardContent>
          </Card>
          <Card className="border-amber-300 bg-amber-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Dana Pending (belum validasi)</p>
              <p className="text-2xl font-bold text-amber-700">Rp 38,4jt</p>
              <p className="text-xs text-muted-foreground mt-1">Marketplace menunggu settlement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Total Perputaran</p>
              <p className="text-2xl font-bold">Rp 181,2jt</p>
              <p className="text-xs text-muted-foreground mt-1">Riil + Pending</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionLedger channel={channel} />

      <CostTracing />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RINCIAN TRANSAKSI — buku besar lengkap dengan pencarian & filter
══════════════════════════════════════════════════════════════════ */
type LedgerRow = {
  id: string; tgl: string; kanal: "pos" | "web" | "marketplace"; produk: string;
  omzet: number; hpp: number; mdr: number; biaya: number; dana: "riil" | "pending";
};

const ledgerRows: LedgerRow[] = [
  { id: "TRX-0042", tgl: "06/06", kanal: "pos", produk: "Tensimeter OMRON HEM-7120", omzet: 540000, hpp: 420000, mdr: 0, biaya: 0, dana: "riil" },
  { id: "ORD-0098", tgl: "06/06", kanal: "web", produk: "Nebulizer Omron NE-C28", omzet: 620000, hpp: 470000, mdr: 4340, biaya: 0, dana: "riil" },
  { id: "TKP-8841", tgl: "06/06", kanal: "marketplace", produk: "Kursi Roda Lipat Sella", omzet: 1250000, hpp: 980000, mdr: 8750, biaya: 23500, dana: "pending" },
  { id: "TRX-0041", tgl: "05/06", kanal: "pos", produk: "Masker 3-ply (Box 50) ×6", omzet: 150000, hpp: 108000, mdr: 1050, biaya: 0, dana: "riil" },
  { id: "SHP-2210", tgl: "05/06", kanal: "marketplace", produk: "Oximeter Fingertip ×3", omzet: 225000, hpp: 156000, mdr: 1575, biaya: 4220, dana: "pending" },
  { id: "ORD-0097", tgl: "05/06", kanal: "web", produk: "Termometer Infrared OneMed", omzet: 150000, hpp: 105000, mdr: 1050, biaya: 0, dana: "riil" },
  { id: "TRX-0040", tgl: "04/06", kanal: "pos", produk: "Stetoskop Littmann Classic III", omzet: 1850000, hpp: 1450000, mdr: 0, biaya: 0, dana: "riil" },
  { id: "LZD-1190", tgl: "04/06", kanal: "marketplace", produk: "Kasa Steril ×10", omzet: 350000, hpp: 240000, mdr: 2450, biaya: 10250, dana: "pending" },
];

function TransactionLedger({ channel }: { channel: string }) {
  const [q, setQ] = useState("");
  const [dana, setDana] = useState("semua");

  const rows = ledgerRows.filter((r) => {
    const okCh = channel === "semua" || r.kanal === channel;
    const okQ = !q || r.id.toLowerCase().includes(q.toLowerCase()) || r.produk.toLowerCase().includes(q.toLowerCase());
    const okDana = dana === "semua" || r.dana === dana;
    return okCh && okQ && okDana;
  });

  const tot = rows.reduce((a, r) => ({
    omzet: a.omzet + r.omzet, hpp: a.hpp + r.hpp, mdr: a.mdr + r.mdr, biaya: a.biaya + r.biaya,
    laba: a.laba + (r.omzet - r.hpp - r.mdr - r.biaya),
  }), { omzet: 0, hpp: 0, mdr: 0, biaya: 0, laba: 0 });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Rincian Transaksi</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Buku besar per transaksi: omzet, HPP, MDR, biaya, laba, dan status dana.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari ID / produk…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 w-48 pl-9" />
          </div>
          <Select value={dana} onValueChange={(v) => { if (v) setDana(v); }}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Dana</SelectItem>
              <SelectItem value="riil">Uang Riil</SelectItem>
              <SelectItem value="pending">Belum Masuk</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Ekspor</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DesktopOnly className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-2 py-2 text-left font-medium">Tgl</th>
                <th className="px-2 py-2 text-left font-medium">Kanal</th>
                <th className="px-2 py-2 text-left font-medium">Produk</th>
                <th className="px-2 py-2 text-right font-medium">Omzet</th>
                <th className="px-2 py-2 text-right font-medium">HPP</th>
                <th className="px-2 py-2 text-right font-medium">MDR</th>
                <th className="px-2 py-2 text-right font-medium">Biaya</th>
                <th className="px-2 py-2 text-right font-medium">Laba</th>
                <th className="px-4 py-2 text-left font-medium">Dana</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Tidak ada transaksi cocok</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.id}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.tgl}</td>
                  <td className="px-2 py-2.5 capitalize"><span className="rounded border px-1.5 py-0.5 text-[11px]">{r.kanal}</span></td>
                  <td className="max-w-[200px] truncate px-2 py-2.5">{r.produk}</td>
                  <td className="px-2 py-2.5 text-right">{formatRpFull(r.omzet)}</td>
                  <td className="px-2 py-2.5 text-right text-muted-foreground">{formatRpFull(r.hpp)}</td>
                  <td className="px-2 py-2.5 text-right text-amber-700">{r.mdr > 0 ? `−${formatRpFull(r.mdr)}` : "—"}</td>
                  <td className="px-2 py-2.5 text-right text-amber-700">{r.biaya > 0 ? `−${formatRpFull(r.biaya)}` : "—"}</td>
                  <td className="px-2 py-2.5 text-right font-medium text-emerald-700">{formatRpFull(r.omzet - r.hpp - r.mdr - r.biaya)}</td>
                  <td className="px-4 py-2.5">
                    {r.dana === "pending"
                      ? <Badge className="bg-amber-100 text-amber-800">Belum masuk</Badge>
                      : <Badge className="bg-emerald-100 text-emerald-800">Riil</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td className="px-4 py-2.5" colSpan={4}>TOTAL ({rows.length})</td>
                <td className="px-2 py-2.5 text-right">{formatRpFull(tot.omzet)}</td>
                <td className="px-2 py-2.5 text-right">{formatRpFull(tot.hpp)}</td>
                <td className="px-2 py-2.5 text-right text-amber-700">−{formatRpFull(tot.mdr)}</td>
                <td className="px-2 py-2.5 text-right text-amber-700">−{formatRpFull(tot.biaya)}</td>
                <td className="px-2 py-2.5 text-right text-emerald-700">{formatRpFull(tot.laba)}</td>
                <td className="px-4 py-2.5"></td>
              </tr>
            </tfoot>
          </table>
        </DesktopOnly>

        <MobileList className="p-3">
          {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada transaksi cocok</p>}
          {rows.map((r) => (
            <RecordCard key={r.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{r.id}</p>
                  <p className="text-xs text-muted-foreground">{r.tgl} · <span className="capitalize">{r.kanal}</span></p>
                </div>
                {r.dana === "pending"
                  ? <Badge className="bg-amber-100 text-amber-800">Belum masuk</Badge>
                  : <Badge className="bg-emerald-100 text-emerald-800">Riil</Badge>}
              </div>
              <Field label="Produk" value={<span className="line-clamp-1 text-right">{r.produk}</span>} />
              <Field label="Omzet" value={formatRpFull(r.omzet)} />
              <Field label="HPP" value={<span className="text-muted-foreground">{formatRpFull(r.hpp)}</span>} />
              <Field label="MDR" value={r.mdr > 0 ? <span className="text-amber-700">−{formatRpFull(r.mdr)}</span> : "—"} />
              <Field label="Biaya" value={r.biaya > 0 ? <span className="text-amber-700">−{formatRpFull(r.biaya)}</span> : "—"} />
              <Field label="Laba" value={<span className="font-semibold text-emerald-700">{formatRpFull(r.omzet - r.hpp - r.mdr - r.biaya)}</span>} />
            </RecordCard>
          ))}
        </MobileList>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BUKU BIAYA — Drill-down beban per kategori & per item
══════════════════════════════════════════════════════════════════ */
type CostDetail = { label: string; sub: string; amount: number };
type CostCategory = {
  key: string;
  label: string;
  amount: number;
  prev: number;
  details: CostDetail[];
};

const costCategories: CostCategory[] = [
  {
    key: "hpp", label: "HPP / Modal Barang Terjual", amount: 121400000, prev: 110200000,
    details: [
      { label: "Tensimeter Digital OMRON", sub: "48 unit · FIFO", amount: 20160000 },
      { label: "Nebulizer Omron NE-C28", sub: "31 unit", amount: 14260000 },
      { label: "Kursi Roda Lipat Standar", sub: "12 unit", amount: 9000000 },
      { label: "Lainnya (142 SKU)", sub: "akumulasi", amount: 77980000 },
    ],
  },
  {
    key: "mdr", label: "Beban MDR (biaya pembayaran)", amount: 1638000, prev: 1180000,
    details: [
      { label: "Kartu Kredit 2.5%", sub: "14 transaksi", amount: 245000 },
      { label: "QRIS 0.7%", sub: "76 transaksi", amount: 319000 },
      { label: "Kartu Debit 1.0%", sub: "28 transaksi", amount: 184000 },
      { label: "Komisi marketplace (MDR)", sub: "49 transaksi", amount: 890000 },
    ],
  },
  {
    key: "platform", label: "Komisi & Biaya Platform Marketplace", amount: 3180000, prev: 2050000,
    details: [
      { label: "Tokopedia 1.8%", sub: "31 pesanan", amount: 1210000 },
      { label: "Shopee 2.2%", sub: "18 pesanan", amount: 1020000 },
      { label: "Biaya layanan tetap", sub: "49 pesanan", amount: 490000 },
      { label: "Lazada 2.5%", sub: "9 pesanan", amount: 460000 },
    ],
  },
  {
    key: "ongkir", label: "Subsidi Ongkir", amount: 2240000, prev: 1600000,
    details: [
      { label: "Subsidi Jabodetabek", sub: "84 pesanan", amount: 1260000 },
      { label: "Subsidi luar Jawa", sub: "39 pesanan", amount: 980000 },
    ],
  },
  {
    key: "writeoff", label: "Write-off / Kerugian ED", amount: 870000, prev: 320000,
    details: [
      { label: "Gloves Vinyl M (Batch B2022-078)", sub: "kadaluarsa, 18 box", amount: 756000 },
      { label: "Kasa Steril (rusak kemasan)", sub: "12 box", amount: 114000 },
    ],
  },
];

const formatRpFull = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

function CostTracing() {
  const [open, setOpen] = useState<string | null>("writeoff");
  const [q, setQ] = useState("");

  const totalBiaya = costCategories.reduce((s, c) => s + c.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Buku Biaya — Telusuri Beban per Detail</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Klik kategori untuk menelusuri pembengkakan biaya hingga per item/transaksi.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Ekspor Ledger</Button>
        </div>
        <div className="relative mt-2 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari item/komponen biaya..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {costCategories.map((c) => {
          const delta = ((c.amount - c.prev) / c.prev) * 100;
          const isUp = delta > 0;
          const expanded = open === c.key;
          const visibleDetails = c.details.filter((d) => d.label.toLowerCase().includes(q.toLowerCase()));
          if (q && visibleDetails.length === 0 && !c.label.toLowerCase().includes(q.toLowerCase())) return null;
          return (
            <div key={c.key} className="rounded-xl border overflow-hidden">
              <button
                onClick={() => setOpen(expanded ? null : c.key)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.details.length} komponen</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{formatRpFull(c.amount)}</p>
                  <p className={`text-xs font-medium ${isUp ? "text-destructive" : "text-emerald-600"}`}>
                    {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}% vs lalu
                  </p>
                </div>
              </button>
              {expanded && (
                <div className="border-t bg-muted/20 divide-y">
                  {visibleDetails.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 pl-11 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[13px]">{d.label}</p>
                        <p className="text-xs text-muted-foreground">{d.sub}</p>
                      </div>
                      <span className="font-medium text-[13px]">{formatRpFull(d.amount)}</span>
                      <span className="w-12 text-right text-xs text-muted-foreground">{((d.amount / c.amount) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  {isUp && delta > 30 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 pl-11 text-xs text-destructive bg-destructive/5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Beban kategori ini naik signifikan ({delta.toFixed(0)}%) — perlu ditinjau.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <Separator />
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-bold">Total Beban Tercatat</span>
          <span className="font-bold text-lg">{formatRpFull(totalBiaya)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
