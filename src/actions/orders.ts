"use server";

import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, and, desc, inArray, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, addresses, vouchers, variants, batches, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { snap } from "@/lib/midtrans";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/order";
import { validateVoucher } from "./vouchers";
import { calcDiscount } from "@/lib/utils/discount";
import { allocateStock } from "@/lib/utils/stockAllocation";
import { logAudit } from "@/lib/audit";

const SERVICE_FEE = 4500;
const PPN_RATE = 0.12;

async function requireCustomer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Silakan login terlebih dahulu");
  return session;
}

export type CreateOrderResult =
  | { ok: true; orderId: string; snapToken: string; midtransOrderId: string }
  | { ok: false; error: string };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const session = await requireCustomer();
  const userId = session.user.id;

  let data: CreateOrderInput;
  try {
    data = createOrderSchema.parse(input);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Input tidak valid" };
  }

  // Ambil alamat & validasi kepemilikan
  const [addr] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, data.addressId), eq(addresses.userId, userId)))
    .limit(1);

  if (!addr) return { ok: false, error: "Alamat tidak ditemukan" };

  // Hitung subtotal
  const subtotal = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // Validasi voucher
  let voucherId: string | null = null;
  let discountAmount = 0;
  if (data.voucherCode) {
    const vResult = await validateVoucher(data.voucherCode, subtotal);
    if (!vResult.ok) return { ok: false, error: vResult.error };
    voucherId = vResult.voucherId;
    discountAmount = calcDiscount(vResult, subtotal);
  }

  const ppn = Math.round((subtotal - discountAmount) * PPN_RATE);
  const totalAmount = subtotal - discountAmount + data.shippingCost + ppn + SERVICE_FEE;

  // Validasi stok & alokasi FIFO/FEFO per item
  const allocationMap: Record<string, { batchId: string; qty: number; hpp: number }[]> = {};
  for (const item of data.items) {
    const [variant] = await db
      .select({ stockMode: variants.stockMode })
      .from(variants)
      .where(eq(variants.id, item.variantId))
      .limit(1);

    if (!variant) return { ok: false, error: `Produk ${item.productName} tidak ditemukan` };

    const batchRows = await db
      .select({
        id: batches.id,
        hpp: batches.hpp,
        remaining: batches.remaining,
        expiredDate: batches.expiredDate,
        receivedAt: batches.receivedAt,
      })
      .from(batches)
      .where(eq(batches.variantId, item.variantId));

    const batchInputs = batchRows.map((b) => ({
      id: b.id,
      hpp: Number(b.hpp),
      remaining: b.remaining,
      expiredDate: b.expiredDate ?? null,
      receivedAt: b.receivedAt,
    }));

    const result = allocateStock(batchInputs, item.quantity, variant.stockMode);
    if (!result.fulfilled) {
      return {
        ok: false,
        error: `Stok ${item.productName} tidak cukup (kurang ${result.shortfall} unit)`,
      };
    }

    // Anti-rugi: tolak bila harga jual di bawah HPP yang akan dikonsumsi
    const avgHpp = result.totalCogs / item.quantity;
    if (item.unitPrice < avgHpp) {
      await logAudit(userId, "PRICE_BELOW_HPP", "order_items", item.variantId, {
        productName: item.productName,
        unitPrice: item.unitPrice,
        avgHpp: Math.round(avgHpp),
      });
      return {
        ok: false,
        error: `Harga jual ${item.productName} (Rp${item.unitPrice.toLocaleString("id")}) di bawah HPP (Rp${Math.round(avgHpp).toLocaleString("id")}). Hubungi admin.`,
      };
    }

    allocationMap[item.variantId] = result.allocations.map((a) => ({
      batchId: a.batchId,
      qty: a.quantity,
      hpp: a.hpp,
    }));
  }

  // Buat order di DB
  const orderId = randomUUID();
  const midtransOrderId = `SI4-${orderId.slice(0, 8).toUpperCase()}`;

  await db.insert(orders).values({
    id: orderId,
    userId,
    status: "pending_payment",
    snapAddress: {
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
    },
    courier: data.courier,
    courierService: data.courierService,
    shippingCost: String(data.shippingCost),
    subtotal: String(subtotal),
    discountAmount: String(discountAmount),
    ppn: String(ppn),
    serviceFee: String(SERVICE_FEE),
    totalAmount: String(totalAmount),
    voucherId,
    midtransOrderId,
  });

  await db.insert(orderItems).values(
    data.items.map((item) => ({
      id: randomUUID(),
      orderId,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      batchAllocations: allocationMap[item.variantId] ?? [],
    })),
  );

  // Increment usedCount voucher — Drizzle tidak punya increment, pakai sql template
  if (voucherId) {
    const { sql: drizzleSql } = await import("drizzle-orm");
    await db
      .update(vouchers)
      .set({ usedCount: drizzleSql`${vouchers.usedCount} + 1` })
      .where(eq(vouchers.id, voucherId));
  }

  // Minta Snap token dari Midtrans
  let snapToken: string;
  try {
    // midtrans-client TS types tidak menyertakan item_details/customer_details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapParams: any = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: totalAmount,
      },
      item_details: [
        ...data.items.map((i) => ({
          id: i.variantId,
          price: i.unitPrice,
          quantity: i.quantity,
          name: i.productName.slice(0, 50),
        })),
        { id: "SHIPPING", price: data.shippingCost, quantity: 1, name: "Ongkos Kirim" },
        { id: "PPN", price: ppn, quantity: 1, name: "PPN 12%" },
        { id: "SERVICE", price: SERVICE_FEE, quantity: 1, name: "Biaya Layanan" },
        ...(discountAmount > 0
          ? [{ id: "DISC", price: -discountAmount, quantity: 1, name: "Diskon Voucher" }]
          : []),
      ],
      customer_details: {
        first_name: addr.name,
        phone: addr.phone,
        shipping_address: {
          first_name: addr.name,
          phone: addr.phone,
          address: addr.address,
          city: addr.city,
          country_code: "IDN",
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapResp = (await snap.createTransaction(snapParams)) as any;
    snapToken = snapResp.token as string;
  } catch (e) {
    // Rollback order bila Midtrans gagal
    await db.delete(orders).where(eq(orders.id, orderId));
    const msg = e instanceof Error ? e.message : "Gagal menghubungi Midtrans";
    return { ok: false, error: `Gagal membuat sesi pembayaran: ${msg}` };
  }

  // Simpan token ke DB
  await db
    .update(orders)
    .set({ midtransToken: snapToken })
    .where(eq(orders.id, orderId));

  return { ok: true, orderId, snapToken, midtransOrderId };
}

export type OrderSummary = {
  id: string;
  midtransOrderId: string | null;
  status: string;
  totalAmount: string;
  createdAt: Date;
  courier: string | null;
  courierService: string | null;
  itemCount: number;
};

export async function getMyOrders(): Promise<OrderSummary[]> {
  const session = await requireCustomer();

  // MariaDB 10.4 tidak support LATERAL JOIN — gunakan query terpisah
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const itemRows = await db
    .select({ orderId: orderItems.orderId })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const countMap: Record<string, number> = {};
  for (const row of itemRows) {
    countMap[row.orderId] = (countMap[row.orderId] ?? 0) + 1;
  }

  return orderRows.map((o) => ({
    id: o.id,
    midtransOrderId: o.midtransOrderId,
    status: o.status,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt,
    courier: o.courier,
    courierService: o.courierService,
    itemCount: countMap[o.id] ?? 0,
  }));
}

export async function getOrderDetail(orderId: string) {
  const session = await requireCustomer();

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

// DB enum values for orders.status
const VALID_ORDER_STATUSES = [
  "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled",
] as const;
type DbOrderStatus = (typeof VALID_ORDER_STATUSES)[number];

export async function adminUpdateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Tidak ada sesi aktif" };
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    return { ok: false, error: "Akses ditolak" };
  }
  if (!(VALID_ORDER_STATUSES as readonly string[]).includes(newStatus)) {
    return { ok: false, error: "Status tidak valid" };
  }
  const dbStatus = newStatus as DbOrderStatus;

  const [prev] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!prev) return { ok: false, error: "Pesanan tidak ditemukan" };

  await db.update(orders).set({ status: dbStatus }).where(eq(orders.id, orderId));

  await logAudit(session.user.id, "ORDER_STATUS_CHANGED", "orders", orderId, {
    from: prev.status,
    to: newStatus,
  });

  return { ok: true };
}

// ─── Admin order list ─────────────────────────────────────────────────────────

export type AdminOrderRow = {
  id: string;
  midtransOrderId: string | null;
  status: DbOrderStatus;
  totalAmount: string;
  subtotal: string;
  discountAmount: string;
  shippingCost: string;
  ppn: string;
  serviceFee: string;
  createdAt: string; // ISO string — safe to pass client→server
  customerName: string;
  customerEmail: string;
  courier: string | null;
  courierService: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  snapAddress: { name: string; phone: string; address: string; city: string };
  itemCount: number;
  firstItemName: string;
};

export async function adminGetOrders(filter?: {
  status?: DbOrderStatus;
  search?: string;
}): Promise<AdminOrderRow[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Tidak ada sesi aktif");
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    throw new Error("Akses ditolak");
  }

  // Build where clause
  const conditions = [];
  if (filter?.status) {
    conditions.push(eq(orders.status, filter.status));
  }
  if (filter?.search) {
    const term = `%${filter.search}%`;
    conditions.push(
      or(
        like(orders.midtransOrderId, term),
        like(orders.id, term),
      ),
    );
  }

  const orderRows = await db
    .select({
      id: orders.id,
      midtransOrderId: orders.midtransOrderId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      subtotal: orders.subtotal,
      discountAmount: orders.discountAmount,
      shippingCost: orders.shippingCost,
      ppn: orders.ppn,
      serviceFee: orders.serviceFee,
      createdAt: orders.createdAt,
      courier: orders.courier,
      courierService: orders.courierService,
      paymentMethod: orders.paymentMethod,
      paidAt: orders.paidAt,
      snapAddress: orders.snapAddress,
      userId: orders.userId,
      // LEFT JOIN user — bisa null jika akun dihapus
      userName: user.name,
      userEmail: user.email,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(500); // hard cap — tambah pagination bila perlu

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);

  // Ambil item count + nama item pertama per order (MariaDB 10.4: no LATERAL JOIN)
  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      productName: orderItems.productName,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const itemMap: Record<string, { count: number; firstName: string }> = {};
  for (const row of itemRows) {
    if (!itemMap[row.orderId]) {
      itemMap[row.orderId] = { count: 0, firstName: row.productName };
    }
    itemMap[row.orderId].count += 1;
  }

  return orderRows.map((o) => ({
    id: o.id,
    midtransOrderId: o.midtransOrderId,
    status: o.status as DbOrderStatus,
    totalAmount: o.totalAmount,
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    shippingCost: o.shippingCost,
    ppn: o.ppn,
    serviceFee: o.serviceFee,
    createdAt: o.createdAt.toISOString(),
    customerName: o.snapAddress?.name ?? o.userName ?? "—",
    customerEmail: o.userEmail ?? "—",
    courier: o.courier,
    courierService: o.courierService,
    paymentMethod: o.paymentMethod,
    paidAt: o.paidAt?.toISOString() ?? null,
    snapAddress: o.snapAddress,
    itemCount: itemMap[o.id]?.count ?? 0,
    firstItemName: itemMap[o.id]?.firstName ?? "—",
  }));
}
