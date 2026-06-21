/**
 * Demo operational seeder — data transaksi historis untuk kontrol panel admin.
 * Jalankan: npm run db:seed:demo
 *
 * Prasyarat: npm run db:seed harus dijalankan lebih dulu.
 * Idempotent: skip jika ID sudah ada.
 */
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "./index";
import {
  addresses,
  orders,
  orderItems,
  outboundTransactions,
  outboundItems,
  ledgerEntries,
  vouchers,
} from "./schema";
import { user, account } from "./auth-schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return randomUUID(); }

function dAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dec(n: number): string { return n.toFixed(2); }

// ─── Fixed IDs (dari seed.ts) ─────────────────────────────────────────────────

const ADMIN = "admin-0000-0000-0000-000000000001";

const VAR = {
  tensimeter:  "33000000-0000-0000-0000-000000000001",
  nebulizer:   "33000000-0000-0000-0000-000000000003",
  oximeter:    "33000000-0000-0000-0000-000000000004",
  wheelchair:  "33000000-0000-0000-0000-000000000005",
  masker3ply:  "33000000-0000-0000-0000-000000000006",
  maskerN95:   "33000000-0000-0000-0000-000000000007",
  termometer:  "33000000-0000-0000-0000-000000000008",
  stetoskop:   "33000000-0000-0000-0000-000000000009",
};

const CUST = {
  budi:   "44444444-0000-0000-0000-000000000001",
  siti:   "44444444-0000-0000-0000-000000000002",
  hendra: "44444444-0000-0000-0000-000000000003",
};

const ADDR = {
  budi:   "55555555-0000-0000-0000-000000000001",
  siti:   "55555555-0000-0000-0000-000000000002",
  hendra: "55555555-0000-0000-0000-000000000003",
};

const ORD = {
  o1: "66666666-0000-0000-0000-000000000001", // paid
  o2: "66666666-0000-0000-0000-000000000002", // processing
  o3: "66666666-0000-0000-0000-000000000003", // shipped
  o4: "66666666-0000-0000-0000-000000000004", // delivered
  o5: "66666666-0000-0000-0000-000000000005", // cancelled
  o6: "66666666-0000-0000-0000-000000000006", // pending_payment
};

const POSTX = {
  p1: "77777777-0000-0000-0000-000000000001",
  p2: "77777777-0000-0000-0000-000000000002",
  p3: "77777777-0000-0000-0000-000000000003",
  p4: "77777777-0000-0000-0000-000000000004",
  p5: "77777777-0000-0000-0000-000000000005",
};

const MPTX = {
  m1: "88888888-0000-0000-0000-000000000001",
  m2: "88888888-0000-0000-0000-000000000002",
  m3: "88888888-0000-0000-0000-000000000003",
};

// ─── Upsert helpers ────────────────────────────────────────────────────────────

async function upsertCustomer(id: string, name: string, email: string, password: string) {
  const ex = await db.select({ id: user.id }).from(user).where(eq(user.id, id));
  if (ex.length > 0) { console.log(`  · Customer ${email} — skip`); return; }
  const hashed = await hashPassword(password);
  await db.insert(user).values({ id, name, email, emailVerified: true, role: "user" });
  await db.insert(account).values({
    id: uid(), accountId: id, providerId: "credential", userId: id, password: hashed,
  });
  console.log(`  ✓ Customer: ${email}`);
}

async function upsertAddress(
  id: string, userId: string, label: string,
  name: string, phone: string, address: string, city: string,
) {
  const ex = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.id, id));
  if (ex.length > 0) return;
  await db.insert(addresses).values({ id, userId, label, name, phone, address, city, isPrimary: true });
  console.log(`  ✓ Alamat: ${label} (${name})`);
}

type OrdItem = { variantId: string; productName: string; sku: string; quantity: number; unitPrice: number; };

async function upsertOrder(
  id: string,
  data: {
    userId: string;
    status: "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
    snapAddress: { name: string; phone: string; address: string; city: string };
    courier?: string; courierService?: string;
    shippingCost: number;
    subtotal: number;
    discountAmount?: number;
    totalAmount: number;
    voucherId?: string | null;
    midtransOrderId?: string;
    paymentMethod?: string;
    paidAt?: Date;
    createdAt: Date;
  },
  items: OrdItem[],
) {
  const ex = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id));
  if (ex.length > 0) { console.log(`  · Order ..${id.slice(-4)} — skip`); return; }

  await db.insert(orders).values({
    id,
    userId: data.userId,
    status: data.status,
    snapAddress: data.snapAddress,
    courier: data.courier ?? null,
    courierService: data.courierService ?? null,
    shippingCost: dec(data.shippingCost),
    subtotal: dec(data.subtotal),
    discountAmount: dec(data.discountAmount ?? 0),
    ppn: "0.00",
    serviceFee: "4500.00",
    totalAmount: dec(data.totalAmount),
    voucherId: data.voucherId ?? null,
    midtransOrderId: data.midtransOrderId ?? null,
    paymentMethod: data.paymentMethod ?? null,
    paidAt: data.paidAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.createdAt,
  });

  for (const item of items) {
    await db.insert(orderItems).values({
      id: uid(),
      orderId: id,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: dec(item.unitPrice),
      batchAllocations: [],
    });
  }

  console.log(`  ✓ Order [${data.status}]: ..${id.slice(-4)}`);
}

async function upsertWebLedger(
  orderId: string, refNumber: string,
  totalSales: number, totalHpp: number, createdAt: Date,
) {
  const ex = await db.select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.referenceId, orderId));
  if (ex.length > 0) return;
  await db.insert(ledgerEntries).values({
    id: uid(),
    entryDate: toDateStr(createdAt),
    channel: "web",
    referenceId: orderId,
    refNumber,
    totalSales: dec(totalSales),
    totalHpp: dec(totalHpp),
    grossMargin: dec(totalSales - totalHpp),
    createdAt,
  });
}

type PosItem = { variantId: string; productName: string; sku: string; qty: number; unitPrice: number; unitHpp: number; };

async function upsertPosTx(
  id: string,
  refNumber: string,
  data: {
    paymentMethod: string;
    cashReceived?: number;
    customerName?: string;
    subtotal: number;
    dpp: number;
    ppn: number;
    mdrAmount: number;
    totalAmount: number;
    netAmount: number;
    totalHpp: number;
    createdAt: Date;
  },
  items: PosItem[],
) {
  const ex = await db.select({ id: outboundTransactions.id })
    .from(outboundTransactions)
    .where(eq(outboundTransactions.id, id));
  if (ex.length > 0) { console.log(`  · POS ${refNumber} — skip`); return; }

  await db.insert(outboundTransactions).values({
    id,
    channel: "pos",
    refNumber,
    paymentMethod: data.paymentMethod,
    cashReceived: data.cashReceived != null ? dec(data.cashReceived) : null,
    customerName: data.customerName ?? null,
    subtotal: dec(data.subtotal),
    itemDiscountTotal: "0.00",
    cartDiscountAmount: "0.00",
    totalDiscount: "0.00",
    dpp: dec(data.dpp),
    ppn: dec(data.ppn),
    mdrAmount: dec(data.mdrAmount),
    totalAmount: dec(data.totalAmount),
    netAmount: dec(data.netAmount),
    totalHpp: dec(data.totalHpp),
    status: "completed",
    createdBy: ADMIN,
    createdAt: data.createdAt,
  });

  for (const item of items) {
    await db.insert(outboundItems).values({
      id: uid(),
      transactionId: id,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.qty,
      unitPrice: dec(item.unitPrice),
      unitHpp: dec(item.unitHpp),
      itemDiscountAmount: "0.00",
      batchAllocations: [],
    });
  }

  await db.insert(ledgerEntries).values({
    id: uid(),
    entryDate: toDateStr(data.createdAt),
    channel: "pos",
    referenceId: id,
    refNumber,
    totalSales: dec(data.netAmount),
    totalHpp: dec(data.totalHpp),
    grossMargin: dec(data.netAmount - data.totalHpp),
    createdAt: data.createdAt,
  });

  console.log(`  ✓ POS: ${refNumber} — Rp ${data.totalAmount.toLocaleString("id-ID")} (${data.paymentMethod})`);
}

type MpItem = { variantId: string; productName: string; sku: string; qty: number; unitPrice: number; unitHpp: number; };

type MpFees = {
  platformFee: number;
  mdrAmount: number;
  serviceFee: number;
  shippingReceived: number;
  shippingSubsidy: number;
  shippingPaid: number;
  voucherPlatform: number;
  customFees: Array<{ name: string; kind: "pct" | "rp"; value: number; sign: "minus" | "plus"; nominal: number }>;
};

function mpFees(partial: { platformFee?: number; mdrAmount?: number; serviceFee?: number; shippingSubsidy?: number; shippingPaid?: number }): MpFees {
  return {
    platformFee:     partial.platformFee  ?? 0,
    mdrAmount:       partial.mdrAmount    ?? 0,
    serviceFee:      partial.serviceFee   ?? 0,
    shippingReceived: 0,
    shippingSubsidy: partial.shippingSubsidy ?? 0,
    shippingPaid:    partial.shippingPaid ?? 0,
    voucherPlatform: 0,
    customFees:      [],
  };
}

async function upsertMpTx(
  id: string,
  refNumber: string,
  data: {
    platform: string;
    platformOrderId?: string;
    customerName?: string;
    subtotal: number;
    totalAmount: number;
    netAmount: number;
    totalHpp: number;
    marketplaceFees: MpFees;
    status: "pending_settlement" | "completed";
    settledAt?: Date;
    createdAt: Date;
  },
  items: MpItem[],
) {
  const ex = await db.select({ id: outboundTransactions.id })
    .from(outboundTransactions)
    .where(eq(outboundTransactions.id, id));
  if (ex.length > 0) { console.log(`  · MP ${refNumber} — skip`); return; }

  await db.insert(outboundTransactions).values({
    id,
    channel: "marketplace",
    refNumber,
    platform: data.platform,
    platformOrderId: data.platformOrderId ?? null,
    customerName: data.customerName ?? null,
    subtotal: dec(data.subtotal),
    itemDiscountTotal: "0.00",
    cartDiscountAmount: "0.00",
    totalDiscount: "0.00",
    dpp: "0.00",
    ppn: "0.00",
    mdrAmount: "0.00",
    totalAmount: dec(data.totalAmount),
    netAmount: dec(data.netAmount),
    totalHpp: dec(data.totalHpp),
    marketplaceFees: data.marketplaceFees,
    status: data.status,
    settledAt: data.settledAt ?? null,
    createdBy: ADMIN,
    createdAt: data.createdAt,
  });

  for (const item of items) {
    await db.insert(outboundItems).values({
      id: uid(),
      transactionId: id,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.qty,
      unitPrice: dec(item.unitPrice),
      unitHpp: dec(item.unitHpp),
      itemDiscountAmount: "0.00",
      batchAllocations: [],
    });
  }

  if (data.status === "completed") {
    await db.insert(ledgerEntries).values({
      id: uid(),
      entryDate: toDateStr(data.createdAt),
      channel: "marketplace",
      referenceId: id,
      refNumber,
      totalSales: dec(data.netAmount),
      totalHpp: dec(data.totalHpp),
      grossMargin: dec(data.netAmount - data.totalHpp),
      createdAt: data.createdAt,
    });
  }

  console.log(`  ✓ MP: ${refNumber} [${data.status}] — ${data.platform} Rp ${data.totalAmount.toLocaleString("id-ID")}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 Seeding data demo operasional...\n");

  // ── Customer accounts ─────────────────────────────────────────────────────
  console.log("👤 Customers:");
  await upsertCustomer(CUST.budi,   "Budi Santoso",  "budi@example.com",   "Customer1234!");
  await upsertCustomer(CUST.siti,   "Siti Rahayu",   "siti@example.com",   "Customer1234!");
  await upsertCustomer(CUST.hendra, "Hendra Wijaya", "hendra@example.com", "Customer1234!");

  // ── Alamat pengiriman ─────────────────────────────────────────────────────
  console.log("\n🏠 Alamat:");
  await upsertAddress(ADDR.budi, CUST.budi, "Rumah",
    "Budi Santoso", "081234567001",
    "Jl. Mawar No. 12, RT 03/RW 05, Kel. Menteng", "Jakarta Pusat");
  await upsertAddress(ADDR.siti, CUST.siti, "Rumah",
    "Siti Rahayu", "081234567002",
    "Jl. Melati No. 7, RT 01/RW 02, Kel. Kebayoran", "Jakarta Selatan");
  await upsertAddress(ADDR.hendra, CUST.hendra, "Kantor",
    "Hendra Wijaya", "081234567003",
    "Jl. Sudirman No. 88, Lt. 5, Gedung Artha", "Jakarta Pusat");

  // ── Cari ID voucher ────────────────────────────────────────────────────────
  const vSehat10 = await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, "SEHAT10"));
  const vDiskon20 = await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, "DISKON20RB"));
  const vidSehat10  = vSehat10[0]?.id  ?? null;
  const vidDiskon20 = vDiskon20[0]?.id ?? null;

  // ── Snapshot alamat untuk order ───────────────────────────────────────────
  const snapBudi   = { name: "Budi Santoso",  phone: "081234567001", address: "Jl. Mawar No. 12, RT 03/RW 05, Kel. Menteng",       city: "Jakarta Pusat"   };
  const snapSiti   = { name: "Siti Rahayu",   phone: "081234567002", address: "Jl. Melati No. 7, RT 01/RW 02, Kel. Kebayoran",     city: "Jakarta Selatan" };
  const snapHendra = { name: "Hendra Wijaya", phone: "081234567003", address: "Jl. Sudirman No. 88, Lt. 5, Gedung Artha",          city: "Jakarta Pusat"   };

  // ── Web Orders ─────────────────────────────────────────────────────────────
  console.log("\n🛒 Web Orders:");

  // O1: paid — Budi — Tensimeter + Masker 3Ply x2 — SEHAT10
  // subtotal=590k, disc=50k, ongkir=15k, serviceFee=4.5k → total=559.5k
  await upsertOrder(ORD.o1, {
    userId: CUST.budi, status: "paid", snapAddress: snapBudi,
    courier: "jne", courierService: "REG",
    shippingCost: 15000, subtotal: 590000, discountAmount: 50000, totalAmount: 559500,
    voucherId: vidSehat10,
    midtransOrderId: "DEMO-SI4-20260613-001",
    paymentMethod: "bank_transfer", paidAt: dAgo(8), createdAt: dAgo(8),
  }, [
    { variantId: VAR.tensimeter, productName: "Tensimeter Digital Omron HEM-7120", sku: "OMR-HEM7120-STD", quantity: 1, unitPrice: 540000 },
    { variantId: VAR.masker3ply, productName: "Masker Medis 3-Ply OneMed (Box 50)", sku: "OM-MSK3PLY-50",  quantity: 2, unitPrice: 25000  },
  ]);
  await upsertWebLedger(ORD.o1, "SI4-WEB-001", 559500, 456000, dAgo(8)); // hpp: 420k+36k

  // O2: processing — Siti — Masker N95 x2 + Termometer
  // subtotal=340k, ongkir=18k, serviceFee=4.5k → total=362.5k
  await upsertOrder(ORD.o2, {
    userId: CUST.siti, status: "processing", snapAddress: snapSiti,
    courier: "jnt", courierService: "Regular",
    shippingCost: 18000, subtotal: 340000, totalAmount: 362500,
    midtransOrderId: "DEMO-SI4-20260615-002",
    paymentMethod: "gopay", paidAt: dAgo(6), createdAt: dAgo(6),
  }, [
    { variantId: VAR.maskerN95,  productName: "Masker N95 GEA Medical (isi 20)",    sku: "GEA-N95-20",    quantity: 2, unitPrice: 95000  },
    { variantId: VAR.termometer, productName: "Termometer Tembak Infrared OneMed",  sku: "OM-THERMO-IR",  quantity: 1, unitPrice: 150000 },
  ]);
  await upsertWebLedger(ORD.o2, "SI4-WEB-002", 362500, 240000, dAgo(6)); // hpp: 140k+100k

  // O3: shipped — Hendra — Kursi Roda
  // subtotal=1.25jt, ongkir=45k, serviceFee=4.5k → total=1.2995jt
  await upsertOrder(ORD.o3, {
    userId: CUST.hendra, status: "shipped", snapAddress: snapHendra,
    courier: "sicepat", courierService: "BEST",
    shippingCost: 45000, subtotal: 1250000, totalAmount: 1299500,
    midtransOrderId: "DEMO-SI4-20260616-003",
    paymentMethod: "credit_card", paidAt: dAgo(5), createdAt: dAgo(5),
  }, [
    { variantId: VAR.wheelchair, productName: "Kursi Roda Lipat Standar Sella", sku: "SEL-WC-STD", quantity: 1, unitPrice: 1250000 },
  ]);
  await upsertWebLedger(ORD.o3, "SI4-WEB-003", 1299500, 950000, dAgo(5));

  // O4: delivered — Budi — Nebulizer — DISKON20RB
  // subtotal=620k, disc=20k, ongkir=25k, serviceFee=4.5k → total=629.5k
  await upsertOrder(ORD.o4, {
    userId: CUST.budi, status: "delivered", snapAddress: snapBudi,
    courier: "jne", courierService: "OKE",
    shippingCost: 25000, subtotal: 620000, discountAmount: 20000, totalAmount: 629500,
    voucherId: vidDiskon20,
    midtransOrderId: "DEMO-SI4-20260609-004",
    paymentMethod: "bank_transfer", paidAt: dAgo(12), createdAt: dAgo(12),
  }, [
    { variantId: VAR.nebulizer, productName: "Nebulizer Kompresor Omron NE-C28", sku: "OMR-NEC28", quantity: 1, unitPrice: 620000 },
  ]);
  await upsertWebLedger(ORD.o4, "SI4-WEB-004", 629500, 480000, dAgo(12));

  // O5: cancelled — Siti — Stetoskop (tanpa pembayaran)
  await upsertOrder(ORD.o5, {
    userId: CUST.siti, status: "cancelled", snapAddress: snapSiti,
    courier: "jne", courierService: "REG",
    shippingCost: 12000, subtotal: 165000, totalAmount: 181500,
    createdAt: dAgo(3),
  }, [
    { variantId: VAR.stetoskop, productName: "Stetoskop Dual Head GEA Medical", sku: "GEA-STETO-DH", quantity: 1, unitPrice: 165000 },
  ]);

  // O6: pending_payment — Hendra — Oximeter x2 + Masker
  // subtotal=375k, ongkir=20k, serviceFee=4.5k → total=399.5k
  await upsertOrder(ORD.o6, {
    userId: CUST.hendra, status: "pending_payment", snapAddress: snapHendra,
    courier: "jne", courierService: "REG",
    shippingCost: 20000, subtotal: 375000, totalAmount: 399500,
    midtransOrderId: "DEMO-SI4-20260620-006",
    createdAt: dAgo(1),
  }, [
    { variantId: VAR.oximeter,  productName: "Pulse Oximeter Fingertip Yuwell",   sku: "YUW-OXI-FT",   quantity: 2, unitPrice: 175000 },
    { variantId: VAR.masker3ply, productName: "Masker Medis 3-Ply OneMed (Box 50)", sku: "OM-MSK3PLY-50", quantity: 1, unitPrice: 25000  },
  ]);

  // ── POS Transactions ──────────────────────────────────────────────────────
  console.log("\n🏪 POS Transactions:");

  // P1: tunai (5 hari lalu) — Tensimeter x1 + Masker 3Ply x3
  // gross=615k, dpp=615k, ppn=73.8k, total=688.8k, mdr=0
  await upsertPosTx(POSTX.p1, "POS-001001", {
    paymentMethod: "tunai", cashReceived: 700000, customerName: "Bpk. Rahmat",
    subtotal: 615000, dpp: 615000, ppn: 73800,
    mdrAmount: 0, totalAmount: 688800, netAmount: 688800, totalHpp: 474000,
    createdAt: dAgo(5),
  }, [
    { variantId: VAR.tensimeter, productName: "Tensimeter Digital Omron HEM-7120", sku: "OMR-HEM7120-STD", qty: 1, unitPrice: 540000, unitHpp: 420000 },
    { variantId: VAR.masker3ply, productName: "Masker Medis 3-Ply OneMed (Box 50)", sku: "OM-MSK3PLY-50",  qty: 3, unitPrice: 25000,  unitHpp: 18000  },
  ]);

  // P2: qris (4 hari lalu) — Oximeter x2
  // gross=350k, ppn=42k, total=392k, mdr=2744, net=389256
  await upsertPosTx(POSTX.p2, "POS-001002", {
    paymentMethod: "qris", customerName: "Ibu Dewi",
    subtotal: 350000, dpp: 350000, ppn: 42000,
    mdrAmount: 2744, totalAmount: 392000, netAmount: 389256, totalHpp: 240000,
    createdAt: dAgo(4),
  }, [
    { variantId: VAR.oximeter, productName: "Pulse Oximeter Fingertip Yuwell", sku: "YUW-OXI-FT", qty: 2, unitPrice: 175000, unitHpp: 120000 },
  ]);

  // P3: kartu_kredit (3 hari lalu) — Stetoskop + Termometer
  // gross=315k, ppn=37.8k, total=352.8k, mdr=8820, net=343980
  await upsertPosTx(POSTX.p3, "POS-001003", {
    paymentMethod: "kartu_kredit", customerName: "Dr. Agus",
    subtotal: 315000, dpp: 315000, ppn: 37800,
    mdrAmount: 8820, totalAmount: 352800, netAmount: 343980, totalHpp: 220000,
    createdAt: dAgo(3),
  }, [
    { variantId: VAR.stetoskop,  productName: "Stetoskop Dual Head GEA Medical",  sku: "GEA-STETO-DH", qty: 1, unitPrice: 165000, unitHpp: 120000 },
    { variantId: VAR.termometer, productName: "Termometer Tembak Infrared OneMed", sku: "OM-THERMO-IR", qty: 1, unitPrice: 150000, unitHpp: 100000 },
  ]);

  // P4: transfer (2 hari lalu) — Masker N95 x3 + Oximeter (klinik)
  // gross=460k, ppn=55.2k, total=515.2k, mdr=0
  await upsertPosTx(POSTX.p4, "POS-001004", {
    paymentMethod: "transfer", customerName: "Klinik Sehat Bersama",
    subtotal: 460000, dpp: 460000, ppn: 55200,
    mdrAmount: 0, totalAmount: 515200, netAmount: 515200, totalHpp: 330000,
    createdAt: dAgo(2),
  }, [
    { variantId: VAR.maskerN95, productName: "Masker N95 GEA Medical (isi 20)",  sku: "GEA-N95-20",  qty: 3, unitPrice: 95000,  unitHpp: 70000  },
    { variantId: VAR.oximeter,  productName: "Pulse Oximeter Fingertip Yuwell",  sku: "YUW-OXI-FT",  qty: 1, unitPrice: 175000, unitHpp: 120000 },
  ]);

  // P5: kartu_debit (kemarin) — Nebulizer + Masker 3Ply x2
  // gross=670k, ppn=80.4k, total=750.4k, mdr=7504, net=742896
  await upsertPosTx(POSTX.p5, "POS-001005", {
    paymentMethod: "kartu_debit", customerName: "Bpk. Sudirman",
    subtotal: 670000, dpp: 670000, ppn: 80400,
    mdrAmount: 7504, totalAmount: 750400, netAmount: 742896, totalHpp: 516000,
    createdAt: dAgo(1),
  }, [
    { variantId: VAR.nebulizer,  productName: "Nebulizer Kompresor Omron NE-C28",  sku: "OMR-NEC28",    qty: 1, unitPrice: 620000, unitHpp: 480000 },
    { variantId: VAR.masker3ply, productName: "Masker Medis 3-Ply OneMed (Box 50)", sku: "OM-MSK3PLY-50", qty: 2, unitPrice: 25000,  unitHpp: 18000  },
  ]);

  // ── Marketplace Transactions ───────────────────────────────────────────────
  console.log("\n🛍️  Marketplace Transactions:");

  // M1: Tokopedia — Tensimeter x2 — pending_settlement (7 hari lalu)
  // subtotal=1.12jt, komisi 1.8%=20160, mdr 0.7%=7840, svc=1000 → net=1.091jt
  await upsertMpTx(MPTX.m1, "MP-TOK-001001", {
    platform: "tokopedia",
    platformOrderId: "INV/20260614/MPL/01234567890",
    customerName: "Pembeli Tokopedia #1",
    subtotal: 1120000, totalAmount: 1120000, netAmount: 1091000, totalHpp: 840000,
    marketplaceFees: mpFees({ platformFee: 20160, mdrAmount: 7840, serviceFee: 1000 }),
    status: "pending_settlement",
    createdAt: dAgo(7),
  }, [
    { variantId: VAR.tensimeter, productName: "Tensimeter Digital Omron HEM-7120", sku: "OMR-HEM7120-STD", qty: 2, unitPrice: 560000, unitHpp: 420000 },
  ]);

  // M2: Shopee — Masker 3Ply x10 + Kursi Roda — pending_settlement (6 hari lalu)
  // subtotal=1.57jt, komisi 2.2%=34540, mdr 0.7%=10990, svc=1000,
  // subsidiOngkir=+15000, ongkirKurir=-20000 → net=1.518470jt
  await upsertMpTx(MPTX.m2, "MP-SHP-001001", {
    platform: "shopee",
    platformOrderId: "250614XXXXXXXXXXX",
    customerName: "Pembeli Shopee #1",
    subtotal: 1570000, totalAmount: 1570000, netAmount: 1518470, totalHpp: 1130000,
    marketplaceFees: mpFees({ platformFee: 34540, mdrAmount: 10990, serviceFee: 1000, shippingSubsidy: 15000, shippingPaid: 20000 }),
    status: "pending_settlement",
    createdAt: dAgo(6),
  }, [
    { variantId: VAR.masker3ply, productName: "Masker Medis 3-Ply OneMed (Box 50)", sku: "OM-MSK3PLY-50", qty: 10, unitPrice: 27000,   unitHpp: 18000  },
    { variantId: VAR.wheelchair,  productName: "Kursi Roda Lipat Standar Sella",     sku: "SEL-WC-STD",    qty: 1,  unitPrice: 1300000, unitHpp: 950000 },
  ]);

  // M3: Tokopedia — Nebulizer — completed/settled (10 hari lalu) → ledger entry dibuat
  // subtotal=645k, komisi 1.8%=11610, mdr 0.7%=4515, svc=1000 → net=627875
  await upsertMpTx(MPTX.m3, "MP-TOK-001002", {
    platform: "tokopedia",
    platformOrderId: "INV/20260611/MPL/09876543210",
    customerName: "Pembeli Tokopedia #2",
    subtotal: 645000, totalAmount: 645000, netAmount: 627875, totalHpp: 480000,
    marketplaceFees: mpFees({ platformFee: 11610, mdrAmount: 4515, serviceFee: 1000 }),
    status: "completed",
    settledAt: dAgo(8),
    createdAt: dAgo(10),
  }, [
    { variantId: VAR.nebulizer, productName: "Nebulizer Kompresor Omron NE-C28", sku: "OMR-NEC28", qty: 1, unitPrice: 645000, unitHpp: 480000 },
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n✅ Demo seeding selesai!\n");
  console.log("Ringkasan:");
  console.log("  • 3 customer  (budi@example.com, siti@example.com, hendra@example.com) — password: Customer1234!");
  console.log("  • 3 alamat pengiriman");
  console.log("  • 6 web orders   (paid · processing · shipped · delivered · cancelled · pending)");
  console.log("  • 5 transaksi POS (tunai · qris · kartu_kredit · transfer · kartu_debit)");
  console.log("  • 3 transaksi marketplace (Tokopedia ×2 · Shopee ×1)");
  console.log("  • Ledger entries untuk semua transaksi yang selesai (pos + marketplace + web)\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Demo seed gagal:", err);
  process.exit(1);
});
