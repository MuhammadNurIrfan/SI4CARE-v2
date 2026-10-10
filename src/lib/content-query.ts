import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentSections } from "@/lib/db/schema";
import { DEFAULT_CONTENT, mergeWithDefaults, type SiteContent } from "@/lib/content-defaults";

/**
 * Baca konten CMS landing dari DB.
 *
 * Modul biasa (bukan "use server"): dipanggil langsung oleh layout/page landing
 * sebagai server component. Sebelumnya editor admin menulis ke tabel
 * `content_sections` tetapi halaman depan membaca `localStorage` — jadi edit
 * admin tidak pernah terlihat pengunjung.
 */

/**
 * Versi yang MELEMPAR error bila DB gagal. Dipakai jalur tulis: kalau pembacaan
 * gagal lalu kita menulis balik "default", konten tersimpan akan tertimpa.
 */
export async function readStoredContent(): Promise<SiteContent> {
  const [row] = await db
    .select()
    .from(contentSections)
    .where(eq(contentSections.key, "landing"))
    .limit(1);
  return mergeWithDefaults(row?.data as Partial<SiteContent> | undefined);
}

/**
 * Versi untuk render halaman: tidak pernah melempar — DB tak terjangkau berarti
 * landing tampil dengan konten default, bukan error 500. `cache()` menyatukan
 * panggilan dari layout dan page dalam satu request.
 */
export const loadContent = cache(async (): Promise<SiteContent> => {
  try {
    return await readStoredContent();
  } catch (err) {
    console.error("[content] gagal membaca konten landing, memakai default:", err instanceof Error ? err.message : err);
    return DEFAULT_CONTENT;
  }
});
