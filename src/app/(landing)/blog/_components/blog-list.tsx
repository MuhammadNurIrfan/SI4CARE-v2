"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Tag, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArticleRow } from "@/actions/articles";

const COLORS = ["bg-blue-100", "bg-emerald-100", "bg-violet-100", "bg-amber-100", "bg-rose-100", "bg-cyan-100"];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const readTime = (body: string | null, excerpt: string | null) =>
  `${Math.max(3, Math.round(((body ?? "") + (excerpt ?? "")).split(/\s+/).length / 40) + 2)} menit`;

export function BlogList({ articles }: { articles: ArticleRow[] }) {
  const [cat, setCat] = useState("Semua");

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(articles.map((a) => a.category ?? "Lainnya")))],
    [articles],
  );
  const filtered = cat === "Semua" ? articles : articles.filter((a) => a.category === cat);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="pt-20">
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-2xl">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">Artikel &amp; Berita</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Edukasi, Industri, dan Inovasi Alat Kesehatan
          </h1>
          <p className="text-xl text-muted-foreground">
            Insight terkini seputar alat kesehatan, regulasi, dan strategi bisnis untuk mitra si4care.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${c === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}>
                {c}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed py-20 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="font-semibold">Belum ada artikel di kategori ini</p>
            </div>
          )}

          {featured && (
            <Link href={`/blog/${featured.slug}`} className="block mb-10 group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow py-0">
                <div className="grid md:grid-cols-2">
                  {featured.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.coverImage} alt={featured.title} className="object-cover min-h-[200px] md:min-h-[240px] w-full" />
                  ) : (
                    <div className={`${COLORS[0]} min-h-[200px] md:min-h-[240px] flex items-center justify-center`}>
                      <span className="text-muted-foreground text-sm">Gambar Artikel Utama</span>
                    </div>
                  )}
                  <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-3">{featured.category}</Badge>
                    <h2 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors leading-snug">
                      {featured.title}
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(featured.publishedAt ?? featured.createdAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime(featured.body, featured.excerpt)} baca</span>
                    </div>
                    <div className="mt-5 flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      Baca Selengkapnya <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article, i) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="group">
                <Card className="overflow-hidden h-full hover:shadow-md transition-shadow flex flex-col py-0">
                  {article.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.coverImage} alt={article.title} className="h-44 object-cover w-full shrink-0" />
                  ) : (
                    <div className={`${COLORS[(i + 1) % COLORS.length]} h-44 flex items-center justify-center shrink-0`}>
                      <span className="text-muted-foreground text-xs">Foto Artikel</span>
                    </div>
                  )}
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">{article.category}</span>
                    </div>
                    <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 pb-4 border-t">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(article.publishedAt ?? article.createdAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime(article.body, article.excerpt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
