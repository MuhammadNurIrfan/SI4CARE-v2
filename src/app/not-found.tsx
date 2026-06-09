import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-primary/5 to-background">
      {/* Ilustrasi angka 404 */}
      <div className="relative mb-8 select-none">
        <p className="text-[160px] md:text-[220px] font-black text-primary/10 leading-none tracking-tighter">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-10 w-10 text-primary" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed">
        Sepertinya halaman yang Anda cari sudah dipindahkan, dihapus, atau tidak pernah ada. Jangan khawatir, kami siap membantu!
      </p>

      {/* Quick links */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <Link href="/">
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" /> Kembali ke Beranda
          </Button>
        </Link>
        <Link href="/shop">
          <Button size="lg" variant="outline" className="gap-2">
            Lihat Katalog Produk
          </Button>
        </Link>
      </div>

      {/* Popular links */}
      <div className="border rounded-xl p-6 max-w-sm w-full bg-background">
        <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Halaman Populer</p>
        <div className="space-y-2 text-sm">
          {[
            { href: "/shop", label: "Katalog Produk" },
            { href: "/about", label: "Tentang Si4Care" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Hubungi Kami" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:gap-3 transition-all py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Logo */}
      <Link href="/" className="mt-10 inline-block">
        <span className="text-xl font-bold tracking-tight text-primary opacity-50 hover:opacity-100 transition-opacity">
          si4care<span className="text-foreground">.</span>
        </span>
      </Link>
    </div>
  );
}
