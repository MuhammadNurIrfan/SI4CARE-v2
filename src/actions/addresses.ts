"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { addressSchema, type AddressInput } from "@/lib/validations/address";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user.id;
}

/** Pastikan address milik user yang sedang login (anti-IDOR) sebelum mutasi. */
async function requireOwnAddress(userId: string, addressId: string) {
  const [row] = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
  if (!row) throw new Error("Alamat tidak ditemukan");
}

export async function createAddress(input: AddressInput) {
  const userId = await requireUserId();
  const data = addressSchema.parse(input);

  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId));
  const isFirstAddress = existing.length === 0;

  await db.insert(addresses).values({
    id: randomUUID(),
    userId,
    ...data,
    isPrimary: isFirstAddress,
  });

  revalidatePath("/account/addresses");
}

export async function updateAddress(addressId: string, input: AddressInput) {
  const userId = await requireUserId();
  await requireOwnAddress(userId, addressId);
  const data = addressSchema.parse(input);

  await db.update(addresses).set(data).where(eq(addresses.id, addressId));

  revalidatePath("/account/addresses");
}

export async function deleteAddress(addressId: string) {
  const userId = await requireUserId();
  await requireOwnAddress(userId, addressId);

  await db.delete(addresses).where(eq(addresses.id, addressId));

  revalidatePath("/account/addresses");
}

export async function getMyAddresses() {
  const userId = await requireUserId();
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(addresses.isPrimary, addresses.createdAt);
}

export type AddressRow = Awaited<ReturnType<typeof getMyAddresses>>[number];

export async function setPrimaryAddress(addressId: string) {
  const userId = await requireUserId();
  await requireOwnAddress(userId, addressId);

  await db.update(addresses).set({ isPrimary: false }).where(eq(addresses.userId, userId));
  await db.update(addresses).set({ isPrimary: true }).where(eq(addresses.id, addressId));

  revalidatePath("/account/addresses");
}
