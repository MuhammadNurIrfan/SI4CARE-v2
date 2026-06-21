"use server";

import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, desc, and, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/server-auth";

const upsertArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(200),
  category: z.string().max(100),
  excerpt: z.string().max(500),
  body: z.string().max(50000),
  status: z.enum(["draft", "terbit", "terjadwal"]),
  publishedAt: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  coverImage: z.string().url().max(500).optional().or(z.literal("")),
});

export type ArticleStatus = "draft" | "terbit" | "terjadwal";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  body: string | null;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  schemaType: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
};

export type UpsertArticleInput = {
  id?: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  status: ArticleStatus;
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  coverImage?: string;
};

function slugify(title: string, suffix = ""): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
  return suffix ? `${base}-${suffix}` : base;
}

function toRow(r: typeof articles.$inferSelect): ArticleRow {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category ?? null,
    excerpt: r.excerpt ?? null,
    body: r.body ?? null,
    coverImage: r.coverImage ?? null,
    metaTitle: r.metaTitle ?? null,
    metaDescription: r.metaDescription ?? null,
    schemaType: r.schemaType ?? null,
    status: r.status,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString().slice(0, 10) : null,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  };
}

export async function getPublishedArticles(): Promise<ArticleRow[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "terbit"),
        lte(articles.publishedAt, now),
      ),
    )
    .orderBy(desc(articles.publishedAt));
  // Also include articles where publishedAt is null but status=terbit (published immediately)
  const nullRows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.status, "terbit")));
  // Deduplicate by id, sort by publishedAt desc then createdAt desc
  const seen = new Set<string>();
  const all: typeof articles.$inferSelect[] = [];
  for (const r of [...rows, ...nullRows]) {
    if (!seen.has(r.id)) { seen.add(r.id); all.push(r); }
  }
  all.sort((a, b) => {
    const da = a.publishedAt ?? a.createdAt;
    const db2 = b.publishedAt ?? b.createdAt;
    return db2.getTime() - da.getTime();
  });
  return all.map(toRow);
}

export async function getArticleBySlug(slug: string): Promise<ArticleRow | null> {
  const [row] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!row) return null;
  return toRow(row);
}

export async function getAdminArticles(): Promise<ArticleRow[]> {
  const rows = await db.select().from(articles).orderBy(desc(articles.updatedAt));
  return rows.map(toRow);
}

export async function upsertArticle(input: UpsertArticleInput): Promise<{ ok: boolean; slug: string; error?: string }> {
  await requireAdmin();

  const parsed = upsertArticleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, slug: "", error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const data = parsed.data;

  const isNew = !data.id;
  const id = data.id ?? randomUUID();

  let slug = slugify(data.title);
  if (isNew) {
    const existing = await db.select({ slug: articles.slug }).from(articles);
    const slugSet = new Set(existing.map((r) => r.slug));
    let candidate = slug;
    let attempt = 1;
    while (slugSet.has(candidate)) {
      candidate = slugify(data.title, String(attempt++));
    }
    slug = candidate;
  } else {
    const [cur] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, id)).limit(1);
    if (cur) slug = cur.slug;
  }

  const publishedAt = data.publishedAt ? new Date(data.publishedAt) : (data.status === "terbit" ? new Date() : null);

  if (isNew) {
    await db.insert(articles).values({
      id,
      slug,
      title: data.title,
      category: data.category,
      excerpt: data.excerpt || null,
      body: data.body || null,
      coverImage: data.coverImage || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      status: data.status,
      publishedAt: publishedAt ?? undefined,
    });
  } else {
    await db.update(articles)
      .set({
        title: data.title,
        category: data.category,
        excerpt: data.excerpt || null,
        body: data.body || null,
        coverImage: data.coverImage || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        status: data.status,
        publishedAt: publishedAt ?? undefined,
      })
      .where(eq(articles.id, id));
  }

  return { ok: true, slug };
}

export async function deleteArticle(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!z.string().min(1).safeParse(id).success) return { ok: false };
  await db.delete(articles).where(eq(articles.id, id));
  return { ok: true };
}
