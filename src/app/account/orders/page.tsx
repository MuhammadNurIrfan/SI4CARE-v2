import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const dummyOrders = [
  {
    id: "INV/20231015/0001",
    date: "15 Okt 2023",
    status: "Dikirim",
    statusColor: "bg-blue-500",
    total: "Rp 614.500",
    items: [
      { name: "Tensi Darah Digital Omron HEM-7120", qty: 1, imageColor: "bg-blue-100" }
    ],
    resi: "JNE - 1234567890123"
  },
  {
    id: "INV/20230902/0045",
    date: "02 Sep 2023",
    status: "Selesai",
    statusColor: "bg-emerald-500",
    total: "Rp 100.000",
    items: [
      { name: "Masker Medis 3-Ply (Box isi 50)", qty: 4, imageColor: "bg-amber-100" }
    ],
    resi: "Sicepat - 000987654321"
  }
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Riwayat Pesanan</h1>
        <p className="text-muted-foreground">Pantau status pesanan dan transaksi Anda.</p>
      </div>

      <Tabs defaultValue="semua" className="w-full">
        <div className="mb-6 -mx-4 md:mx-0 overflow-x-auto px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="w-max">
            <TabsTrigger value="semua" className="whitespace-nowrap">Semua</TabsTrigger>
            <TabsTrigger value="berlangsung" className="whitespace-nowrap">Sedang Berlangsung</TabsTrigger>
            <TabsTrigger value="selesai" className="whitespace-nowrap">Selesai</TabsTrigger>
            <TabsTrigger value="dibatalkan" className="whitespace-nowrap">Dibatalkan</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="semua" className="space-y-4">
          {dummyOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="p-4 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{order.id}</span>
                  <span className="text-sm text-muted-foreground">{order.date}</span>
                </div>
                <Badge className={`${order.statusColor} hover:${order.statusColor} text-white`}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex-1 space-y-4 w-full">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className={`w-16 h-16 shrink-0 rounded border ${item.imageColor}`} />
                        <div>
                          <p className="font-medium line-clamp-1">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.qty} barang</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="hidden md:block w-px h-16 bg-border" />
                  
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:items-end gap-1">
                    <p className="text-sm text-muted-foreground">Total Belanja</p>
                    <p className="font-bold text-lg">{order.total}</p>
                  </div>
                </div>

                <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-full sm:w-auto">
                    {order.status === "Selesai" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Truck className="h-4 w-4 text-blue-500" />
                    )}
                    <span>{order.resi}</span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    {order.status === "Selesai" && (
                      <Link href="/account/returns" className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full">Ajukan Retur</Button>
                      </Link>
                    )}
                    {order.status === "Dikirim" && (
                      <Button className="flex-1 sm:flex-none">Lacak Resi</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        {/* Other tabs omitted for brevity in mockup */}
      </Tabs>
    </div>
  );
}
