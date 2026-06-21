import { getMyOrders } from "@/actions/orders";
import { OrdersList, type OrderRow } from "./_components/orders-list";

export default async function OrdersPage() {
  let rows: OrderRow[] = [];
  try {
    const orders = await getMyOrders();
    rows = orders.map((o) => ({
      id: o.id,
      midtransOrderId: o.midtransOrderId,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      courier: o.courier,
      courierService: o.courierService,
      itemCount: o.itemCount,
    }));
  } catch {
    // user not logged in or DB error — show empty state
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Riwayat Pesanan</h1>
        <p className="text-muted-foreground">Pantau status pesanan dan transaksi Anda.</p>
      </div>
      <OrdersList orders={rows} />
    </div>
  );
}
