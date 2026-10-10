"use server";

import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, and, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { variants, products, categories, batches, outboundTransactions, outboundItems, ledgerEntries } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { allocateStock, type BatchInput } from "@/lib/utils/stockAllocation";
import {
  calcLineDiscount,
  calcCartTotals,
  calcMarketplaceNet,
  type PosCartItem,
  type MpItem,
  type CustomFee,
} from "@/lib/pos-calc";
import { logAudit } from "@/lib/audit";

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Tidak ada sesi aktif");
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    throw new Error("Akses ditolak: bukan admin");
  }
  return session;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export type PosProduct = {
  id: string;        // variantId
  sku: string;
  barcode: string | null;
  price: number;
  hpp: number;       // rata-rata tertimbang HPP dari batch aktif
  name: string;
  brand: string | null;
  category: string;
  /** Foto kategori dari DB (null = belum ada). */
  categoryImage: string | null;
  stock: number;
  stockMode: "fifo" | "fefo";
};

export async function getPosProducts(): Promise<PosProduct[]> {
  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      barcode: variants.barcode,
      activePrice: variants.activePrice,
      stockMode: variants.stockMode,
      name: products.name,
      brand: products.brand,
      category: categories.name,
      categoryImage: categories.imageUrl,
      stock: sql<number>`COALESCE(SUM(${batches.remaining}), 0)`,
      avgHpp: sql<string>`COALESCE(
        SUM(${batches.hpp} * ${batches.remaining}) / NULLIF(SUM(${batches.remaining}), 0),
        0
      )`,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(batches, and(eq(batches.variantId, variants.id), gt(batches.remaining, 0)))
    .where(and(eq(variants.isActive, true), eq(products.isActive, true)))
    .groupBy(
      variants.id, variants.sku, variants.barcode, variants.activePrice,
      variants.stockMode, products.name, products.brand, categories.name, categories.imageUrl,
    )
    .orderBy(products.name, variants.sku);

  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    barcode: r.barcode,
    price: parseFloat(r.activePrice),
    hpp: parseFloat(r.avgHpp ?? "0"),
    name: r.name,
    brand: r.brand,
    category: r.category ?? "Lainnya",
    categoryImage: r.categoryImage ?? null,
    stock: Number(r.stock),
    stockMode: r.stockMode,
  }));
}

// ─── Transaksi POS Kasir ─────────────────────────────────────────────────────

export type PosTransactionInput = {
  items: Array<{
    variantId: string;
    name: string;
    sku: string;
    price: number;
    qty: number;
    disc: number;
    discType: "pct" | "rp";
  }>;
  cartDisc: number;
  cartDiscType: "pct" | "rp";
  paymentMethod: string;
  cashReceived: number;
};

export async function savePosTransaction(
  input: PosTransactionInput,
): Promise<{ ok: boolean; refNumber: string }> {
  const session = await requireAdmin();

  // Konversi ke PosCartItem untuk kalkulasi (HPP dihitung dari batch)
  const cartForCalc: PosCartItem[] = input.items.map((i) => ({
    id: i.variantId,
    name: i.name,
    sku: i.sku,
    price: i.price,
    hpp: 0, // placeholder — HPP nyata dari batch
    qty: i.qty,
    disc: i.disc,
    discType: i.discType,
  }));

  // Alokasi stok FIFO/FEFO per item
  type ItemAlloc = {
    variantId: string;
    productName: string;
    sku: string;
    qty: number;
    unitPrice: number;
    unitHpp: number;
    itemDiscAmount: number;
    allocations: Array<{ batchId: string; qty: number; hpp: number }>;
    totalCogs: number;
  };
  const itemAllocations: ItemAlloc[] = [];

  for (const item of input.items) {
    const variantRow = await db
      .select({ stockMode: variants.stockMode })
      .from(variants)
      .where(eq(variants.id, item.variantId))
      .limit(1);
    if (!variantRow[0]) throw new Error(`Varian tidak ditemukan: ${item.variantId}`);

    const batchRows = await db
      .select({
        id: batches.id,
        hpp: batches.hpp,
        remaining: batches.remaining,
        expiredDate: batches.expiredDate,
        receivedAt: batches.receivedAt,
      })
      .from(batches)
      .where(and(eq(batches.variantId, item.variantId), gt(batches.remaining, 0)));

    const batchInputs: BatchInput[] = batchRows.map((b) => ({
      id: b.id,
      hpp: parseFloat(b.hpp),
      remaining: b.remaining,
      expiredDate: b.expiredDate,
      receivedAt: b.receivedAt,
    }));

    const result = allocateStock(batchInputs, item.qty, variantRow[0].stockMode);
    if (!result.fulfilled) {
      throw new Error(`Stok tidak cukup: ${item.name} (kurang ${result.shortfall} unit)`);
    }

    const cartItem: PosCartItem = {
      id: item.variantId, name: item.name, sku: item.sku,
      price: item.price, hpp: 0, qty: item.qty,
      disc: item.disc, discType: item.discType,
    };
    const itemDisc = calcLineDiscount(cartItem);
    const avgHpp = result.totalCogs / item.qty;

    // Anti-rugi: tolak transaksi bila harga jual di bawah HPP yang dikonsumsi
    if (item.price < avgHpp) {
      await logAudit(session.user.id, "PRICE_BELOW_HPP", "variants", item.variantId, {
        productName: item.name, price: item.price, hpp: Math.round(avgHpp),
      });
      throw new Error(
        `Anti-rugi: harga ${item.name} (Rp${item.price.toLocaleString("id")}) di bawah HPP (Rp${Math.round(avgHpp).toLocaleString("id")}). Sesuaikan harga atau hubungi supervisor.`,
      );
    }

    itemAllocations.push({
      variantId: item.variantId,
      productName: item.name,
      sku: item.sku,
      qty: item.qty,
      unitPrice: item.price,
      unitHpp: avgHpp,
      itemDiscAmount: itemDisc,
      allocations: result.allocations.map((a) => ({ batchId: a.batchId, qty: a.quantity, hpp: a.hpp })),
      totalCogs: result.totalCogs,
    });
    cartForCalc.find((c) => c.id === item.variantId)!.hpp = avgHpp;
  }

  const totals = calcCartTotals(cartForCalc, input.cartDisc, input.cartDiscType, input.paymentMethod);
  const totalHpp = itemAllocations.reduce((s, i) => s + i.totalCogs, 0);
  const txId = randomUUID();
  const refNumber = `POS-${String(Date.now()).slice(-6)}`;
  const today = new Date().toISOString().split("T")[0];

  await db.insert(outboundTransactions).values({
    id: txId,
    channel: "pos",
    refNumber,
    paymentMethod: input.paymentMethod,
    cashReceived: input.cashReceived > 0 ? String(input.cashReceived) : null,
    subtotal: String(totals.gross),
    itemDiscountTotal: String(totals.itemDiscTotal),
    cartDiscountAmount: String(totals.cartDiscValue),
    totalDiscount: String(totals.totalDisc),
    dpp: String(totals.dpp),
    ppn: String(totals.ppn),
    mdrAmount: String(totals.mdrAmount),
    totalAmount: String(totals.total),
    netAmount: String(totals.netAmount),
    totalHpp: String(totalHpp),
    status: "completed",
    createdBy: session.user.id,
  });

  for (const item of itemAllocations) {
    await db.insert(outboundItems).values({
      id: randomUUID(),
      transactionId: txId,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.qty,
      unitPrice: String(item.unitPrice),
      unitHpp: String(item.unitHpp),
      itemDiscountAmount: String(item.itemDiscAmount),
      batchAllocations: item.allocations,
    });

    for (const alloc of item.allocations) {
      await db
        .update(batches)
        .set({ remaining: sql`${batches.remaining} - ${alloc.qty}` })
        .where(eq(batches.id, alloc.batchId));
    }
  }

  await db.insert(ledgerEntries).values({
    id: randomUUID(),
    entryDate: today,
    channel: "pos",
    referenceId: txId,
    refNumber,
    totalSales: String(totals.netAmount),
    totalHpp: String(totalHpp),
    grossMargin: String(totals.grossMargin),
  });

  return { ok: true, refNumber };
}

// ─── Transaksi Marketplace (Pending Settlement) ───────────────────────────────

export type MarketplaceTransactionInput = {
  platform: string;
  platformOrderId: string;
  customerName: string;
  items: Array<{ variantId: string; name: string; sku: string; price: number; qty: number }>;
  komisiPlatform: number;
  mdrPersen: number;
  biayaLayanan: number;
  ongkirDiterima: number;
  subsidiOngkir: number;
  ongkirKurir: number;
  voucherPlatform: number;
  customFees: CustomFee[];
};

export async function saveMarketplaceTransaction(
  input: MarketplaceTransactionInput,
): Promise<{ ok: boolean; refNumber: string }> {
  const session = await requireAdmin();

  // Alokasi stok (booking)
  type MpItemAlloc = {
    variantId: string; productName: string; sku: string;
    qty: number; unitPrice: number; unitHpp: number;
    allocations: Array<{ batchId: string; qty: number; hpp: number }>;
    totalCogs: number;
  };
  const itemAllocations: MpItemAlloc[] = [];

  for (const item of input.items) {
    const variantRow = await db
      .select({ stockMode: variants.stockMode })
      .from(variants)
      .where(eq(variants.id, item.variantId))
      .limit(1);
    if (!variantRow[0]) throw new Error(`Varian tidak ditemukan: ${item.variantId}`);

    const batchRows = await db
      .select({ id: batches.id, hpp: batches.hpp, remaining: batches.remaining, expiredDate: batches.expiredDate, receivedAt: batches.receivedAt })
      .from(batches)
      .where(and(eq(batches.variantId, item.variantId), gt(batches.remaining, 0)));

    const batchInputs: BatchInput[] = batchRows.map((b) => ({
      id: b.id, hpp: parseFloat(b.hpp), remaining: b.remaining,
      expiredDate: b.expiredDate, receivedAt: b.receivedAt,
    }));

    const result = allocateStock(batchInputs, item.qty, variantRow[0].stockMode);
    if (!result.fulfilled) throw new Error(`Stok tidak cukup: ${item.name} (kurang ${result.shortfall} unit)`);

    itemAllocations.push({
      variantId: item.variantId, productName: item.name, sku: item.sku,
      qty: item.qty, unitPrice: item.price,
      unitHpp: result.totalCogs / item.qty,
      allocations: result.allocations.map((a) => ({ batchId: a.batchId, qty: a.quantity, hpp: a.hpp })),
      totalCogs: result.totalCogs,
    });
  }

  const mpItems: MpItem[] = itemAllocations.map((i) => ({
    id: i.variantId, name: i.productName, sku: i.sku,
    qty: i.qty, price: i.unitPrice, hpp: i.unitHpp,
  }));

  const calc = calcMarketplaceNet(mpItems, {
    komisiPlatform: input.komisiPlatform,
    mdrPersen: input.mdrPersen,
    biayaLayanan: input.biayaLayanan,
    ongkirDiterima: input.ongkirDiterima,
    subsidiOngkir: input.subsidiOngkir,
    ongkirKurir: input.ongkirKurir,
    voucherPlatform: input.voucherPlatform,
    customFees: input.customFees,
  });

  const totalHpp = itemAllocations.reduce((s, i) => s + i.totalCogs, 0);
  const txId = randomUUID();
  const refNumber = `MP-${input.platform.toUpperCase().slice(0, 3)}-${String(Date.now()).slice(-6)}`;

  await db.insert(outboundTransactions).values({
    id: txId,
    channel: "marketplace",
    refNumber,
    platform: input.platform,
    platformOrderId: input.platformOrderId,
    customerName: input.customerName,
    subtotal: String(calc.nilaiBarang),
    itemDiscountTotal: "0",
    cartDiscountAmount: "0",
    totalDiscount: "0",
    dpp: String(calc.nilaiBarang),
    ppn: "0",
    mdrAmount: String(calc.mdrNominal),
    totalAmount: String(calc.nilaiBarang),
    netAmount: String(calc.netDiterima),
    totalHpp: String(totalHpp),
    marketplaceFees: {
      platformFee: calc.komisiNominal,
      mdrAmount: calc.mdrNominal,
      serviceFee: input.biayaLayanan,
      shippingReceived: input.ongkirDiterima,
      shippingSubsidy: input.subsidiOngkir,
      shippingPaid: input.ongkirKurir,
      voucherPlatform: input.voucherPlatform,
      customFees: calc.customFeeRows.map((f) => ({
        name: f.name, kind: f.kind, value: f.value, sign: f.sign, nominal: f.nominal,
      })),
    },
    status: "pending_settlement",
    createdBy: session.user.id,
  });

  for (const item of itemAllocations) {
    await db.insert(outboundItems).values({
      id: randomUUID(),
      transactionId: txId,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.qty,
      unitPrice: String(item.unitPrice),
      unitHpp: String(item.unitHpp),
      itemDiscountAmount: "0",
      batchAllocations: item.allocations,
    });

    for (const alloc of item.allocations) {
      await db
        .update(batches)
        .set({ remaining: sql`${batches.remaining} - ${alloc.qty}` })
        .where(eq(batches.id, alloc.batchId));
    }
  }

  return { ok: true, refNumber };
}
