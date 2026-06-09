"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, TrendingUp, Wallet, AlertTriangle, Search, Globe, Store, ShoppingCart, Boxes, CreditCard, Download, Package,
} from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";

const rp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
const rpShort = (n: number) => (n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1)}M` : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}jt` : n >= 1e3 ? `Rp ${(n / 1e3).toFixed(0)}rb` : `Rp ${n}`);

/* Base = bulan ini */
const channelsBase = [
  { key: "pos", label: "POS / Kasir", icon: ShoppingCart, trx: 142, omzet: 92400000, hpp: 70100000, mdr: 318000, biaya: 0, pending: 0 },
  { key: "web", label: "Web Olshop", icon: Globe, trx: 86, omzet: 58200000, hpp: 44500000, mdr: 407400, biaya: 0, pending: 0 },
  { key: "marketplace", label: "Marketplace", icon: Store, trx: 49, omzet: 38400000, hpp: 29200000, mdr: 268800, biaya: 3180000, pending: 11200000 },
];

const ecommerceBase = [
  { platform: "Tokopedia", trx: 22, omzet: 18400000, komisi: 331200, mdr: 128800, danaMasuk: 14200000, pending: 3650000 },
  { platform: "Shopee", trx: 18, omzet: 13100000, komisi: 288200, mdr: 91700, danaMasuk: 9800000, pending: 2820000 },
  { platform: "Lazada", trx: 9, omzet: 6900000, komisi: 172500, mdr: 48300, danaMasuk: 1950000, pending: 4730000 },
];

const trendBase = [
  { t: "Sen", pos: 12500000, web: 8200000, marketplace: 4100000 },
  { t: "Sel", pos: 14800000, web: 9100000, marketplace: 5200000 },
  { t: "Rab", pos: 11200000, web: 7400000, marketplace: 3800000 },
  { t: "Kam", pos: 16100000, web: 10200000, marketplace: 6100000 },
  { t: "Jum", pos: 13900000, web: 8800000, marketplace: 5400000 },
  { t: "Sab", pos: 17400000, web: 9600000, marketplace: 6900000 },
  { t: "Min", pos: 12100000, web: 7900000, marketplace: 4500000 },
];

const mdrDetail = [
  { metode: "Tunai", channel: "POS", vol: 82, omzet: 38200000, rate: 0, ditanggung: false },
  { metode: "QRIS", channel: "POS/Web", vol: 76, omzet: 45600000, rate: 0.7, ditanggung: true },
  { metode: "Kartu Debit", channel: "POS", vol: 28, omzet: 18400000, rate: 1.0, ditanggung: true },
  { metode: "Kartu Kredit", channel: "POS", vol: 14, omzet: 9800000, rate: 2.5, ditanggung: true },
  { metode: "VA / Transfer", channel: "Web", vol: 44, omzet: 31800000, rate: 0, ditanggung: false },
  { metode: "Komisi+MDR Marketplace", channel: "Marketplace", vol: 49, omzet: 38400000, rate: 1.4, ditanggung: true },
];

const lowStock = [
  { nama: "Stetoskop Littmann Classic III", sku: "ALK-STE-001", stok: 3, min: 5, ed: "-" },
  { nama: "Nebulizer Omron NE-C28", sku: "OMR-NEB-001", stok: 3, min: 5, ed: "-" },
  { nama: "Sarung Tangan Latex (Box 100)", sku: "BHP-STG-001", stok: 5, min: 20, ed: "2026-06-30" },
  { nama: "Tabung Oksigen 1m³", sku: "ALK-O2-001", stok: 2, min: 3, ed: "-" },
];

const recentTrx = [
  { id: "TRX-0042", channel: "pos", produk: "Tensimeter OMRON HEM-7120", omzet: 540000, hpp: 420000, mdr: 0, dana: "riil" },
  { id: "ORD-0098", channel: "web", produk: "Nebulizer Omron NE-C28", omzet: 620000, hpp: 470000, mdr: 4340, dana: "riil" },
  { id: "TKP-8841", channel: "marketplace", produk: "Kursi Roda Lipat Sella", omzet: 1250000, hpp: 980000, mdr: 8750, dana: "pending" },
  { id: "TRX-0041", channel: "pos", produk: "Masker 3-ply (Box 50) ×6", omzet: 150000, hpp: 108000, mdr: 1050, dana: "riil" },
  { id: "SHP-2210", channel: "marketplace", produk: "Oximeter Fingertip ×3", omzet: 225000, hpp: 156000, mdr: 1575, dana: "pending" },
  { id: "ORD-0097", channel: "web", produk: "Termometer Infrared OneMed", omzet: 150000, hpp: 105000, mdr: 1050, dana: "riil" },
];

const periodFactor: Record<string, number> = { hari_ini: 0.038, minggu_ini: 0.25, bulan_ini: 1, kuartal: 3, tahun: 12 };
const periodLabel: Record<string, string> = { hari_ini: "Hari Ini", minggu_ini: "Minggu Ini", bulan_ini: "Bulan Ini", kuartal: "Kuartal Ini", tahun: "Tahun Ini" };
const channelColor: Record<string, string> = { pos: "hsl(221,83%,53%)", web: "hsl(160,60%,45%)", marketplace: "hsl(38,92%,55%)" };

export default function DashboardPage() {
  const [period, setPeriod] = useState("bulan_ini");
  const [channel, setChannel] = useState("semua");
  const [search, setSearch] = useState("");

  const f = periodFactor[period] ?? 1;
  const channels = useMemo(() => channelsBase.filter((c) => channel === "semua" || c.key === channel), [channel]);

  const omzet = channels.reduce((s, c) => s + c.omzet, 0) * f;
  const hpp = channels.reduce((s, c) => s + c.hpp, 0) * f;
  const mdrTot = channels.reduce((s, c) => s + c.mdr, 0) * f;
  const biaya = channels.reduce((s, c) => s + c.biaya, 0) * f;
  const pending = channels.reduce((s, c) => s + c.pending, 0) * f;
  const labaKotor = omzet - hpp;
  const labaBersih = labaKotor - mdrTot - biaya;
  const trx = Math.round(channels.reduce((s, c) => s + c.trx, 0) * f);
  const marginPct = omzet > 0 ? (labaBersih / omzet) * 100 : 0;

  const channelPie = channelsBase.map((c) => ({ name: c.label, value: c.omzet }));

  const filteredTrx = recentTrx.filter((t) => {
    const okCh = channel === "semua" || t.channel === channel;
    const okQ = !search || t.produk.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return okCh && okQ;
  });

  const kpis = [
    { label: "Omzet", value: rp(omzet), icon: DollarSign, sub: `${trx} transaksi`, tone: "" },
    { label: "Laba Kotor (setelah HPP)", value: rp(labaKotor), icon: TrendingUp, sub: `HPP ${rpShort(hpp)}`, tone: "text-emerald-700" },
    { label: "Laba Bersih (setelah biaya)", value: rp(labaBersih), icon: Wallet, sub: `Margin ${marginPct.toFixed(1)}% · MDR ${rpShort(mdrTot)}`, tone: "text-emerald-700" },
    { label: "Belum Masuk Rekening", value: rp(pending), icon: AlertTriangle, sub: "Dana pending marketplace", tone: "text-amber-700", warn: true },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Evaluasi menyeluruh — {periodLabel[period]}{channel !== "semua" ? ` · ${channelsBase.find((c) => c.key === channel)?.label}` : " · Semua Kanal"}.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label className="text-[11px] text-muted-foreground">Periode</Label>
            <Select value={period} onValueChange={(v) => { if (v) setPeriod(v); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[11px] text-muted-foreground">Kanal</Label>
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
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Ekspor</Button>
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
                  const lk = (c.omzet - c.hpp) * f;
                  const lb = (c.omzet - c.hpp - c.mdr - c.biaya) * f;
                  return (
                    <TableRow key={c.key}>
                      <TableCell><span className="flex items-center gap-2 font-medium"><c.icon className="h-4 w-4 text-muted-foreground" /> {c.label}</span></TableCell>
                      <TableCell className="text-center">{Math.round(c.trx * f)}</TableCell>
                      <TableCell className="text-right">{rp(c.omzet * f)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{rp(c.hpp * f)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-700">{rp(lk)}</TableCell>
                      <TableCell className="text-right text-amber-700">−{rp((c.mdr + c.biaya) * f)}</TableCell>
                      <TableCell className="text-right font-semibold">{rp(lb)}</TableCell>
                      <TableCell className="text-right">{c.pending > 0 ? <span className="text-amber-700">{rp(c.pending * f)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DesktopOnly>

          <MobileList className="p-3">
            {channels.map((c) => {
              const lk = (c.omzet - c.hpp) * f;
              const lb = (c.omzet - c.hpp - c.mdr - c.biaya) * f;
              return (
                <RecordCard key={c.key}>
                  <p className="mb-2 flex items-center gap-2 font-semibold"><c.icon className="h-4 w-4 text-muted-foreground" /> {c.label}</p>
                  <Field label="Transaksi" value={Math.round(c.trx * f)} />
                  <Field label="Omzet" value={rp(c.omzet * f)} />
                  <Field label="HPP" value={<span className="text-muted-foreground">{rp(c.hpp * f)}</span>} />
                  <Field label="Laba kotor" value={<span className="text-emerald-700">{rp(lk)}</span>} />
                  <Field label="MDR + biaya" value={<span className="text-amber-700">−{rp((c.mdr + c.biaya) * f)}</span>} />
                  <Field label="Laba bersih" value={<span className="font-semibold">{rp(lb)}</span>} />
                  <Field label="Belum masuk" value={c.pending > 0 ? <span className="text-amber-700">{rp(c.pending * f)}</span> : "—"} />
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
                  {ecommerceBase.map((e) => (
                    <TableRow key={e.platform}>
                      <TableCell><Badge variant="outline">{e.platform}</Badge></TableCell>
                      <TableCell className="text-center">{Math.round(e.trx * f)}</TableCell>
                      <TableCell className="text-right">{rp(e.omzet * f)}</TableCell>
                      <TableCell className="text-right text-amber-700">−{rp((e.komisi + e.mdr) * f)}</TableCell>
                      <TableCell className="text-right text-emerald-700">{rp(e.danaMasuk * f)}</TableCell>
                      <TableCell className="text-right text-amber-700">{rp(e.pending * f)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopOnly>

            <MobileList className="p-3">
              {ecommerceBase.map((e) => (
                <RecordCard key={e.platform}>
                  <p className="mb-2 font-semibold">{e.platform}</p>
                  <Field label="Transaksi" value={Math.round(e.trx * f)} />
                  <Field label="Omzet" value={rp(e.omzet * f)} />
                  <Field label="Komisi + MDR" value={<span className="text-amber-700">−{rp((e.komisi + e.mdr) * f)}</span>} />
                  <Field label="Dana masuk" value={<span className="text-emerald-700">{rp(e.danaMasuk * f)}</span>} />
                  <Field label="Pending" value={<span className="text-amber-700">{rp(e.pending * f)}</span>} />
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
                { l: "Total Produk", v: "142", c: "" },
                { l: "Stok Rendah", v: "4", c: "text-amber-600" },
                { l: "Stok Habis", v: "1", c: "text-destructive" },
                { l: "Mendekati ED", v: "3", c: "text-amber-600" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border bg-muted/30 p-3 text-center">
                  <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                  <p className="text-[11px] text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-3">
              <span className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4 text-primary" /> Nilai Persediaan (HPP)</span>
              <span className="font-bold text-primary">{rp(184500000)}</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Perlu perhatian:</p>
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

      {/* MDR detail */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" /> Detail Beban MDR (ditanggung toko vs tidak)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead className="text-center">Volume</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Beban MDR</TableHead>
                  <TableHead>Ditanggung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mdrDetail.map((m) => {
                  const beban = m.omzet * (m.rate / 100) * f;
                  return (
                    <TableRow key={m.metode}>
                      <TableCell className="font-medium">{m.metode}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{m.channel}</TableCell>
                      <TableCell className="text-center">{Math.round(m.vol * f)}</TableCell>
                      <TableCell className="text-right">{rp(m.omzet * f)}</TableCell>
                      <TableCell className="text-right">{m.rate}%</TableCell>
                      <TableCell className="text-right text-destructive">{beban > 0 ? `−${rp(beban)}` : "—"}</TableCell>
                      <TableCell>
                        {m.rate === 0 ? <Badge variant="secondary">Tidak ada</Badge>
                          : m.ditanggung ? <Badge className="bg-amber-100 text-amber-800">Toko (subsidi)</Badge>
                          : <Badge variant="outline">Pelanggan</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DesktopOnly>

          <MobileList className="p-3">
            {mdrDetail.map((m) => {
              const beban = m.omzet * (m.rate / 100) * f;
              return (
                <RecordCard key={m.metode}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold">{m.metode}</p>
                    {m.rate === 0 ? <Badge variant="secondary">Tidak ada</Badge>
                      : m.ditanggung ? <Badge className="bg-amber-100 text-amber-800">Toko (subsidi)</Badge>
                      : <Badge variant="outline">Pelanggan</Badge>}
                  </div>
                  <Field label="Kanal" value={m.channel} />
                  <Field label="Volume" value={Math.round(m.vol * f)} />
                  <Field label="Omzet" value={rp(m.omzet * f)} />
                  <Field label="Rate" value={`${m.rate}%`} />
                  <Field label="Beban MDR" value={beban > 0 ? <span className="text-destructive">−{rp(beban)}</span> : "—"} />
                </RecordCard>
              );
            })}
          </MobileList>
          <p className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
            Sesuai aturan QRIS, MDR tidak boleh dibebankan ke pelanggan — sehingga ditanggung toko (subsidi). Biaya ini mengurangi laba bersih.
          </p>
        </CardContent>
      </Card>

      {/* Recent transactions with search */}
      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Transaksi Terkini</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari ID / produk…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">HPP</TableHead>
                  <TableHead className="text-right">Laba</TableHead>
                  <TableHead className="text-right">MDR</TableHead>
                  <TableHead>Status Dana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrx.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Tidak ada transaksi cocok</TableCell></TableRow>
                )}
                {filteredTrx.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{t.channel}</Badge></TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">{t.produk}</TableCell>
                    <TableCell className="text-right text-sm">{rp(t.omzet)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{rp(t.hpp)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-emerald-700">{rp(t.omzet - t.hpp - t.mdr)}</TableCell>
                    <TableCell className="text-right text-sm text-amber-700">{t.mdr > 0 ? `−${rp(t.mdr)}` : "—"}</TableCell>
                    <TableCell>
                      {t.dana === "pending"
                        ? <Badge className="bg-amber-100 text-amber-800">Belum masuk</Badge>
                        : <Badge className="bg-emerald-100 text-emerald-800">Uang riil</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DesktopOnly>

          <MobileList className="p-3">
            {filteredTrx.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada transaksi cocok</p>}
            {filteredTrx.map((t) => (
              <RecordCard key={t.id}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold">{t.id}</p>
                  {t.dana === "pending"
                    ? <Badge className="bg-amber-100 text-amber-800">Belum masuk</Badge>
                    : <Badge className="bg-emerald-100 text-emerald-800">Uang riil</Badge>}
                </div>
                <Field label="Kanal" value={<Badge variant="outline" className="capitalize">{t.channel}</Badge>} />
                <Field label="Produk" value={<span className="line-clamp-1 text-right">{t.produk}</span>} />
                <Field label="Omzet" value={rp(t.omzet)} />
                <Field label="HPP" value={<span className="text-muted-foreground">{rp(t.hpp)}</span>} />
                <Field label="Laba" value={<span className="text-emerald-700">{rp(t.omzet - t.hpp - t.mdr)}</span>} />
                <Field label="MDR" value={t.mdr > 0 ? <span className="text-amber-700">−{rp(t.mdr)}</span> : "—"} />
              </RecordCard>
            ))}
          </MobileList>
        </CardContent>
      </Card>
    </div>
  );
}
