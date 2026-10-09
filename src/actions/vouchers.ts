"use server";

import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { vouchers } from "@/lib/db/schema";
import crypto from "crypto";
import { requireAdmin } from "@/lib/server-auth";

// ─── Tipe publik ──────────────────────────────────────────────────────────────

export type VoucherResult =
  | { ok: true; voucherId: string; type: "percent" | "fixed"; value: number; maxDiscount: number | null }
  | { ok: false; error: string };

export type VoucherRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;  // ISO date string
  validUntil: string;
  isActive: boolean;
};

// ─── Validasi (checkout) ─────────────────────────────────────────────────────

/** Validasi kode voucher terhadap subtotal. Mengembalikan nilai diskon jika valid. */
export async function validateVoucher(code: string, subtotal: number): Promise<VoucherResult> {
  if (!code?.trim()) return { ok: false, error: "Kode tidak boleh kosong" };

  const now = new Date();
  const [row] = await db
    .select()
    .from(vouchers)
    .where(
      and(
        eq(vouchers.code, code.trim().toUpperCase()),
        eq(vouchers.isActive, true),
        lte(vouchers.validFrom, now),
        gte(vouchers.validUntil, now),
      ),
    )
    .limit(1);

  if (!row) return { ok: false, error: "Kode promo tidak ditemukan atau sudah kadaluarsa" };

  if (row.usageLimit !== null && row.usedCount >= row.usageLimit) {
    return { ok: false, error: "Kuota promo sudah habis" };
  }

  const minOrder = row.minOrder ? Number(row.minOrder) : 0;
  if (subtotal < minOrder) {
    return {
      ok: false,
      error: `Minimum belanja ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(minOrder)} untuk memakai promo ini`,
    };
  }

  return {
    ok: true,
    voucherId: row.id,
    type: row.type,
    value: Number(row.value),
    maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
  };
}

/** Atomic increment usedCount — panggil saat order PAID. */
export async function incrementVoucherUsage(voucherId: string) {
  await db
    .update(vouchers)
    .set({ usedCount: sql`${vouchers.usedCount} + 1` })
    .where(eq(vouchers.id, voucherId));
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function getVouchers(): Promise<VoucherRow[]> {
  await requireAdmin();
  const rows = await db.select().from(vouchers).orderBy(vouchers.createdAt);
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    type: r.type,
    value: Number(r.value),
    minOrder: Number(r.minOrder ?? 0),
    maxDiscount: r.maxDiscount ? Number(r.maxDiscount) : null,
    usageLimit: r.usageLimit,
    usedCount: r.usedCount,
    validFrom: r.validFrom instanceof Date ? r.validFrom.toISOString().slice(0, 10) : String(r.validFrom).slice(0, 10),
    validUntil: r.validUntil instanceof Date ? r.validUntil.toISOString().slice(0, 10) : String(r.validUntil).slice(0, 10),
    isActive: r.isActive,
  }));
}

export type UpsertVoucherInput = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  validFrom: string;   // YYYY-MM-DD
  validUntil: string;  // YYYY-MM-DD
  isActive: boolean;
};

export async function upsertVoucher(input: UpsertVoucherInput): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const data = {
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: String(input.value),
    minOrder: String(input.minOrder),
    maxDiscount: input.maxDiscount != null ? String(input.maxDiscount) : null,
    usageLimit: input.usageLimit,
    isActive: input.isActive,
    validFrom: new Date(input.validFrom),
    validUntil: new Date(input.validUntil + "T23:59:59"),
  };

  try {
    if (input.id) {
      await db.update(vouchers).set(data).where(eq(vouchers.id, input.id));
    } else {
      await db.insert(vouchers).values({ id: crypto.randomUUID(), ...data, usedCount: 0 });
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menyimpan";
    if (msg.includes("Duplicate") || msg.includes("duplicate")) {
      return { ok: false, error: "Kode voucher sudah dipakai" };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteVoucher(id: string) {
  await requireAdmin();
  await db.delete(vouchers).where(eq(vouchers.id, id));
}

export async function toggleVoucher(id: string, isActive: boolean) {
  await requireAdmin();
  await db.update(vouchers).set({ isActive }).where(eq(vouchers.id, id));
}

// ─── App Settings (subsidi ongkir, diskon berjenjang) ────────────────────────

import { appSettings } from "@/lib/db/schema";

export type ShippingSubsidyConfig = {
  active: boolean;
  minOrder: number;
  cap: number;
  zone: "jabodetabek" | "jawa" | "nasional";
};

export type TierConfig = { id: string; min: number; discount: number };
export type TieredDiscountConfig = { active: boolean; tiers: TierConfig[] };

export async function getShippingSubsidy(): Promise<ShippingSubsidyConfig> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "shipping_subsidy")).limit(1);
  if (!row) return { active: true, minOrder: 300000, cap: 25000, zone: "jabodetabek" };
  return row.value as ShippingSubsidyConfig;
}

export async function saveShippingSubsidy(cfg: ShippingSubsidyConfig) {
  await db
    .insert(appSettings)
    .values({ key: "shipping_subsidy", value: cfg })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: cfg } });
}

export async function getTieredDiscounts(): Promise<TieredDiscountConfig> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "tiered_discounts")).limit(1);
  if (!row) return { active: true, tiers: [{ id: "1", min: 250000, discount: 15000 }, { id: "2", min: 500000, discount: 40000 }, { id: "3", min: 1000000, discount: 100000 }] };
  return row.value as TieredDiscountConfig;
}

export async function saveTieredDiscounts(cfg: TieredDiscountConfig) {
  await db
    .insert(appSettings)
    .values({ key: "tiered_discounts", value: cfg })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: cfg } });
}
