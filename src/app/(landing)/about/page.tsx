import Link from "next/link";
import { Heart, Target, Users, Award, ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const team = [
  { name: "dr. Hendra Wijaya", role: "CEO & Co-Founder", bio: "Dokter spesialis dengan 15 tahun pengalaman di industri alat kesehatan Indonesia.", initials: "HW", color: "bg-blue-100 text-blue-700" },
  { name: "Rina Kusuma, S.T.", role: "CTO & Co-Founder", bio: "Engineer berpengalaman dengan fokus pada sistem manajemen kesehatan digital.", initials: "RK", color: "bg-violet-100 text-violet-700" },
  { name: "Budi Santoso, M.B.A.", role: "COO", bio: "Pakar operasional dengan rekam jejak membangun jaringan distribusi alkes nasional.", initials: "BS", color: "bg-emerald-100 text-emerald-700" },
  { name: "Siti Rahayu, S.Farm.", role: "Head of Quality", bio: "Apoteker bersertifikat yang memastikan semua produk memenuhi standar BPOM dan ISO.", initials: "SR", color: "bg-amber-100 text-amber-700" },
];

const milestones = [
  { year: "2019", event: "Si4Care didirikan di Jakarta oleh dr. Hendra dan tim." },
  { year: "2020", event: "Meluncurkan platform web pertama untuk penjualan alat kesehatan." },
  { year: "2021", event: "Bergabung dengan 50+ toko alat kesehatan di Jabodetabek." },
  { year: "2022", event: "Ekspansi ke 15 kota besar di Indonesia, melayani 200+ mitra." },
  { year: "2023", event: "Integrasi marketplace dan fitur manajemen batch & kadaluarsa." },
  { year: "2024", event: "Melayani 500+ toko dan 50.000+ transaksi per bulan." },
];

const values = [
  { icon: Heart, title: "Kepedulian", desc: "Setiap keputusan kami berlandaskan kepedulian terhadap kesehatan masyarakat dan keberlanjutan usaha mitra kami." },
  { icon: Target, title: "Presisi", desc: "Data stok, harga, dan laporan yang akurat adalah fondasi kepercayaan antara kami dan setiap pengguna." },
  { icon: Users, title: "Kemitraan", desc: "Kami bukan hanya vendor — kami adalah mitra bisnis yang tumbuh bersama pemilik toko alat kesehatan." },
  { icon: Award, title: "Kepatuhan", desc: "Semua produk melewati verifikasi BPOM. Semua data dikelola sesuai standar keamanan nasional." },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-3xl">
          <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-4">Tentang Kami</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Misi Kami: Digitalkan Setiap Toko Alat Kesehatan di Indonesia
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Si4Care lahir dari keresahan nyata — ribuan toko alat kesehatan di Indonesia masih mengelola stok, harga, dan pesanan secara manual. Kami hadir untuk mengubah itu.
          </p>
          <Link href="/shop">
            <Button size="lg" className="gap-2">
              Lihat Produk Kami <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y bg-muted/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "500+", label: "Mitra Toko" },
              { val: "50rb+", label: "Transaksi/Bulan" },
              { val: "15", label: "Kota di Indonesia" },
              { val: "99.9%", label: "Uptime Platform" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold text-primary mb-1">{s.val}</p>
                <p className="text-muted-foreground text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Nilai-Nilai Kami</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Empat prinsip ini menjadi panduan dalam setiap produk, layanan, dan keputusan yang kami buat.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-6 px-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <v.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Perjalanan Kami</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="flex gap-6 relative">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 z-10 shadow-sm">
                    {m.year}
                  </div>
                  <div className="flex-1 pt-4">
                    <p className="text-foreground leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Tim Kami</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Dibangun oleh profesional yang menggabungkan keahlian medis, teknologi, dan bisnis.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((t) => (
              <Card key={t.name} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4 ${t.color}`}>
                    {t.initials}
                  </div>
                  <h3 className="font-bold text-base">{t.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{t.role}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Bergabung Bersama Kami</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Jadilah bagian dari komunitas toko alat kesehatan yang lebih cerdas dan efisien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="gap-2">
                Hubungi Kami <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Lihat Produk
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
