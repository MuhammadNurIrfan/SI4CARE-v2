import { adminGetOrders } from "@/actions/orders";
import type { AdminOrderRow } from "@/actions/orders";
import { AdminOrdersClient } from "./_components/orders-client";

export default async function OrdersPage() {
  let orders: AdminOrderRow[] = [];
  try {
    orders = await adminGetOrders();
  } catch {
    // Kembalikan halaman kosong jika sesi habis / bukan admin
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Pesanan Web</h1>
        <p className="text-muted-foreground">
          Kelola pesanan dari toko online. Transaksi marketplace ada di menu Marketplace.
        </p>
      </div>
      <AdminOrdersClient initialOrders={orders} />
    </div>
  );
}
