import { headers } from "next/headers";
import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getOrderDetail } from "@/actions/orders";
import { PendingPayment } from "./_components/pending-payment";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);

type Props = { searchParams: Promise<{ orderId?: string; status?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const { orderId, status } = params;

  const isPending = status === "pending";
  const order = session && orderId ? await getOrderDetail(orderId) : null;

  const estimasiTiba = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-2xl">
      <div className="text-center mb-10">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${isPending ? "bg-amber-100" : "bg-emerald-100"}`}>
          {isPending
            ? <AlertCircle className="h-10 w-10 text-amber-600" />
            : <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {isPending ? "Menunggu Pembayaran" : "Pesanan Berhasil!"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isPending
            ? "Selesaikan pembayaran Anda agar pesanan segera diproses."
            : "Terima kasih. Pembayaran Anda telah dikonfirmasi."}
        </p>
        {order?.midtransOrderId && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-mono font-medium">
            <span className="text-muted-foreground">No. Pesanan:</span>
            <span>{order.midtransOrderId}</span>
          </div>
        )}
      </div>

      {isPending && <PendingPayment />}

      {!isPending && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Estimasi Tiba</p>
              <p className="text-emerald-800 font-medium text-lg">{estimasiTiba}</p>
              {order?.courier && (
                <p className="text-emerald-700 text-sm mt-0.5">
                  via {order.courier.toUpperCase()} {order.courierService}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {order && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-2 text-sm">
            <h2 className="font-bold text-base mb-3">Ringkasan Pembayaran</h2>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{fmt(Number(order.subtotal))}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon</span><span>−{fmt(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Ongkos Kirim</span><span>{fmt(Number(order.shippingCost))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>PPN (12%)</span><span>{fmt(Number(order.ppn))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Layanan</span><span>{fmt(Number(order.serviceFee))}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total Dibayar</span>
              <span className="text-primary">{fmt(Number(order.totalAmount))}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/account/orders" className="flex-1">
          <Button size="lg" className="w-full gap-2">
            Lihat Pesanan <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/shop" className="flex-1">
          <Button size="lg" variant="outline" className="w-full gap-2">
            <Home className="h-4 w-4" /> Lanjut Belanja
          </Button>
        </Link>
      </div>
    </div>
  );
}
