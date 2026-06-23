import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getArticleBySlug, getPublishedArticles } from "@/actions/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://si4care.id";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Artikel tidak ditemukan" };

  const title = article.metaTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt ?? "";
  const url = `${SITE_URL}/blog/${article.slug}`;

  return {
    title: `${title} | si4care`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: article.publishedAt ?? article.createdAt,
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(article.coverImage ? { images: [article.coverImage] } : {}),
    },
    alternates: { canonical: url },
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const readTime = (body: string | null, excerpt: string | null) =>
  Math.max(3, Math.round(((body ?? "") + (excerpt ?? "")).split(/\s+/).length / 40) + 2);

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const minutes = readTime(article.body, article.excerpt);
  const pubDate = article.publishedAt ?? article.createdAt;
  const url = `${SITE_URL}/blog/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.schemaType ?? "Article",
    headline: article.title,
    description: article.metaDescription ?? article.excerpt ?? "",
    url,
    datePublished: pubDate,
    dateModified: pubDate,
    publisher: {
      "@type": "Organization",
      name: "si4care",
      url: SITE_URL,
    },
    ...(article.coverImage ? { image: article.coverImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape </script> dan karakter HTML khusus agar tidak bisa break keluar dari <script> tag
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      <div className="pt-20">
        {/* Cover image */}
        {article.coverImage && (
          <div className="h-64 md:h-80 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="container mx-auto max-w-3xl px-4 py-12">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Artikel
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {article.category && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" /> {article.category}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(pubDate)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {minutes} menit baca
            </span>
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary pl-4">
              {article.excerpt}
            </p>
          )}

          {/* Body — render paragraphs split by \n\n; ## headings */}
          {article.body ? (
            <div className="prose prose-slate max-w-none">
              {article.body.split(/\n{2,}/).map((block, i) => {
                if (block.startsWith("## ")) {
                  return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{block.slice(3)}</h2>;
                }
                if (block.startsWith("### ")) {
                  return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{block.slice(4)}</h3>;
                }
                if (block.startsWith("- ") || block.startsWith("1. ")) {
                  const lines = block.split("\n").filter(Boolean);
                  return (
                    <ul key={i} className="my-4 space-y-1 list-disc list-inside text-muted-foreground">
                      {lines.map((l, j) => <li key={j}>{l.replace(/^[-\d]+\.\s*/, "")}</li>)}
                    </ul>
                  );
                }
                return <p key={i} className="text-muted-foreground leading-relaxed mb-4">{block}</p>;
              })}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Isi artikel belum tersedia.</p>
          )}

          {/* Footer CTA */}
          <div className="mt-12 rounded-2xl border bg-primary/5 p-6 text-center">
            <p className="font-semibold mb-2">Butuh alat kesehatan yang disebutkan di artikel ini?</p>
            <p className="text-sm text-muted-foreground mb-4">Temukan produk original bergaransi dengan harga terbaik di si4care.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
              Lihat Produk <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
