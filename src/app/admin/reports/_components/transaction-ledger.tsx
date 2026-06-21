"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Search } from "lucide-react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";
import type { ReportLedgerRow } from "@/actions/reports";

const formatRpFull = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const CHANNEL_LABELS: Record<string, string> = { pos: "POS", web: "Web", marketplace: "MP" };

export function TransactionLedger({ rows }: { rows: ReportLedgerRow[] }) {
  const [q, setQ] = useState("");

  const filtered = rows.filter(r =>
    !q ||
    r.refNumber.toLowerCase().includes(q.toLowerCase()) ||
    r.produk.toLowerCase().includes(q.toLowerCase()),
  );

  const tot = filtered.reduce(
    (a, r) => ({ sales: a.sales + r.totalSales, hpp: a.hpp + r.totalHpp, margin: a.margin + r.grossMargin }),
    { sales: 0, hpp: 0, margin: 0 },
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Rincian Transaksi
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Buku besar per transaksi — omzet, HPP, dan margin dari seluruh kanal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari ref / produk…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="h-9 w-48 pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Ekspor
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DesktopOnly className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Ref</th>
                <th className="px-2 py-2 text-left font-medium">Tgl</th>
                <th className="px-2 py-2 text-left font-medium">Kanal</th>
                <th className="px-2 py-2 text-left font-medium">Produk / Transaksi</th>
                <th className="px-2 py-2 text-right font-medium">Omzet</th>
                <th className="px-2 py-2 text-right font-medium">HPP</th>
                <th className="px-2 py-2 text-right font-medium">Margin</th>
                <th className="px-4 py-2 text-right font-medium">Margin%</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              )}
              {filtered.map(r => {
                const pct = r.totalSales > 0 ? (r.grossMargin / r.totalSales) * 100 : 0;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.refNumber}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">{r.tgl}</td>
                    <td className="px-2 py-2.5">
                      <Badge variant="outline" className="text-[11px] font-medium">
                        {CHANNEL_LABELS[r.channel] ?? r.channel}
                      </Badge>
                    </td>
                    <td className="max-w-[200px] truncate px-2 py-2.5 text-sm">{r.produk}</td>
                    <td className="px-2 py-2.5 text-right">{formatRpFull(r.totalSales)}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{formatRpFull(r.totalHpp)}</td>
                    <td className="px-2 py-2.5 text-right font-medium text-emerald-700">{formatRpFull(r.grossMargin)}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-emerald-600">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td className="px-4 py-2.5" colSpan={4}>TOTAL ({filtered.length})</td>
                <td className="px-2 py-2.5 text-right">{formatRpFull(tot.sales)}</td>
                <td className="px-2 py-2.5 text-right">{formatRpFull(tot.hpp)}</td>
                <td className="px-2 py-2.5 text-right text-emerald-700">{formatRpFull(tot.margin)}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600 text-xs">
                  {tot.sales > 0 ? ((tot.margin / tot.sales) * 100).toFixed(1) + "%" : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </DesktopOnly>

        <MobileList className="p-3">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada data</p>
          )}
          {filtered.map(r => (
            <RecordCard key={r.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{r.refNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.tgl} · {CHANNEL_LABELS[r.channel] ?? r.channel}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">{CHANNEL_LABELS[r.channel]}</Badge>
              </div>
              <Field label="Produk" value={<span className="line-clamp-1 text-right text-xs">{r.produk}</span>} />
              <Field label="Omzet"  value={formatRpFull(r.totalSales)} />
              <Field label="HPP"    value={<span className="text-muted-foreground">{formatRpFull(r.totalHpp)}</span>} />
              <Field label="Margin" value={<span className="font-semibold text-emerald-700">{formatRpFull(r.grossMargin)}</span>} />
            </RecordCard>
          ))}
        </MobileList>
      </CardContent>
    </Card>
  );
}
