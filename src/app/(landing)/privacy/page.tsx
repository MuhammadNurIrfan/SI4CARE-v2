import { SITE_CONFIG } from "@/lib/site-config";

const lastUpdated = "1 Juni 2026";

const sections = [
  {
    title: "1. Informasi yang Kami Kumpulkan",
    content: `Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, termasuk:

• Data Identitas: Nama lengkap, nomor telepon, alamat email, tanggal lahir.
• Data Alamat: Alamat pengiriman lengkap termasuk kelurahan, kecamatan, kota, dan kode pos.
• Data Transaksi: Riwayat pembelian, metode pembayaran (terenkripsi), dan detail pesanan.
• Data Teknis: Alamat IP, jenis perangkat, browser, dan data penggunaan platform.

Kami tidak menyimpan data lengkap kartu kredit/debit Anda. Semua transaksi kartu diproses langsung melalui payment gateway berlisensi OJK.`,
  },
  {
    title: "2. Cara Kami Menggunakan Informasi Anda",
    content: `Informasi yang kami kumpulkan digunakan untuk:

• Memproses dan mengkonfirmasi pesanan Anda.
• Mengirimkan notifikasi status pengiriman dan pembaruan pesanan.
• Memberikan layanan pelanggan dan respons atas pertanyaan Anda.
• Mengirimkan informasi promosi dan penawaran (dengan persetujuan Anda).
• Meningkatkan kualitas platform, produk, dan layanan kami.
• Mematuhi kewajiban hukum dan regulasi yang berlaku.`,
  },
  {
    title: "3. Keamanan Data",
    content: `Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasi yang ketat:

• Enkripsi SSL/TLS 256-bit untuk semua transmisi data.
• Penyimpanan data terenkripsi di server yang aman di wilayah Indonesia.
• Akses data dibatasi hanya pada karyawan yang membutuhkan untuk keperluan layanan.
• Audit keamanan berkala oleh pihak ketiga independen.
• Sistem deteksi dan pencegahan intrusi (IDS/IPS) aktif 24/7.`,
  },
  {
    title: "4. Berbagi Data dengan Pihak Ketiga",
    content: `Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda. Kami hanya membagikan data kepada:

• Mitra logistik (JNE, SiCepat, J&T) untuk keperluan pengiriman pesanan.
• Payment gateway berlisensi OJK untuk memproses pembayaran.
• Penyedia layanan teknologi yang mendukung operasi platform kami.
• Otoritas hukum jika diwajibkan oleh peraturan perundang-undangan yang berlaku.

Semua pihak ketiga terikat perjanjian kerahasiaan data yang ketat.`,
  },
  {
    title: "5. Cookie dan Teknologi Pelacakan",
    content: `Platform kami menggunakan cookie dan teknologi serupa untuk:

• Mengingat preferensi dan sesi login Anda.
• Menganalisis pola penggunaan untuk meningkatkan performa platform.
• Menyajikan konten dan rekomendasi yang relevan.

Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda. Namun, menonaktifkan cookie tertentu dapat mempengaruhi fungsi platform.`,
  },
  {
    title: "6. Hak-Hak Anda",
    content: `Sebagai pengguna, Anda memiliki hak untuk:

• Mengakses data pribadi yang kami simpan tentang Anda.
• Memperbarui atau mengoreksi data yang tidak akurat.
• Meminta penghapusan akun dan data pribadi Anda.
• Menolak penggunaan data untuk keperluan pemasaran.
• Meminta portabilitas data dalam format yang dapat dibaca mesin.

Untuk menggunakan hak-hak ini, hubungi kami di ${SITE_CONFIG.email.privacy}.`,
  },
  {
    title: "7. Retensi Data",
    content: `Kami menyimpan data Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Data transaksi disimpan sesuai kewajiban perpajakan (minimal 5 tahun). Setelah penghapusan akun, data akan dihapus secara permanen dalam 30 hari, kecuali ada kewajiban hukum untuk menyimpannya lebih lama.`,
  },
  {
    title: "8. Perubahan Kebijakan",
    content: `Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan material akan diberitahukan melalui email dan/atau notifikasi di platform setidaknya 30 hari sebelum berlaku. Penggunaan platform setelah notifikasi tersebut dianggap sebagai persetujuan Anda terhadap perubahan kebijakan.`,
  },
  {
    title: "9. Hubungi Kami",
    content: `Jika Anda memiliki pertanyaan atau kekhawatiran mengenai kebijakan privasi ini, hubungi kami:\n\nEmail: ${SITE_CONFIG.email.privacy}\nTelepon: ${SITE_CONFIG.phone}\nAlamat: ${SITE_CONFIG.address}`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-20">
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">Legal</span>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Kebijakan Privasi</h1>
          <p className="text-muted-foreground">Terakhir diperbarui: {lastUpdated}</p>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Si4Care berkomitmen melindungi privasi dan keamanan data pribadi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-xl font-bold mb-4 text-foreground">{s.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">{s.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
            Dokumen ini berlaku efektif sejak tanggal pembaruan terakhir di atas dan menggantikan semua kebijakan privasi sebelumnya.
          </div>
        </div>
      </section>
    </div>
  );
}
