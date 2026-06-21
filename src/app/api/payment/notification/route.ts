import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, batches } from "@/lib/db/schema";

type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
};

function verifySignature(notification: MidtransNotification): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const raw = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`;
  const expected = createHash("sha512").update(raw).digest("hex");
  return expected === notification.signature_key;
}

function isPaymentSuccess(n: MidtransNotification): boolean {
  const { transaction_status, fraud_status } = n;
  return (
    transaction_status === "settlement" ||
    (transaction_status === "capture" && fraud_status === "accept")
  );
}

function isPaymentFailed(n: MidtransNotification): boolean {
  return ["deny", "cancel", "expire", "failure"].includes(n.transaction_status);
}

export async function POST(req: NextRequest) {
  let body: MidtransNotification;
  try {
    body = (await req.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verifikasi signature — kritis untuk keamanan
  if (!verifySignature(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.midtransOrderId, body.order_id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempoten: kalau sudah diproses, abaikan
  if (order.status !== "pending_payment") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (isPaymentSuccess(body)) {
    // Deduct stok per order item menggunakan alokasi FIFO/FEFO yang sudah dicatat
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      const allocations = (item.batchAllocations ?? []) as {
        batchId: string;
        qty: number;
        hpp: number;
      }[];

      for (const alloc of allocations) {
        await db.execute(
          `UPDATE batches SET remaining = remaining - ${alloc.qty} WHERE id = '${alloc.batchId}' AND remaining >= ${alloc.qty}` as unknown as Parameters<typeof db.execute>[0],
        );
      }
    }

    await db
      .update(orders)
      .set({
        status: "paid",
        paymentMethod: body.payment_type ?? null,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  } else if (isPaymentFailed(body)) {
    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  }

  return NextResponse.json({ ok: true });
}
