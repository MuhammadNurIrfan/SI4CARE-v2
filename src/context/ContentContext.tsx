"use client";

/**
 * CMS Konten — semua teks landing page, FAQ, testimoni, CTA, dan artikel
 * dapat diedit per-section secara mandiri oleh admin di /admin/content.
 * Persist di localStorage (prototipe presentasi — belum ada backend).
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/* ── Tipe data ── */
export type HeroContent = {
  badge: string;
  title: string;          // baris judul (pisahkan baris dengan \n)
  titleHighlight: string; // baris terakhir dengan warna gradien
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type CtaContent = {
  kicker: string;
  judul: string;
  subjudul: string;
  tombolUtama: string;
  tombolSekunder: string;
};

export type Testimoni = { id: string; name: string; role: string; content: string };
export type FaqItem = { id: string; q: string; a: string };

export type ArtikelStatus = "draft" | "terbit" | "terjadwal";
export type Artikel = {
  id: string;
  title: string;
  category: string;
  status: ArtikelStatus;
  date: string;
  excerpt: string;
  body: string;
};

export const SECTION_META = [
  { key: "hero", label: "Hero", desc: "Judul utama, subjudul, dan tombol CTA" },
  { key: "social", label: "Social Proof", desc: "Marquee merek terpercaya" },
  { key: "benefits", label: "Keunggulan", desc: "6 nilai jual utama" },
  { key: "how", label: "Cara Belanja", desc: "4 langkah pembelian" },
  { key: "products", label: "Produk Unggulan", desc: "Carousel produk terlaris" },
  { key: "quality", label: "Komitmen Kualitas", desc: "Band lifestyle + statistik" },
  { key: "testimonials", label: "Testimonial", desc: "Carousel ulasan pelanggan" },
  { key: "faq", label: "FAQ", desc: "Pertanyaan umum" },
  { key: "cta", label: "CTA Penutup", desc: "Ajakan belanja terakhir" },
] as const;

export type SiteContent = {
  hero: HeroContent;
  sections: Record<string, boolean>;
  testimonials: Testimoni[];
  faq: FaqItem[];
  cta: CtaContent;
};

/* ── Konten default (sesuai tampilan saat ini) ── */
const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: "Terdaftar BPOM · Izin Alkes Resmi Kemenkes",
    title: "Alat kesehatan\nterpercaya untuk",
    titleHighlight: "keluarga & klinik.",
    subtitle:
      "Tensimeter, nebulizer, kursi roda, oximeter, dan ribuan produk alkes lainnya — 100% original, harga transparan, dikirim langsung ke pintu Anda.",
    ctaPrimary: "Lihat Produk Lengkap",
    ctaSecondary: "Cara Pembelian",
  },
  sections: Object.fromEntries(SECTION_META.map((s) => [s.key, true])),
  testimonials: [
    { id: "t1", name: "Ibu Dewi Kusuma", role: "Ibu Rumah Tangga · Surabaya", content: "Tensimeter OMRON yang saya beli kondisinya mulus, segel masih utuh, dan lengkap dengan garansi resmi. Pengiriman cepat — 2 hari sudah sampai. Puas banget!" },
    { id: "t2", name: "dr. Aditya Prasetyo", role: "Dokter Umum · Klinik Pratama Sehat", content: "Saya rutin beli masker dan sarung tangan medis untuk klinik. Kualitas terjaga, harga kompetitif, dan ada faktur untuk pembukuan. Pelayanan responsif." },
    { id: "t3", name: "Bpk. Hendra Wijaya", role: "Caregiver · Jakarta Selatan", content: "Kursi roda untuk ayah saya tiba dalam kondisi sempurna, terbungkus rapi. CS membantu saya memilih ukuran yang tepat sebelum beli. Sangat merekomendasikan!" },
    { id: "t4", name: "Siti Rahayu, S.Farm.", role: "Apoteker · Apotek Keluarga Sehat", content: "Sudah langganan untuk kebutuhan alkes apotek. Produk selalu tersedia, pengiriman tepat waktu, dan ada opsi faktur pajak yang memudahkan pembukuan kami." },
    { id: "t5", name: "Ibu Nana Marliana", role: "Pasien Hipertensi · Bandung", content: "Sudah beli tensimeter 2 kali dan keduanya original. Harganya lebih murah dibanding toko offline. Proses belanja mudah dan ada panduan cara pakainya." },
    { id: "t6", name: "Bpk. Rudi Santoso", role: "Pemilik Home Care · Medan", content: "Belanja alkes dalam jumlah banyak untuk layanan home care. Tim B2B membantu menegosiasikan harga terbaik dan pengiriman terjadwal. Sangat profesional." },
  ],
  faq: [
    { id: "f1", q: "Apakah semua produk dijamin original?", a: "Ya. Setiap produk berasal dari distributor resmi atau langsung dari principal, lengkap dengan nomor izin edar BPOM/Kemenkes serta garansi resmi pabrik." },
    { id: "f2", q: "Metode pembayaran apa saja yang tersedia?", a: "Kami mendukung QRIS, Virtual Account (transfer bank), kartu kredit, dan dompet digital melalui Midtrans. Pembayaran aman dan terenkripsi. Saat ini kami belum melayani COD." },
    { id: "f3", q: "Berapa lama estimasi pengiriman?", a: "Untuk wilayah Jabodetabek umumnya 1–2 hari, dan 2–5 hari untuk luar Jawa, tergantung kurir (JNE, SiCepat, J&T). Nomor resi dapat Anda lacak langsung dari akun." },
    { id: "f4", q: "Apakah produk bergaransi dan bisa diretur?", a: "Tentu. Garansi resmi berlaku 1–5 tahun tergantung merek. Jika produk rusak saat diterima, Anda dapat mengajukan retur dalam masa retur sesuai kebijakan kami." },
    { id: "f5", q: "Apakah bisa beli dalam jumlah besar untuk klinik/apotek?", a: "Bisa. Tim B2B kami melayani pembelian grosir dengan harga khusus dan faktur pajak resmi untuk kebutuhan klinik, apotek, dan layanan home care." },
  ],
  cta: {
    kicker: "Mulai belanja sekarang",
    judul: "Kebutuhan alat kesehatan Anda, ada di sini.",
    subjudul: "Dari tensimeter untuk keluarga hingga peralatan klinik — lebih dari 500 produk alkes original siap dikirim ke seluruh Indonesia.",
    tombolUtama: "Belanja Sekarang",
    tombolSekunder: "Konsultasi Gratis",
  },
};

const STORAGE_KEY = "si4care_content_v1";

type Ctx = {
  content: SiteContent;
  /** Update satu section saja — section lain tidak tersentuh */
  updateSection: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;
  resetContent: () => void;
};

const ContentContext = createContext<Ctx | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // merge agar field baru dari default tetap ada
        setContent({ ...DEFAULT_CONTENT, ...saved, hero: { ...DEFAULT_CONTENT.hero, ...saved.hero }, cta: { ...DEFAULT_CONTENT.cta, ...saved.cta } });
      }
    } catch { /* abaikan */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    } catch { /* abaikan */ }
  }, [content, hydrated]);

  const updateSection: Ctx["updateSection"] = (key, value) =>
    setContent((prev) => ({ ...prev, [key]: value }));

  const resetContent = () => setContent(DEFAULT_CONTENT);

  return (
    <ContentContext.Provider value={{ content, updateSection, resetContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent harus dipakai di dalam ContentProvider");
  return ctx;
}
