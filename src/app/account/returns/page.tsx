import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getMyReturnableOrders, getMyReturns } from "@/actions/returns";
import { ReturnsForm } from "./_components/returns-form";

export default async function ReturnsPage() {
  const [orders, myReturns] = await Promise.all([
    getMyReturnableOrders(),
    getMyReturns(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Pengajuan Retur</h1>
        <p className="text-muted-foreground">Isi form di bawah ini untuk mengajukan pengembalian barang.</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ketentuan Retur</AlertTitle>
        <AlertDescription className="text-sm">
          Retur hanya dapat dilakukan maksimal 3×24 jam sejak pesanan berstatus Selesai, dan harus disertai dengan video unboxing lengkap tanpa jeda.
        </AlertDescription>
      </Alert>

      <ReturnsForm orders={orders} myReturns={myReturns} />
    </div>
  );
}
