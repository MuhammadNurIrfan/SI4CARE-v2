"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contentSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SiteContent } from "@/lib/content-defaults";
import { loadContent, readStoredContent } from "@/lib/content-query";
import { requireAdmin } from "@/lib/server-auth";

export type ContentData = SiteContent;

/** Baca publik (landing memakai `loadContent` langsung). Sengaja TANPA requireAdmin. */
export async function getContentSections(): Promise<ContentData> {
  return loadContent();
}

/** Landing di-cache (ISR); revalidatePath membuat edit admin terlihat seketika, bukan setelah ≤60 detik. */
function refreshLanding() {
  revalidatePath("/");
}

export async function updateContentSection(key: string, data: Partial<ContentData>): Promise<void> {
  await requireAdmin();
  try {
    // Pakai pembacaan yang MELEMPAR: jika DB gagal dibaca, batalkan — jangan menulis default menimpa konten.
    const current = await readStoredContent();
    const merged = { ...current, ...data };

    const existing = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, "landing"))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(contentSections)
        .set({ data: merged, updatedAt: new Date() })
        .where(eq(contentSections.key, "landing"));
    } else {
      await db
        .insert(contentSections)
        .values({ key: "landing", data: merged, createdAt: new Date(), updatedAt: new Date() });
    }
  } catch (e) {
    console.error("Error updating content section:", e);
    throw new Error("Gagal menyimpan konten");
  }
  refreshLanding();
}

export async function resetContent(): Promise<void> {
  await requireAdmin();
  try {
    await db.delete(contentSections).where(eq(contentSections.key, "landing"));
  } catch (e) {
    console.error("Error resetting content:", e);
    throw new Error("Gagal reset konten");
  }
  refreshLanding();
}
