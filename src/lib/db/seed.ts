/**
 * Seed script — isi data demo ke DB lokal.
 * Jalankan: npm run db:seed
 *
 * Aman dijalankan berulang (idempotent): skip jika data sudah ada.
 */
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "./index";
import { categories, products, variants, batches, vouchers } from "./schema";
import { user, account } from "./auth-schema";

// ─── Helper ──────────────────────────────────────────────────────────────────

function uuid() {
  return randomUUID();
}

async function upsertCategory(id: string, data: { name: string; description?: string }) {
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id));
  if (existing.length === 0) {
    await db.insert(categories).values({ id, ...data });
    console.log(`  ✓ Kategori: ${data.name}`);
  }
  return id;
}

async function upsertProduct(
  id: string,
  data: { categoryId: string; name: string; brand?: string; description?: string },
) {
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, id));
  if (existing.length === 0) {
    await db.insert(products).values({ id, isActive: true, ...data });
    console.log(`  ✓ Produk: ${data.name}`);
  }
  return id;
}

async function upsertVariant(
  id: string,
  data: {
    productId: string;
    sku: string;
    activePrice: number;
    minStock?: number;
    stockMode?: "fifo" | "fefo";
    barcode?: string;
  },
) {
  const existing = await db.select({ id: variants.id }).from(variants).where(eq(variants.id, id));
  if (existing.length === 0) {
    await db.insert(variants).values({
      id,
      sku: data.sku,
      productId: data.productId,
      activePrice: String(data.activePrice),
      minStock: data.minStock ?? 5,
      stockMode: data.stockMode ?? "fifo",
      barcode: data.barcode ?? null,
      isActive: true,
    });
    console.log(`    ✓ Varian SKU: ${data.sku} — Rp ${data.activePrice.toLocaleString("id-ID")}`);
  }
  return id;
}

async function addBatch(variantId: string, data: { hpp: number; quantity: number; supplier?: string; expiredDate?: string }) {
  await db.insert(batches).values({
    id: uuid(),
    variantId,
    hpp: String(data.hpp),
    quantity: data.quantity,
    remaining: data.quantity,
    supplier: data.supplier ?? "Distributor Demo",
    expiredDate: data.expiredDate ?? null,
    batchNumber: `SEED-${Date.now()}`,
  });
  console.log(`      + Batch: ${data.quantity} unit @ HPP Rp ${data.hpp.toLocaleString("id-ID")}`);
}

async function upsertVoucher(code: string, data: {
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  validDays?: number;
}) {
  const existing = await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, code));
  if (existing.length === 0) {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + (data.validDays ?? 365));
    await db.insert(vouchers).values({
      id: uuid(),
      code,
      type: data.type,
      value: String(data.value),
      minOrder: data.minOrder ? String(data.minOrder) : null,
      maxDiscount: data.maxDiscount ? String(data.maxDiscount) : null,
      validFrom: now,
      validUntil: until,
      isActive: true,
      usedCount: 0,
    });
    console.log(`  ✓ Voucher: ${code} (${data.type === "percent" ? data.value + "%" : "Rp " + data.value.toLocaleString("id-ID")})`);
  }
}

async function upsertAdmin(data: { id: string; name: string; email: string; password: string; role: string }) {
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, data.email));
  if (existing.length > 0) {
    console.log(`  ✓ User "${data.email}" sudah ada — skip`);
    return;
  }
  const hashed = await hashPassword(data.password);
  await db.insert(user).values({
    id: data.id,
    name: data.name,
    email: data.email,
    emailVerified: true,
    role: data.role,
  });
  await db.insert(account).values({
    id: uuid(),
    accountId: data.id,
    providerId: "credential",
    userId: data.id,
    password: hashed,
  });
  console.log(`  ✓ User: ${data.email} (role: ${data.role})`);
}

// ─── IDs tetap agar idempotent ────────────────────────────────────────────────

// UUID 36-char tetap agar idempotent
const CAT = {
  diagnostik: "11000000-0000-0000-0000-000000000001",
  terapi:     "11000000-0000-0000-0000-000000000002",
  bantu:      "11000000-0000-0000-0000-000000000003",
  apd:        "11000000-0000-0000-0000-000000000004",
};

const PROD = {
  omronHem7120: "22000000-0000-0000-0000-000000000001",
  omronNec28:   "22000000-0000-0000-0000-000000000002",
  oximeter:     "22000000-0000-0000-0000-000000000003",
  wheelchair:   "22000000-0000-0000-0000-000000000004",
  masker3ply:   "22000000-0000-0000-0000-000000000005",
  maskerN95:    "22000000-0000-0000-0000-000000000006",
  termometer:   "22000000-0000-0000-0000-000000000007",
  stetoskop:    "22000000-0000-0000-0000-000000000008",
};

const VAR = {
  omronHem7120Std:   "33000000-0000-0000-0000-000000000001",
  omronHem7120Paket: "33000000-0000-0000-0000-000000000002",
  omronNec28:        "33000000-0000-0000-0000-000000000003",
  oximeter:          "33000000-0000-0000-0000-000000000004",
  wheelchairStd:     "33000000-0000-0000-0000-000000000005",
  masker3plyBox:     "33000000-0000-0000-0000-000000000006",
  maskerN95:         "33000000-0000-0000-0000-000000000007",
  termometer:        "33000000-0000-0000-0000-000000000008",
  stetoskop:         "33000000-0000-0000-0000-000000000009",
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 Memulai seeding database...\n");

  // ── Akun Admin ────────────────────────────────────────────────────────────
  console.log("👤 Akun:");
  await upsertAdmin({
    id: "admin-0000-0000-0000-000000000001",
    name: "Admin SI4CARE",
    email: "admin@si4care.com",
    password: "Admin1234!",
    role: "admin",
  });
  await upsertAdmin({
    id: "admin-0000-0000-0000-000000000002",
    name: "Super Admin",
    email: "superadmin@si4care.com",
    password: "SuperAdmin1234!",
    role: "super_admin",
  });

  // ── Kategori ──────────────────────────────────────────────────────────────
  console.log("📁 Kategori:");
  await upsertCategory(CAT.diagnostik, { name: "Alat Diagnostik", description: "Tensimeter, oximeter, termometer, stetoskop, dll." });
  await upsertCategory(CAT.terapi,     { name: "Alat Terapi",     description: "Nebulizer, TENS, lampu terapi, dll." });
  await upsertCategory(CAT.bantu,      { name: "Alat Bantu Jalan", description: "Kursi roda, kruk, tongkat, walker, dll." });
  await upsertCategory(CAT.apd,        { name: "APD & Masker",    description: "Masker medis, masker N95, sarung tangan, APD lengkap." });

  // ── Produk + Varian + Batch ───────────────────────────────────────────────
  console.log("\n📦 Produk & Stok:");

  // 1. Tensimeter Omron HEM-7120 (2 varian)
  await upsertProduct(PROD.omronHem7120, { categoryId: CAT.diagnostik, name: "Tensimeter Digital Omron HEM-7120", brand: "Omron", description: "Tensimeter lengan atas dengan teknologi IntelliSense. Deteksi detak jantung tidak beraturan, garansi 5 tahun." });
  await upsertVariant(VAR.omronHem7120Std, { productId: PROD.omronHem7120, sku: "OMR-HEM7120-STD", activePrice: 540000, minStock: 3, barcode: "8901234500001" });
  await addBatch(VAR.omronHem7120Std, { hpp: 420000, quantity: 15, supplier: "PT Omron Healthcare Indonesia" });
  await upsertVariant(VAR.omronHem7120Paket, { productId: PROD.omronHem7120, sku: "OMR-HEM7120-PKT", activePrice: 650000, minStock: 2, barcode: "8901234500002" });
  await addBatch(VAR.omronHem7120Paket, { hpp: 510000, quantity: 8, supplier: "PT Omron Healthcare Indonesia" });

  // 2. Nebulizer Omron NE-C28
  await upsertProduct(PROD.omronNec28, { categoryId: CAT.terapi, name: "Nebulizer Kompresor Omron NE-C28", brand: "Omron", description: "Nebulizer kompresor untuk terapi pernapasan di rumah. Partikel halus optimal, suara rendah." });
  await upsertVariant(VAR.omronNec28, { productId: PROD.omronNec28, sku: "OMR-NEC28", activePrice: 620000, minStock: 3, barcode: "8901234500003" });
  await addBatch(VAR.omronNec28, { hpp: 480000, quantity: 10, supplier: "PT Omron Healthcare Indonesia" });

  // 3. Pulse Oximeter Yuwell
  await upsertProduct(PROD.oximeter, { categoryId: CAT.diagnostik, name: "Pulse Oximeter Fingertip Yuwell", brand: "Yuwell", description: "Pengukur saturasi oksigen darah (SpO2) dan denyut nadi. Layar OLED, mudah dibaca." });
  await upsertVariant(VAR.oximeter, { productId: PROD.oximeter, sku: "YUW-OXI-FT", activePrice: 175000, minStock: 5, barcode: "8901234500004" });
  await addBatch(VAR.oximeter, { hpp: 120000, quantity: 30, supplier: "CV Yuwell Medika" });

  // 4. Kursi Roda Sella
  await upsertProduct(PROD.wheelchair, { categoryId: CAT.bantu, name: "Kursi Roda Lipat Standar Sella", brand: "Sella", description: "Kursi roda lipat rangka baja, sandaran tangan bisa dilepas, cocok untuk dalam maupun luar ruangan." });
  await upsertVariant(VAR.wheelchairStd, { productId: PROD.wheelchair, sku: "SEL-WC-STD", activePrice: 1250000, minStock: 2, barcode: "8901234500005" });
  await addBatch(VAR.wheelchairStd, { hpp: 950000, quantity: 5, supplier: "PT Sella Medical" });

  // 5. Masker Medis 3-Ply OneMed (FEFO — ada expired date)
  await upsertProduct(PROD.masker3ply, { categoryId: CAT.apd, name: "Masker Medis 3-Ply OneMed (Box 50)", brand: "OneMed", description: "Masker medis 3 lapis, efisiensi filtrasi ≥95%, nyaman dipakai seharian, bersertifikat SNI." });
  await upsertVariant(VAR.masker3plyBox, { productId: PROD.masker3ply, sku: "OM-MSK3PLY-50", activePrice: 25000, minStock: 10, stockMode: "fefo", barcode: "8901234500006" });
  await addBatch(VAR.masker3plyBox, { hpp: 18000, quantity: 100, supplier: "PT OneMed Indonesia", expiredDate: "2027-12-31" });

  // 6. Masker N95 GEA Medical
  await upsertProduct(PROD.maskerN95, { categoryId: CAT.apd, name: "Masker N95 GEA Medical (isi 20)", brand: "GEA Medical", description: "Respirator N95 partikulat, efisiensi filtrasi ≥95%, dilengkapi nose clip aluminium, bersertifikat NIOSH." });
  await upsertVariant(VAR.maskerN95, { productId: PROD.maskerN95, sku: "GEA-N95-20", activePrice: 95000, minStock: 5, stockMode: "fefo", barcode: "8901234500007" });
  await addBatch(VAR.maskerN95, { hpp: 70000, quantity: 40, supplier: "PT GEA Medical", expiredDate: "2026-06-30" });

  // 7. Termometer Infrared
  await upsertProduct(PROD.termometer, { categoryId: CAT.diagnostik, name: "Termometer Tembak Infrared OneMed", brand: "OneMed", description: "Termometer non-kontak infrared untuk dahi & telinga, respons <1 detik, akurasi ±0,2°C." });
  await upsertVariant(VAR.termometer, { productId: PROD.termometer, sku: "OM-THERMO-IR", activePrice: 150000, minStock: 5, barcode: "8901234500008" });
  await addBatch(VAR.termometer, { hpp: 100000, quantity: 25, supplier: "PT OneMed Indonesia" });

  // 8. Stetoskop GEA Medical
  await upsertProduct(PROD.stetoskop, { categoryId: CAT.diagnostik, name: "Stetoskop Dual Head GEA Medical", brand: "GEA Medical", description: "Stetoskop dual head untuk dewasa & anak, membran presisi, selang anti-kink, nyaman di telinga." });
  await upsertVariant(VAR.stetoskop, { productId: PROD.stetoskop, sku: "GEA-STETO-DH", activePrice: 165000, minStock: 3, barcode: "8901234500009" });
  await addBatch(VAR.stetoskop, { hpp: 120000, quantity: 20, supplier: "PT GEA Medical" });

  // ── Voucher demo ──────────────────────────────────────────────────────────
  console.log("\n🎟️  Voucher:");
  await upsertVoucher("SEHAT10", { type: "percent", value: 10, minOrder: 100000, maxDiscount: 50000 });
  await upsertVoucher("ALKES5",  { type: "percent", value: 5,  minOrder: 50000 });
  await upsertVoucher("DISKON20RB", { type: "fixed", value: 20000, minOrder: 200000 });

  console.log("\n✅ Seeding selesai!\n");
  console.log("Ringkasan:");
  console.log("  • 2 akun (admin@si4care.com / Admin1234!, superadmin@si4care.com / SuperAdmin1234!)");
  console.log("  • 4 kategori");
  console.log("  • 8 produk, 9 varian, 9 batch");
  console.log("  • 3 voucher (SEHAT10, ALKES5, DISKON20RB)");
  console.log("\nBuka http://localhost:3000/shop untuk melihat hasilnya.\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});
