"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, BookOpen, ChevronRight, Download, Search } from "lucide-react";

type CostDetail   = { label: string; sub: string; amount: number };
type CostCategory = { key: string; label: string; amount: number; prev: number; details: CostDetail[] };

const costCategories: CostCategory[] = [
  {
    key: "hpp", label: "HPP / Modal Barang Terjual", amount: 121400000, prev: 110200000,
    details: [
      { label: "Tensimeter Digital OMRON", sub: "48 unit · FIFO", amount: 20160000 },
      { label: "Nebulizer Omron NE-C28", sub: "31 unit", amount: 14260000 },
      { label: "Kursi Roda Lipat Standar", sub: "12 unit", amount: 9000000 },
      { label: "Lainnya (produk lain)", sub: "akumulasi", amount: 77980000 },
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

const formatRpFull = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export function CostTracing() {
  const [open, setOpen] = useState<string | null>("writeoff");
  const [q, setQ]       = useState("");

  const totalBiaya = costCategories.reduce((s, c) => s + c.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Buku Biaya — Telusuri Beban per Detail
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Klik kategori untuk menelusuri pembengkakan biaya hingga per item / transaksi.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Ekspor Ledger
          </Button>
        </div>
        <div className="relative mt-2 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari item/komponen biaya..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {costCategories.map(c => {
          const delta     = ((c.amount - c.prev) / c.prev) * 100;
          const isUp      = delta > 0;
          const expanded  = open === c.key;
          const visible   = c.details.filter(d => d.label.toLowerCase().includes(q.toLowerCase()));
          if (q && visible.length === 0 && !c.label.toLowerCase().includes(q.toLowerCase())) return null;
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
                  {visible.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 pl-11 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[13px]">{d.label}</p>
                        <p className="text-xs text-muted-foreground">{d.sub}</p>
                      </div>
                      <span className="font-medium text-[13px]">{formatRpFull(d.amount)}</span>
                      <span className="w-12 text-right text-xs text-muted-foreground">
                        {((d.amount / c.amount) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {isUp && delta > 30 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 pl-11 text-xs text-destructive bg-destructive/5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Beban kategori ini naik signifikan ({delta.toFixed(0)}%) — perlu ditinjau.
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
