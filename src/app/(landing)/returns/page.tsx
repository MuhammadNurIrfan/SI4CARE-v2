import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, AlertTriangle, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const accepted = [
  "Produk cacat produksi atau rusak saat diterima",
  "Produk tidak sesuai dengan deskripsi di website",
  "Produk yang salah dikirim (merek, tipe, atau varian berbeda)",
  "Produk tidak lengkap (aksesoris atau kelengkapan kurang)",
  "Produk kadaluarsa sebelum tanggal yang tertera di kemasan",
];

const rejected = [
  "Produk sudah digunakan atau dalam kondisi tidak tersegel",
  "Kerusakan akibat kesalahan penggunaan oleh pembeli",
  "Retur diajukan lebih dari 7 hari sejak produk diterima",
  "Produk tidak disertai kemasan dan kelengkapan aslinya",
  "Produk habis pakai (consumable) yang sudah dibuka",
];

const returSteps = [
  { no: "01", title: "Ajukan Retur", desc: "Login ke akun Anda → Pesanan Saya → pilih pesanan → klik 'Ajukan Retur'. Isi alasan dan unggah foto produk." },
  { no: "02", title: "Verifikasi Tim", desc: "Tim kami akan memverifikasi pengajuan retur dalam 1–2 hari kerja. Anda akan dihubungi via email untuk konfirmasi." },
  { no: "03", title: "Kirim Produk", desc: "Jika disetujui, kirimkan produk ke alamat kami. Biaya pengiriman retur ditanggung si4care untuk kasus produk cacat/salah kirim." },
  { no: "04", title: "Proses Refund", desc: "Setelah produk diterima dan diverifikasi, refund diproses dalam 3–7 hari kerja ke metode pembayaran asal." },
];

export default function ReturnsPage() {
  return (
    <div className="pt-20">
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-2xl">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">Kebijakan Retur</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Belanja Aman dengan Garansi Retur</h1>
          <p className="text-xl text-muted-foreground">
            Kami berkomitmen memastikan setiap pembelian sesuai harapan. Pelajari syarat dan prosedur retur kami.
          </p>
        </div>
      </section>

      {/* Alert */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 mb-1">Batas Waktu Pengajuan Retur</p>
              <p className="text-amber-800 text-sm">
                Retur hanya dapat diajukan dalam <strong>7 hari kalender</strong> sejak produk diterima. Pastikan Anda segera memeriksa kondisi produk saat paket tiba.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accepted / Rejected */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700 text-lg">
                  <CheckCircle2 className="h-5 w-5" /> Kondisi yang Diterima
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {accepted.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                  <XCircle className="h-5 w-5" /> Kondisi yang Tidak Diterima
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {rejected.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4 bg-muted/20 border-y">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Prosedur Pengajuan Retur</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {returSteps.map((s) => (
              <div key={s.no} className="relative">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-4">{s.no}</div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Refund info */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Estimasi Waktu Refund</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { method: "Transfer Bank", time: "1–3 hari kerja" },
              { method: "QRIS / E-Wallet", time: "1–3 hari kerja" },
              { method: "Kartu Kredit", time: "7–14 hari kerja" },
            ].map((r) => (
              <Card key={r.method}>
                <CardContent className="p-5 flex items-center gap-4">
                  <Clock className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{r.method}</p>
                    <p className="text-primary font-bold">{r.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/account/returns">
              <Button size="lg" className="gap-2">Ajukan Retur Sekarang <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2"><Phone className="h-4 w-4" /> Hubungi Customer Service</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
