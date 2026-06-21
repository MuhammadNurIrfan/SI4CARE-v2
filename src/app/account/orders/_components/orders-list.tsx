"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, CheckCircle2, Clock, XCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";

export type OrderRow = {
  id: string;
  midtransOrderId: string | null;
  status: string;
  totalAmount: string;
  createdAt: string; // ISO string (Date serialized from server)
  courier: string | null;
  courierService: string | null;
  itemCount: number;
};

const STATUS_MAP: Record<string, { label: string; color: string; tab: string }> = {
  pending_payment: { label: "Menunggu Bayar",  color: "bg-amber-500",   tab: "berlangsung" },
  paid:            { label: "Dibayar",          color: "bg-blue-400",    tab: "berlangsung" },
  processing:      { label: "Diproses",         color: "bg-blue-500",    tab: "berlangsung" },
  shipped:         { label: "Dikirim",          color: "bg-sky-500",     tab: "berlangsung" },
  delivered:       { label: "Selesai",          color: "bg-emerald-500", tab: "selesai"     },
  cancelled:       { label: "Dibatalkan",       color: "bg-red-500",     tab: "dibatalkan"  },
};

const fmtRp = (val: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(val));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

function StatusIcon({ status }: { status: string }) {
  if (status === "delivered") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "cancelled") return <XCircle className="h-4 w-4 text-red-400" />;
  if (status === "shipped")   return <Truck className="h-4 w-4 text-sky-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function OrderCard({ order }: { order: OrderRow }) {
  const s = STATUS_MAP[order.status] ?? { label: order.status, color: "bg-muted", tab: "semua" };
  const displayId = order.midtransOrderId ?? order.id.slice(0, 8).toUpperCase();
  const courier = [order.courier, order.courierService].filter(Boolean).join(" · ") || "Kurir belum ditentukan";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-wrap items-center gap-3">
          <Package className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-sm">{displayId}</span>
          <span className="text-sm text-muted-foreground">{fmtDate(order.createdAt)}</span>
        </div>
        <Badge className={`${s.color} hover:${s.color} text-white shrink-0`}>{s.label}</Badge>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded border bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {order.itemCount} {order.itemCount === 1 ? "produk" : "produk"}
            </p>
          </div>

          <div className="hidden md:block w-px h-16 bg-border" />

          <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:items-end gap-1">
            <p className="text-sm text-muted-foreground">Total Belanja</p>
            <p className="font-bold text-lg">{fmtRp(order.totalAmount)}</p>
          </div>
        </div>

        <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground w-full sm:w-auto">
            <StatusIcon status={order.status} />
            <span>{courier}</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {order.status === "delivered" && (
              <Link href="/account/returns" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">Ajukan Retur</Button>
              </Link>
            )}
            {order.status === "shipped" && (
              <Button className="flex-1 sm:flex-none">Lacak Resi</Button>
            )}
            <Link href={`/account/orders/${order.id}`} className="flex-1 sm:flex-none">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">Detail</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Package className="h-12 w-12 text-muted-foreground/30" />
      <p className="font-medium text-muted-foreground">Tidak ada pesanan {label}</p>
      <Link href="/shop">
        <Button variant="outline" size="sm">Mulai Belanja</Button>
      </Link>
    </div>
  );
}

export function OrdersList({ orders }: { orders: OrderRow[] }) {
  const [tab, setTab] = useState("semua");

  const filtered = orders.filter((o) => {
    if (tab === "semua") return true;
    return (STATUS_MAP[o.status]?.tab ?? "semua") === tab;
  });

  const counts = {
    berlangsung: orders.filter((o) => STATUS_MAP[o.status]?.tab === "berlangsung").length,
    selesai:     orders.filter((o) => STATUS_MAP[o.status]?.tab === "selesai").length,
    dibatalkan:  orders.filter((o) => STATUS_MAP[o.status]?.tab === "dibatalkan").length,
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <div className="mb-6 -mx-4 md:mx-0 overflow-x-auto px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList className="w-max">
          <TabsTrigger value="semua" className="whitespace-nowrap">
            Semua <span className="ml-1.5 text-xs opacity-60">({orders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="berlangsung" className="whitespace-nowrap">
            Sedang Berlangsung
            {counts.berlangsung > 0 && <span className="ml-1.5 text-xs opacity-60">({counts.berlangsung})</span>}
          </TabsTrigger>
          <TabsTrigger value="selesai" className="whitespace-nowrap">
            Selesai
            {counts.selesai > 0 && <span className="ml-1.5 text-xs opacity-60">({counts.selesai})</span>}
          </TabsTrigger>
          <TabsTrigger value="dibatalkan" className="whitespace-nowrap">
            Dibatalkan
            {counts.dibatalkan > 0 && <span className="ml-1.5 text-xs opacity-60">({counts.dibatalkan})</span>}
          </TabsTrigger>
        </TabsList>
      </div>

      {(["semua", "berlangsung", "selesai", "dibatalkan"] as const).map((t) => (
        <TabsContent key={t} value={t} className="space-y-4">
          {filtered.length === 0 ? (
            <EmptyState label={t === "semua" ? "" : t} />
          ) : (
            filtered.map((o) => <OrderCard key={o.id} order={o} />)
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
