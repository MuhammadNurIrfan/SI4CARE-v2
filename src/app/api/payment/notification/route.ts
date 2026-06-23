import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
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

  // Verifikasi signature SHA-512 — tolak jika tidak cocok
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
        // Drizzle sql`` tag — nilai alloc.qty dan alloc.batchId di-bind sebagai
        // prepared-statement parameter, bukan diinterpolasi ke string SQL.
        await db
          .update(batches)
          .set({ remaining: sql`${batches.remaining} - ${alloc.qty}` })
          .where(and(eq(batches.id, alloc.batchId), gte(batches.remaining, alloc.qty)));
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
