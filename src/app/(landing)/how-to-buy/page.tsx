import Link from "next/link";
import { ShoppingCart, MapPin, CreditCard, Package, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    no: "01", icon: ShoppingCart, title: "Pilih & Tambahkan Produk",
    desc: "Telusuri katalog produk kami dan pilih alat kesehatan yang Anda butuhkan. Gunakan filter kategori atau fitur pencarian untuk menemukan produk dengan cepat. Klik 'Tambah ke Keranjang' pada produk pilihan Anda.",
    tips: ["Bandingkan varian produk sebelum menambahkan ke keranjang", "Perhatikan estimasi stok yang tersedia", "Baca ulasan pelanggan untuk referensi tambahan"],
  },
  {
    no: "02", icon: MapPin, title: "Isi Data Pengiriman",
    desc: "Pada halaman checkout, isi atau pilih alamat pengiriman yang sudah tersimpan. Pastikan nama, nomor telepon, dan alamat lengkap sudah benar untuk menghindari keterlambatan pengiriman.",
    tips: ["Gunakan fitur Buku Alamat untuk menyimpan alamat favorit", "Cek ulang kode pos untuk tarif pengiriman yang akurat", "Tambahkan catatan pengiriman jika diperlukan"],
  },
  {
    no: "03", icon: CreditCard, title: "Pilih Metode Pembayaran",
    desc: "Pilih metode pembayaran yang paling nyaman: Transfer Bank, QRIS, kartu kredit/debit, atau dompet digital. Semua transaksi diproses melalui sistem pembayaran berlisensi OJK dengan enkripsi SSL.",
    tips: ["Transfer Bank: BCA, Mandiri, BNI, BRI", "QRIS: GoPay, OVO, Dana, LinkAja, ShopeePay", "Kartu Kredit/Debit: Visa & Mastercard"],
  },
  {
    no: "04", icon: Package, title: "Konfirmasi & Terima Pesanan",
    desc: "Setelah pembayaran dikonfirmasi, pesanan Anda akan segera diproses dan dikirim. Anda akan menerima notifikasi email beserta nomor resi pengiriman untuk memantau status paket.",
    tips: ["Pantau status pesanan di 'Akun > Pesanan Saya'", "Simpan bukti pembayaran hingga produk diterima", "Periksa kondisi produk saat menerima paket"],
  },
];

const paymentMethods = [
  { name: "Transfer Bank", items: ["BCA Virtual Account", "Mandiri Virtual Account", "BNI Virtual Account", "BRI Virtual Account"] },
  { name: "Dompet Digital & QRIS", items: ["GoPay", "OVO", "Dana", "LinkAja", "ShopeePay", "QRIS (semua bank)"] },
  { name: "Kartu Pembayaran", items: ["Kartu Kredit Visa", "Kartu Kredit Mastercard", "Kartu Debit Visa", "Kartu Debit Mastercard"] },
];

export default function HowToBuyPage() {
  return (
    <div className="pt-20">
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-2xl">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">Cara Pembelian</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Mudah Belanja di si4care</h1>
          <p className="text-xl text-muted-foreground">
            Ikuti 4 langkah sederhana ini untuk mendapatkan alat kesehatan yang Anda butuhkan.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {steps.map((step, i) => (
              <div key={step.no} className={`grid md:grid-cols-2 gap-8 items-start ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex gap-5">
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                      {step.no}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <step.icon className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">{step.title}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                <Card className="bg-muted/30">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Tips</p>
                    <ul className="space-y-2">
                      {step.tips.map((tip, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 px-4 bg-muted/20 border-y">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Metode Pembayaran yang Tersedia</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {paymentMethods.map((pm) => (
              <Card key={pm.name}>
                <CardContent className="p-5">
                  <h3 className="font-bold mb-3">{pm.name}</h3>
                  <ul className="space-y-1.5">
                    {pm.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-2xl font-bold mb-3">Siap Berbelanja?</h2>
          <p className="text-muted-foreground mb-8">Temukan ribuan produk alat kesehatan original dengan harga terbaik.</p>
          <Link href="/shop">
            <Button size="lg" className="gap-2">Mulai Belanja Sekarang <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
