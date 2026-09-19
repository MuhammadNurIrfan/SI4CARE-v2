"use server";

import { db } from "@/lib/db";
import { contentSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { HeroContent, CtaContent, Testimoni, FaqItem } from "@/context/ContentContext";

export type ContentData = {
  hero: HeroContent;
  sections: Record<string, boolean>;
  testimonials: Testimoni[];
  faq: FaqItem[];
  cta: CtaContent;
};

const DEFAULT_CONTENT: ContentData = {
  hero: {
    badge: "Terdaftar BPOM · Izin Alkes Resmi Kemenkes",
    title: "Alat kesehatan\nterpercaya untuk",
    titleHighlight: "keluarga & klinik.",
    subtitle:
      "Tensimeter, nebulizer, kursi roda, oximeter, dan ribuan produk alkes lainnya — 100% original, harga transparan, dikirim langsung ke pintu Anda.",
    ctaPrimary: "Lihat Produk Lengkap",
    ctaSecondary: "Cara Pembelian",
  },
  sections: {
    hero: true,
    social: true,
    benefits: true,
    how: true,
    products: true,
    quality: true,
    testimonials: true,
    faq: true,
    cta: true,
  },
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

export async function getContentSections(): Promise<ContentData> {
  try {
    const result = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, "landing"))
      .limit(1);

    if (result.length === 0) {
      return DEFAULT_CONTENT;
    }

    const saved = result[0].data as ContentData;
    // Merge dengan default agar field baru tetap ada
    return {
      hero: { ...DEFAULT_CONTENT.hero, ...saved.hero },
      sections: { ...DEFAULT_CONTENT.sections, ...saved.sections },
      testimonials: saved.testimonials || DEFAULT_CONTENT.testimonials,
      faq: saved.faq || DEFAULT_CONTENT.faq,
      cta: { ...DEFAULT_CONTENT.cta, ...saved.cta },
    };
  } catch (e) {
    console.error("Error fetching content sections:", e);
    return DEFAULT_CONTENT;
  }
}

export async function updateContentSection(key: string, data: Partial<ContentData>): Promise<void> {
  try {
    // Get current content
    const current = await getContentSections();
    const merged = { ...current, ...data };

    // Check if exists, update or insert
    const existing = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, "landing"))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(contentSections)
        .set({
          data: merged,
          updatedAt: new Date(),
        })
        .where(eq(contentSections.key, "landing"))
        .execute();
    } else {
      await db
        .insert(contentSections)
        .values({
          key: "landing",
          data: merged,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    }
  } catch (e) {
    console.error("Error updating content section:", e);
    throw new Error("Gagal menyimpan konten");
  }
}

export async function resetContent(): Promise<void> {
  try {
    await db.delete(contentSections).where(eq(contentSections.key, "landing")).execute();
  } catch (e) {
    console.error("Error resetting content:", e);
    throw new Error("Gagal reset konten");
  }
}
