"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DollarSign, ShoppingCart, TrendingUp, Package,
  Download, FileText, AlertTriangle, CreditCard, Wallet, Loader2,
} from "lucide-react";
import { getReportData, type ReportSummary } from "@/actions/reports";
import { TransactionLedger } from "./transaction-ledger";
import { CostTracing } from "./cost-tracing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rp  = (n: number) => n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}jt` : n >= 1_000 ? `Rp ${(n / 1_000).toFixed(0)}rb` : `Rp ${n}`;
const rpf = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const PIE_COLORS = ["hsl(221,83%,53%)", "hsl(160,60%,45%)", "hsl(38,92%,55%)"];
const CH_LABELS: Record<string, string> = { pos: "POS / Kasir", web: "Web", marketplace: "Marketplace" };

function now() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsClient({
  initialData,
  initialDateFrom,
  initialDateTo,
}: {
  initialData: ReportSummary;
  initialDateFrom: string;
  initialDateTo: string;
}) {
  const [data, setData]         = useState(initialData);
  const [period, setPeriod]     = useState("bulan_ini");
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo]     = useState(initialDateTo);
  const [channel, setChannel]   = useState("semua");
  const [isPending, startTx]    = useTransition();

  function applyPeriod(p: string) {
    const today = now();
    const d = new Date();
    if (p === "hari_ini")   { setDateFrom(today); setDateTo(today); }
    if (p === "minggu_ini") { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); setDateFrom(s.toISOString().slice(0, 10)); setDateTo(today); }
    if (p === "bulan_ini")  { setDateFrom(monthStart()); setDateTo(today); }
    if (p === "kuartal")    { const s = new Date(d); s.setMonth(Math.floor(d.getMonth() / 3) * 3, 1); setDateFrom(s.toISOString().slice(0, 10)); setDateTo(today); }
    if (p === "tahun")      { setDateFrom(`${d.getFullYear()}-01-01`); setDateTo(today); }
    setPeriod(p);
  }

  function handleFilter() {
    startTx(async () => {
      const result = await getReportData(dateFrom, dateTo, channel);
      setData(result);
    });
  }

  const pieData = data.byChannel.map(c => ({ name: CH_LABELS[c.channel] ?? c.channel, value: c.sales }));
  const totalSales = data.totalSales;
  const avgTx = data.txCount > 0 ? totalSales / data.txCount : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Ringkasan performa penjualan dan bisnis · data dari DB</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Ekspor CSV
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Periode</Label>
              <Select value={period} onValueChange={v => { if (v) applyPeriod(v); }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
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
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sampai</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Kanal</Label>
              <Select value={channel} onValueChange={v => { if (v) setChannel(v); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kanal</SelectItem>
                  <SelectItem value="pos">POS / Kasir</SelectItem>
                  <SelectItem value="web">Web Olshop</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleFilter} disabled={isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Memuat…</> : "Tampilkan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Omzet",         value: rp(totalSales),           icon: DollarSign,  sub: `${data.txCount} transaksi` },
          { label: "Gross Margin",         value: rp(data.grossMargin),     icon: TrendingUp,  sub: totalSales > 0 ? `${((data.grossMargin / totalSales) * 100).toFixed(1)}% dari omzet` : "—" },
          { label: "Rata-rata Transaksi",  value: rp(avgTx),               icon: ShoppingCart, sub: `${data.txCount} transaksi tercatat` },
          { label: "Total HPP",            value: rp(data.totalHpp),        icon: Package,     sub: "Modal barang terjual" },
        ].map(k => (
          <Card key={k.label}>
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">{k.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Tren Omzet 6 Bulan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(221,83%,53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={rp} tick={{ fontSize: 11 }} width={64} />
                <Tooltip formatter={(v) => [rp(Number(v)), "Omzet"]} />
                <Area type="monotone" dataKey="omzet" name="Omzet" stroke="hsl(221,83%,53%)" strokeWidth={2} fill="url(#repGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Penjualan per Channel</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0
              ? <p className="text-center text-sm text-muted-foreground py-16">Belum ada data</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" outerRadius={70} dataKey="value" label={({ name }) => name} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Jumlah Transaksi per Hari (7 Hari Terakhir)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyCount}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hari" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="jumlah" name="Transaksi" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Produk Terlaris</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Ekspor</Button>
        </CardHeader>
        <CardContent>
          {data.topProducts.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">Belum ada data produk</p>
            : (
              <div className="space-y-4">
                {data.topProducts.map((p, i) => (
                  <div key={p.nama}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{p.nama}</p>
                          <p className="text-xs text-muted-foreground">{p.terjual} unit terjual</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold shrink-0">{rp(p.omzet)}</p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(p.terjual / (data.topProducts[0]?.terjual || 1)) * 100}%` }} />
                    </div>
                    {i < data.topProducts.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      {/* MDR Monitoring */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Pemantauan Beban MDR & Biaya Transaksi
        </h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Beban MDR & Komisi per Metode Pembayaran</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" /> Ekspor</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.mdrRows.length === 0
            ? <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data</p>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left py-2 font-medium">Metode / Platform</th>
                    <th className="text-right py-2 font-medium">Vol</th>
                    <th className="text-right py-2 font-medium">Total Omzet</th>
                    <th className="text-right py-2 font-medium">Rate</th>
                    <th className="text-right py-2 font-medium">Beban</th>
                    <th className="text-right py-2 font-medium">Net Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.mdrRows.map(r => {
                    const net = r.totalAmount - r.mdrAmount;
                    const warn = r.mdrRate >= 2;
                    return (
                      <tr key={r.metode} className={warn ? "bg-amber-50/40" : "hover:bg-muted/30"}>
                        <td className="py-2.5 font-medium flex items-center gap-1.5">
                          {warn && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                          {r.metode}
                          {r.isMarketplace && <span className="text-[10px] text-muted-foreground">(komisi)</span>}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">{r.vol}×</td>
                        <td className="py-2.5 text-right">{rp(r.totalAmount)}</td>
                        <td className="py-2.5 text-right">
                          <span className={r.mdrRate >= 2 ? "text-amber-600 font-medium" : ""}>{r.mdrRate}%</span>
                        </td>
                        <td className="py-2.5 text-right text-destructive font-medium">
                          {r.mdrAmount > 0 ? `−${rpf(r.mdrAmount)}` : "—"}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-700">{rpf(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="py-2.5">TOTAL</td>
                    <td className="py-2.5 text-right text-muted-foreground">{data.mdrRows.reduce((s, r) => s + r.vol, 0)}×</td>
                    <td className="py-2.5 text-right">{rp(data.mdrRows.reduce((s, r) => s + r.totalAmount, 0))}</td>
                    <td className="py-2.5 text-right text-muted-foreground">—</td>
                    <td className="py-2.5 text-right text-destructive">−{rpf(data.mdrRows.reduce((s, r) => s + r.mdrAmount, 0))}</td>
                    <td className="py-2.5 text-right text-emerald-700">{rp(data.mdrRows.reduce((s, r) => s + (r.totalAmount - r.mdrAmount), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            )
          }
        </CardContent>
      </Card>

      {/* Riil vs Pending */}
      <div>
        <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Uang Riil vs Dana Pending
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-300 bg-emerald-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Uang Riil (sudah settle)</p>
              <p className="text-2xl font-bold text-emerald-700">{rp(data.riilAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">POS + web + MP settled</p>
            </CardContent>
          </Card>
          <Card className="border-amber-300 bg-amber-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Dana Pending (belum validasi)</p>
              <p className="text-2xl font-bold text-amber-700">{rp(data.pendingAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">Marketplace menunggu settlement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Total Perputaran</p>
              <p className="text-2xl font-bold">{rp(data.riilAmount + data.pendingAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">Riil + Pending</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionLedger rows={data.ledgerRows} />
      <CostTracing />
    </div>
  );
}
