"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate";
import { randomUUID } from "crypto";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { categorySchema, type CategoryInput } from "@/lib/validations/catalog";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Tidak ada sesi aktif");
  if (!["admin", "super_admin"].includes(session.user.role as string)) {
    throw new Error("Akses ditolak: bukan admin");
  }
  return session;
}

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function createCategory(input: CategoryInput) {
  await requireAdmin();
  const data = categorySchema.parse(input);
  const id = randomUUID();
  await db.insert(categories).values({
    id,
    name: data.name,
    description: data.description ?? null,
    imageUrl: data.imageUrl ?? null,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefront();
}

export async function updateCategory(id: string, input: CategoryInput) {
  await requireAdmin();
  const data = categorySchema.parse(input);
  await db
    .update(categories)
    .set({
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefront();
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  // products.categoryId akan di-set null oleh ON DELETE SET NULL
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefront();
}
