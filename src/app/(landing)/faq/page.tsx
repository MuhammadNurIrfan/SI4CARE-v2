"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const faqData = [
  {
    kategori: "Pembelian & Pesanan",
    items: [
      { q: "Bagaimana cara memesan produk di si4care?", a: "Pilih produk yang Anda inginkan dari katalog, klik 'Tambah ke Keranjang', lalu lanjutkan ke Checkout. Isi alamat pengiriman, pilih metode pembayaran, dan konfirmasi pesanan." },
      { q: "Apakah bisa memesan dalam jumlah besar (B2B)?", a: "Ya, si4care melayani pembelian grosir dan B2B. Hubungi tim kami melalui halaman Kontak atau email ke b2b@si4care.id untuk penawaran harga khusus dan terms kemitraan." },
      { q: "Berapa minimum pembelian di si4care?", a: "Tidak ada minimum pembelian untuk pelanggan umum. Untuk harga grosir dan B2B, berlaku minimum order yang akan dikomunikasikan oleh tim sales kami." },
      { q: "Apakah saya bisa membatalkan pesanan setelah bayar?", a: "Pembatalan dapat dilakukan selama pesanan masih berstatus 'Diproses'. Setelah pesanan berstatus 'Dikirim', pembatalan tidak dapat dilakukan. Hubungi customer service kami segera jika perlu membatalkan." },
    ],
  },
  {
    kategori: "Pengiriman",
    items: [
      { q: "Berapa lama waktu pengiriman?", a: "Estimasi pengiriman bergantung pada lokasi tujuan: Jabodetabek 1–2 hari kerja, Jawa & Bali 2–4 hari kerja, Luar Jawa 4–7 hari kerja. Kami bekerja sama dengan JNE, SiCepat, dan J&T." },
      { q: "Apakah ada biaya pengiriman?", a: "Biaya pengiriman dihitung berdasarkan berat produk dan lokasi tujuan. Anda dapat melihat estimasi biaya pengiriman sebelum konfirmasi pesanan di halaman checkout." },
      { q: "Bagaimana cara melacak pesanan saya?", a: "Setelah pesanan dikirim, Anda akan menerima nomor resi melalui email. Lacak pesanan di halaman 'Akun > Pesanan Saya' atau langsung di situs kurir yang digunakan." },
      { q: "Apakah si4care mengirim ke seluruh Indonesia?", a: "Ya, kami melayani pengiriman ke seluruh wilayah Indonesia termasuk daerah terpencil, meski estimasi waktu dan biaya mungkin berbeda." },
    ],
  },
  {
    kategori: "Produk & Keaslian",
    items: [
      { q: "Apakah semua produk di si4care original?", a: "Ya, 100%. Semua produk yang kami jual adalah produk asli bergaransi resmi dari distributor resmi atau langsung dari principal brand. Kami tidak menjual produk KW atau replika." },
      { q: "Apakah produk sudah terdaftar di BPOM?", a: "Semua alat kesehatan yang kami jual telah memiliki izin edar dari Kemenkes/BPOM. Nomor izin edar dapat dilihat di halaman detail setiap produk." },
      { q: "Bagaimana dengan garansi produk?", a: "Garansi mengikuti kebijakan masing-masing produsen (umumnya 1–5 tahun). Detail garansi tertera di halaman produk. Klaim garansi dapat dilakukan melalui service center resmi atau menghubungi kami." },
    ],
  },
  {
    kategori: "Pembayaran",
    items: [
      { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami menerima: Transfer Bank (BCA, Mandiri, BNI, BRI), QRIS (semua e-wallet), Kartu Kredit/Debit Visa & Mastercard, serta COD untuk area tertentu (syarat berlaku)." },
      { q: "Apakah pembayaran di si4care aman?", a: "Ya. Semua transaksi diproses melalui payment gateway berlisensi OJK dengan enkripsi SSL 256-bit. Data kartu kredit Anda tidak pernah kami simpan." },
      { q: "Bagaimana jika pembayaran saya gagal?", a: "Pesanan akan otomatis dibatalkan jika pembayaran tidak dikonfirmasi dalam 24 jam. Anda dapat membuat pesanan baru. Jika terjadi double charge, hubungi kami segera dengan bukti transaksi." },
    ],
  },
  {
    kategori: "Retur & Pengembalian",
    items: [
      { q: "Bagaimana kebijakan retur si4care?", a: "Kami menerima retur dalam 7 hari setelah produk diterima untuk kondisi: produk cacat/rusak saat tiba, produk tidak sesuai pesanan, atau produk yang salah dikirim." },
      { q: "Bagaimana cara mengajukan retur?", a: "Login ke akun Anda, masuk ke 'Pesanan Saya', pilih pesanan yang ingin diretur, dan isi formulir retur. Sertakan foto kondisi produk. Tim kami akan memproses dalam 2 hari kerja." },
      { q: "Berapa lama dana dikembalikan?", a: "Setelah retur disetujui dan produk diterima, refund diproses dalam 3–7 hari kerja tergantung metode pembayaran awal. Transfer bank umumnya 1–3 hari, kartu kredit 7–14 hari." },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex items-start justify-between gap-4 hover:text-primary transition-colors"
      >
        <span className="font-medium text-sm md:text-base leading-snug">{q}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-4 text-muted-foreground text-sm leading-relaxed pr-6">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState("Semua");

  const filteredData = faqData
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) =>
      (activeKat === "Semua" || group.kategori === activeKat) && group.items.length > 0
    );

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-2xl">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">FAQ</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Pertanyaan yang Sering Diajukan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Temukan jawaban cepat untuk pertanyaan umum seputar produk, pengiriman, dan layanan kami.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 h-12 text-base"
              placeholder="Cari pertanyaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["Semua", ...faqData.map((g) => g.kategori)].map((kat) => (
              <button
                key={kat}
                onClick={() => setActiveKat(kat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeKat === kat ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                }`}
              >
                {kat}
              </button>
            ))}
          </div>

          {/* FAQ Groups */}
          <div className="space-y-10">
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium mb-2">Tidak ada hasil untuk &ldquo;{search}&rdquo;</p>
                <p className="text-sm">Coba kata kunci lain atau hubungi kami langsung.</p>
              </div>
            ) : (
              filteredData.map((group) => (
                <div key={group.kategori}>
                  <h2 className="text-lg font-bold mb-4 text-primary border-b border-primary/20 pb-2">{group.kategori}</h2>
                  <div>
                    {group.items.map((item, i) => (
                      <FaqItem key={i} q={item.q} a={item.a} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Still need help */}
          <div className="mt-16 p-8 bg-muted/30 rounded-2xl text-center border">
            <MessageCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Masih ada pertanyaan?</h3>
            <p className="text-muted-foreground mb-6">
              Tim customer service kami siap membantu Anda melalui berbagai saluran.
            </p>
            <Link href="/contact">
              <Button size="lg">Hubungi Kami</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
