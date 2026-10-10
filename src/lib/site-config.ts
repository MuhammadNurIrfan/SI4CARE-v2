/**
 * Data kontak & identitas toko — SATU tempat untuk diganti.
 *
 * ⚠️ SEMUA NILAI DI BAWAH INI ADALAH CONTOH. Ganti dengan data toko yang sebenarnya sebelum situs dibuka ke
 * publik: nomor WhatsApp tombol chat, telepon/alamat/email di footer, halaman Kontak, Kebijakan Privasi,
 * Syarat & Ketentuan, FAQ, dan struk POS semuanya membaca dari sini.
 *
 * Dulu data ini ditulis ulang di ±10 file dengan dua versi alamat yang berbeda (Jakarta Selatan 12345 vs
 * Menteng, Jakarta Pusat 10310) dan dua nomor telepon.
 */
export const SITE_CONFIG = {
  name: "si4care",
  /** Nomor WhatsApp format internasional TANPA "+" (mis. 6281234567890). Nomor contoh di bawah tidak aktif. */
  whatsapp: "6285555555555",
  /** Telepon yang ditampilkan di footer & kebijakan privasi. */
  phone: "+62 812 3456 7890",
  email: {
    general: "hello@si4care.id",
    privacy: "privacy@si4care.id",
    legal: "legal@si4care.id",
    b2b: "b2b@si4care.id",
  },
  /** Alamat lengkap (footer, kontak, kebijakan privasi, S&K). */
  address: "Jl. Kesehatan No. 123, Menteng, Jakarta Pusat 10310",
  /** Versi singkat untuk struk POS. */
  addressShort: "Jl. Kesehatan No. 123, Jakarta Pusat",
  hours: "Sen–Jum 08.00–17.00 · Sab 09.00–13.00 WIB",
} as const;
