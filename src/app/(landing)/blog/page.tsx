import Link from "next/link";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const articles = [
  {
    id: 1, slug: "#",
    title: "Cara Memilih Tensimeter Digital yang Tepat untuk Penggunaan Rumah",
    excerpt: "Tensimeter digital semakin populer di kalangan masyarakat Indonesia. Namun, dengan banyaknya pilihan di pasaran, bagaimana cara memilih yang paling sesuai kebutuhan?",
    category: "Edukasi Kesehatan", date: "28 Mei 2026", readTime: "5 menit",
    color: "bg-blue-100",
  },
  {
    id: 2, slug: "#",
    title: "5 Alat Kesehatan Wajib Ada di Setiap Rumah Tangga",
    excerpt: "Memiliki alat kesehatan dasar di rumah bukan lagi kebutuhan mewah. Ini adalah investasi untuk respons cepat terhadap kondisi darurat medis.",
    category: "Tips & Trik", date: "20 Mei 2026", readTime: "7 menit",
    color: "bg-emerald-100",
  },
  {
    id: 3, slug: "#",
    title: "Digitalisasi Toko Alat Kesehatan: Mengapa Ini Tidak Bisa Ditunda?",
    excerpt: "Era digital telah mengubah cara konsumen berbelanja. Toko alat kesehatan yang tidak beradaptasi berisiko tertinggal jauh dari kompetitor.",
    category: "Bisnis & Industri", date: "12 Mei 2026", readTime: "8 menit",
    color: "bg-violet-100",
  },
  {
    id: 4, slug: "#",
    title: "Memahami Regulasi BPOM untuk Alat Kesehatan: Panduan Lengkap",
    excerpt: "Distribusi alat kesehatan di Indonesia diatur ketat oleh BPOM. Artikel ini merangkum aturan utama yang wajib diketahui setiap distributor dan pengecer.",
    category: "Regulasi", date: "5 Mei 2026", readTime: "10 menit",
    color: "bg-amber-100",
  },
  {
    id: 5, slug: "#",
    title: "Manajemen Stok Cerdas: Hindari Kerugian Akibat Produk Kadaluarsa",
    excerpt: "Salah satu tantangan terbesar toko alkes adalah produk yang kadaluarsa sebelum terjual. Pelajari strategi FEFO dan sistem alarm otomatis.",
    category: "Tips & Trik", date: "28 April 2026", readTime: "6 menit",
    color: "bg-rose-100",
  },
  {
    id: 6, slug: "#",
    title: "Pulse Oximeter: Fungsi, Cara Pakai, dan Rekomendasi Terbaik 2026",
    excerpt: "Pasca pandemi, pulse oximeter menjadi salah satu alat paling dicari. Panduan lengkap untuk konsumen dan distributor.",
    category: "Edukasi Kesehatan", date: "15 April 2026", readTime: "4 menit",
    color: "bg-cyan-100",
  },
];

const categories = ["Semua", "Edukasi Kesehatan", "Tips & Trik", "Bisnis & Industri", "Regulasi"];

export default function BlogPage() {
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-2xl">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">Artikel & Berita</span>
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
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((c) => (
              <button
                key={c}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  c === "Semua" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Featured Article */}
          <Link href={featured.slug} className="block mb-10 group">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className={`${featured.color} min-h-[240px] flex items-center justify-center`}>
                  <span className="text-muted-foreground text-sm">Gambar Artikel Utama</span>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-3">{featured.category}</Badge>
                  <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors leading-snug">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {featured.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featured.readTime} baca</span>
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                    Baca Selengkapnya <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

          {/* Article Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <Link key={article.id} href={article.slug} className="group">
                <Card className="overflow-hidden h-full hover:shadow-md transition-shadow flex flex-col">
                  <div className={`${article.color} h-44 flex items-center justify-center shrink-0`}>
                    <span className="text-muted-foreground text-xs">Foto Artikel</span>
                  </div>
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">{article.category}</span>
                    </div>
                    <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {article.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readTime}</span>
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
