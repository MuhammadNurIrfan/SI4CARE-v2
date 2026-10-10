/**
 * Seed script — isi data demo ke DB lokal.
 * Jalankan: npm run db:seed
 *
 * Aman dijalankan berulang (idempotent): skip jika data sudah ada.
 */
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "./index";
import { categories, products, variants, batches, vouchers, contentSections, articles } from "./schema";
import { user, account } from "./auth-schema";
import type { ContentData } from "@/actions/content";

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Password seed dibaca dari environment, bukan di-hardcode — supaya repo tidak
 * pernah memuat kredensial yang berfungsi. Nama variabelnya ada di `.env.example`.
 */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `\n❌ Env ${name} belum diisi.\n` +
      `   Seed butuh password dari environment agar tidak ada kredensial di repo.\n` +
      `   Isi di .env.local (lihat .env.example), lalu jalankan ulang.\n`,
    );
    process.exit(1);
  }
  return v;
}

function uuid() {
  return randomUUID();
}

async function upsertCategory(id: string, data: { name: string; description?: string }) {
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id));
  if (existing.length === 0) {
    await db.insert(categories).values({ id, ...data });
    console.log(`  ✓ Kategori: ${data.name}`);
  }
  return id;
}

async function upsertProduct(
  id: string,
  data: { categoryId: string; name: string; brand?: string; description?: string },
) {
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, id));
  if (existing.length === 0) {
    await db.insert(products).values({ id, isActive: true, ...data });
    console.log(`  ✓ Produk: ${data.name}`);
  }
  return id;
}

async function upsertVariant(
  id: string,
  data: {
    productId: string;
    sku: string;
    activePrice: number;
    minStock?: number;
    stockMode?: "fifo" | "fefo";
    barcode?: string;
  },
) {
  const existing = await db.select({ id: variants.id }).from(variants).where(eq(variants.id, id));
  if (existing.length === 0) {
    await db.insert(variants).values({
      id,
      sku: data.sku,
      productId: data.productId,
      activePrice: String(data.activePrice),
      minStock: data.minStock ?? 5,
      stockMode: data.stockMode ?? "fifo",
      barcode: data.barcode ?? null,
      isActive: true,
    });
    console.log(`    ✓ Varian SKU: ${data.sku} — Rp ${data.activePrice.toLocaleString("id-ID")}`);
  }
  return id;
}

async function addBatch(variantId: string, data: { hpp: number; quantity: number; supplier?: string; expiredDate?: string }) {
  await db.insert(batches).values({
    id: uuid(),
    variantId,
    hpp: String(data.hpp),
    quantity: data.quantity,
    remaining: data.quantity,
    supplier: data.supplier ?? "Distributor Demo",
    expiredDate: data.expiredDate ?? null,
    batchNumber: `SEED-${Date.now()}`,
  });
  console.log(`      + Batch: ${data.quantity} unit @ HPP Rp ${data.hpp.toLocaleString("id-ID")}`);
}

async function upsertVoucher(code: string, data: {
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  validDays?: number;
}) {
  const existing = await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, code));
  if (existing.length === 0) {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + (data.validDays ?? 365));
    await db.insert(vouchers).values({
      id: uuid(),
      code,
      type: data.type,
      value: String(data.value),
      minOrder: data.minOrder ? String(data.minOrder) : null,
      maxDiscount: data.maxDiscount ? String(data.maxDiscount) : null,
      validFrom: now,
      validUntil: until,
      isActive: true,
      usedCount: 0,
    });
    console.log(`  ✓ Voucher: ${code} (${data.type === "percent" ? data.value + "%" : "Rp " + data.value.toLocaleString("id-ID")})`);
  }
}

async function upsertAdmin(data: { id: string; name: string; email: string; password: string; role: string }) {
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, data.email));
  if (existing.length > 0) {
    console.log(`  ✓ User "${data.email}" sudah ada — skip`);
    return;
  }
  const hashed = await hashPassword(data.password);
  await db.insert(user).values({
    id: data.id,
    name: data.name,
    email: data.email,
    emailVerified: true,
    role: data.role,
  });
  await db.insert(account).values({
    id: uuid(),
    accountId: data.id,
    providerId: "credential",
    userId: data.id,
    password: hashed,
  });
  console.log(`  ✓ User: ${data.email} (role: ${data.role})`);
}

// ─── IDs tetap agar idempotent ────────────────────────────────────────────────

// UUID 36-char tetap agar idempotent
const CAT = {
  diagnostik: "11000000-0000-0000-0000-000000000001",
  terapi:     "11000000-0000-0000-0000-000000000002",
  bantu:      "11000000-0000-0000-0000-000000000003",
  apd:        "11000000-0000-0000-0000-000000000004",
};

const PROD = {
  omronHem7120: "22000000-0000-0000-0000-000000000001",
  omronNec28:   "22000000-0000-0000-0000-000000000002",
  oximeter:     "22000000-0000-0000-0000-000000000003",
  wheelchair:   "22000000-0000-0000-0000-000000000004",
  masker3ply:   "22000000-0000-0000-0000-000000000005",
  maskerN95:    "22000000-0000-0000-0000-000000000006",
  termometer:   "22000000-0000-0000-0000-000000000007",
  stetoskop:    "22000000-0000-0000-0000-000000000008",
};

const VAR = {
  omronHem7120Std:   "33000000-0000-0000-0000-000000000001",
  omronHem7120Paket: "33000000-0000-0000-0000-000000000002",
  omronNec28:        "33000000-0000-0000-0000-000000000003",
  oximeter:          "33000000-0000-0000-0000-000000000004",
  wheelchairStd:     "33000000-0000-0000-0000-000000000005",
  masker3plyBox:     "33000000-0000-0000-0000-000000000006",
  maskerN95:         "33000000-0000-0000-0000-000000000007",
  termometer:        "33000000-0000-0000-0000-000000000008",
  stetoskop:         "33000000-0000-0000-0000-000000000009",
};

// ─── Content Sections (CMS) ──────────────────────────────────────────────────

async function upsertContentSections() {
  const existing = await db
    .select({ key: contentSections.key })
    .from(contentSections)
    .where(eq(contentSections.key, "landing"));

  if (existing.length > 0) {
    console.log("  ✓ Content sections sudah ada — skip");
    return;
  }

  const defaultContent: ContentData = {
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
      subjudul: "Dari tensimeter untuk keluarga hingga peralatan klinik — alat kesehatan original dan bergaransi resmi siap dikirim ke seluruh Indonesia.",
      tombolUtama: "Belanja Sekarang",
      tombolSekunder: "Konsultasi Gratis",
    },
  };

  await db
    .insert(contentSections)
    .values({
      key: "landing",
      data: defaultContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();
  console.log("  ✓ Content sections (landing page)");
}

// ─── Main ────────────────────────────────────────────────────────────────────

// ─── Artikel blog contoh ─────────────────────────────────────────────────────
// Konten contoh agar blog dan bagian "Artikel" di landing tidak kosong saat demo.
// Isinya panduan umum, bukan nasihat medis. GANTI dengan tulisan asli lewat /admin/content.
// Artikel seed lama dulu dimasukkan langsung ke XAMPP dan tidak pernah tercatat di repo,
// sehingga hilang saat pindah ke PostgreSQL.

const SEED_ARTICLES = [
  {
    id: "article-seed-0001",
    slug: "cara-memilih-tensimeter-digital-yang-akurat-untuk-di-rumah",
    title: "Cara memilih tensimeter digital yang akurat untuk di rumah",
    category: "Panduan",
    excerpt: "Lengan vs. pergelangan, ukuran manset, dan fitur yang benar-benar penting saat memantau tekanan darah.",
    metaDescription: "Panduan memilih tensimeter digital untuk di rumah: tipe lengan atas atau pergelangan, ukuran manset, dan fitur yang perlu diperhatikan.",
    daysAgo: 21,
    body: `Memantau tekanan darah secara rutin di rumah membantu Anda dan dokter melihat pola harian yang tidak selalu tertangkap saat kunjungan singkat ke klinik. Hasilnya hanya berguna jika alatnya tepat dan cara memakainya benar.

## Lengan atas atau pergelangan tangan?

Tensimeter lengan atas umumnya lebih direkomendasikan karena hasilnya lebih konsisten. Tensimeter pergelangan lebih ringkas, tetapi hasilnya sangat dipengaruhi posisi tangan saat mengukur.

- Lengan atas: pilihan utama untuk pemakaian rutin di rumah.
- Pergelangan: bisa dipertimbangkan jika lengan sulit dipasangi manset, dengan syarat posisi tangan sejajar jantung.

## Pastikan ukuran manset sesuai

Ukuran manset yang tidak pas adalah sumber ketidakakuratan yang paling sering terlewat. Manset yang terlalu kecil cenderung membuat hasil lebih tinggi dari sebenarnya, dan yang terlalu besar membuatnya lebih rendah. Ukur lingkar lengan atas Anda, lalu cocokkan dengan rentang ukuran yang tertera pada kemasan.

## Fitur yang perlu diperhatikan

- Izin edar dari Kemenkes dan garansi resmi.
- Memori pengukuran untuk melihat riwayat.
- Indikator detak jantung tidak beraturan.
- Sumber daya: baterai, adaptor, atau keduanya.

## Tips mengukur di rumah

Duduk tenang selama sekitar lima menit dengan punggung bersandar dan kaki menapak lantai. Letakkan lengan sejajar jantung, hindari kafein dan merokok setidaknya 30 menit sebelumnya, lalu ambil dua kali pengukuran dengan jeda satu menit.

Tensimeter rumah membantu pemantauan, bukan pengganti pemeriksaan. Konsultasikan hasil Anda dengan dokter sebelum mengambil keputusan terkait pengobatan.`,
  },
  {
    id: "article-seed-0002",
    slug: "menyimpan-dan-merawat-alat-kesehatan-agar-awet-dan-higienis",
    title: "Menyimpan & merawat alat kesehatan agar awet dan higienis",
    category: "Kesehatan",
    excerpt: "Tips sederhana menjaga nebulizer, oximeter, dan termometer tetap berfungsi optimal.",
    metaDescription: "Cara menyimpan dan merawat nebulizer, pulse oximeter, dan termometer agar tahan lama dan tetap higienis.",
    daysAgo: 14,
    body: `Alat kesehatan rumah tangga bekerja paling baik jika dirawat dengan benar. Perawatan yang sederhana memperpanjang umur alat sekaligus menjaga kebersihannya, terutama untuk alat yang bersentuhan langsung dengan tubuh.

## Prinsip umum

- Baca buku panduan dan ikuti petunjuk pembersihan dari pabrik. Cara membersihkan setiap alat berbeda.
- Simpan di tempat kering, sejuk, dan jauh dari sinar matahari langsung.
- Lepas baterai jika alat tidak dipakai dalam waktu lama agar tidak bocor dan merusak komponen.
- Simpan kemasan asli dan kartu garansi.

## Nebulizer

Bagian yang bersentuhan dengan obat dan napas, seperti masker dan wadah obat, perlu dibersihkan setelah setiap pemakaian sesuai petunjuk pabrik. Keringkan sampai benar-benar kering sebelum disimpan, dan ganti masker serta filter sesuai interval yang dianjurkan.

## Pulse oximeter

Bersihkan bagian penjepit yang menyentuh jari dengan kain lembut atau tisu pembersih yang sesuai petunjuk. Hindari merendam alat dalam cairan.

## Termometer

Bersihkan ujung sensor setelah dipakai, terutama jika digunakan bergantian oleh beberapa orang. Untuk termometer inframerah, jaga lensa sensor tetap bersih dan bebas goresan.

## Kapan perlu diperiksa

Jika hasil pengukuran terasa tidak wajar, periksa baterai dan cara pemakaian lebih dulu. Bila masalah berlanjut, hubungi layanan garansi resmi merek tersebut.`,
  },
  {
    id: "article-seed-0003",
    slug: "checklist-perlengkapan-medis-dasar-untuk-klinik-pratama",
    title: "Checklist perlengkapan medis dasar untuk klinik pratama",
    category: "Klinik",
    excerpt: "Daftar alat diagnostik dan habis pakai yang wajib tersedia untuk operasional klinik pratama.",
    metaDescription: "Checklist perlengkapan medis dasar untuk klinik pratama: alat diagnostik, bahan habis pakai, dan pelindung diri.",
    daysAgo: 7,
    body: `Menyiapkan klinik pratama berarti memastikan perlengkapan dasar tersedia sebelum pasien pertama datang. Daftar berikut adalah titik awal yang umum, bukan pengganti ketentuan resmi.

## Alat diagnostik

- Tensimeter dan stetoskop
- Termometer
- Pulse oximeter
- Timbangan dan alat ukur tinggi badan

## Bahan habis pakai

- Kasa, plester, dan perban
- Alcohol swab dan cairan antiseptik
- Spuit dan jarum sekali pakai
- Wadah limbah benda tajam (safety box)

## Alat pelindung diri

- Masker medis
- Sarung tangan sekali pakai
- Pelindung wajah atau kacamata pelindung sesuai kebutuhan

## Hal yang sering terlupa

Atur pencatatan stok dan tanggal kedaluwarsa sejak awal. Bahan habis pakai dengan masa kedaluwarsa sebaiknya dipakai dengan prinsip yang kedaluwarsa lebih dulu keluar lebih dulu, agar tidak ada yang terbuang.

Kebutuhan lengkap bergantung pada jenis layanan yang diberikan. Selalu sesuaikan dengan ketentuan Kementerian Kesehatan dan dinas kesehatan setempat.`,
  },
];

async function upsertArticles() {
  const existing = await db.select({ slug: articles.slug }).from(articles);
  const have = new Set(existing.map((a) => a.slug));
  let added = 0;
  for (const a of SEED_ARTICLES) {
    if (have.has(a.slug)) continue;
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - a.daysAgo);
    await db.insert(articles).values({
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      excerpt: a.excerpt,
      body: a.body,
      metaTitle: a.title.slice(0, 70),
      metaDescription: a.metaDescription,
      status: "terbit",
      publishedAt,
    });
    added++;
  }
  console.log(added > 0 ? `  ✓ ${added} artikel contoh ditambahkan` : "  ✓ Artikel sudah ada — skip");
}

async function seed() {
  console.log("\n🌱 Memulai seeding database...\n");

  // ── Akun Admin ────────────────────────────────────────────────────────────
  console.log("👤 Akun:");
  await upsertAdmin({
    id: "admin-0000-0000-0000-000000000001",
    name: "Admin SI4CARE",
    email: "admin@si4care.com",
    password: requireEnv("SEED_ADMIN_PASSWORD"),
    role: "admin",
  });
  await upsertAdmin({
    id: "admin-0000-0000-0000-000000000002",
    name: "Super Admin",
    email: "superadmin@si4care.com",
    password: requireEnv("SEED_SUPERADMIN_PASSWORD"),
    role: "super_admin",
  });

  // ── Kategori ──────────────────────────────────────────────────────────────
  console.log("📁 Kategori:");
  await upsertCategory(CAT.diagnostik, { name: "Alat Diagnostik", description: "Tensimeter, oximeter, termometer, stetoskop, dll." });
  await upsertCategory(CAT.terapi,     { name: "Alat Terapi",     description: "Nebulizer, TENS, lampu terapi, dll." });
  await upsertCategory(CAT.bantu,      { name: "Alat Bantu Jalan", description: "Kursi roda, kruk, tongkat, walker, dll." });
  await upsertCategory(CAT.apd,        { name: "APD & Masker",    description: "Masker medis, masker N95, sarung tangan, APD lengkap." });

  // ── Produk + Varian + Batch ───────────────────────────────────────────────
  console.log("\n📦 Produk & Stok:");

  // 1. Tensimeter Omron HEM-7120 (2 varian)
  await upsertProduct(PROD.omronHem7120, { categoryId: CAT.diagnostik, name: "Tensimeter Digital Omron HEM-7120", brand: "Omron", description: "Tensimeter lengan atas dengan teknologi IntelliSense. Deteksi detak jantung tidak beraturan, garansi 5 tahun." });
  await upsertVariant(VAR.omronHem7120Std, { productId: PROD.omronHem7120, sku: "OMR-HEM7120-STD", activePrice: 540000, minStock: 3, barcode: "8901234500001" });
  await addBatch(VAR.omronHem7120Std, { hpp: 420000, quantity: 15, supplier: "PT Omron Healthcare Indonesia" });
  await upsertVariant(VAR.omronHem7120Paket, { productId: PROD.omronHem7120, sku: "OMR-HEM7120-PKT", activePrice: 650000, minStock: 2, barcode: "8901234500002" });
  await addBatch(VAR.omronHem7120Paket, { hpp: 510000, quantity: 8, supplier: "PT Omron Healthcare Indonesia" });

  // 2. Nebulizer Omron NE-C28
  await upsertProduct(PROD.omronNec28, { categoryId: CAT.terapi, name: "Nebulizer Kompresor Omron NE-C28", brand: "Omron", description: "Nebulizer kompresor untuk terapi pernapasan di rumah. Partikel halus optimal, suara rendah." });
  await upsertVariant(VAR.omronNec28, { productId: PROD.omronNec28, sku: "OMR-NEC28", activePrice: 620000, minStock: 3, barcode: "8901234500003" });
  await addBatch(VAR.omronNec28, { hpp: 480000, quantity: 10, supplier: "PT Omron Healthcare Indonesia" });

  // 3. Pulse Oximeter Yuwell
  await upsertProduct(PROD.oximeter, { categoryId: CAT.diagnostik, name: "Pulse Oximeter Fingertip Yuwell", brand: "Yuwell", description: "Pengukur saturasi oksigen darah (SpO2) dan denyut nadi. Layar OLED, mudah dibaca." });
  await upsertVariant(VAR.oximeter, { productId: PROD.oximeter, sku: "YUW-OXI-FT", activePrice: 175000, minStock: 5, barcode: "8901234500004" });
  await addBatch(VAR.oximeter, { hpp: 120000, quantity: 30, supplier: "CV Yuwell Medika" });

  // 4. Kursi Roda Sella
  await upsertProduct(PROD.wheelchair, { categoryId: CAT.bantu, name: "Kursi Roda Lipat Standar Sella", brand: "Sella", description: "Kursi roda lipat rangka baja, sandaran tangan bisa dilepas, cocok untuk dalam maupun luar ruangan." });
  await upsertVariant(VAR.wheelchairStd, { productId: PROD.wheelchair, sku: "SEL-WC-STD", activePrice: 1250000, minStock: 2, barcode: "8901234500005" });
  await addBatch(VAR.wheelchairStd, { hpp: 950000, quantity: 5, supplier: "PT Sella Medical" });

  // 5. Masker Medis 3-Ply OneMed (FEFO — ada expired date)
  await upsertProduct(PROD.masker3ply, { categoryId: CAT.apd, name: "Masker Medis 3-Ply OneMed (Box 50)", brand: "OneMed", description: "Masker medis 3 lapis, efisiensi filtrasi ≥95%, nyaman dipakai seharian, bersertifikat SNI." });
  await upsertVariant(VAR.masker3plyBox, { productId: PROD.masker3ply, sku: "OM-MSK3PLY-50", activePrice: 25000, minStock: 10, stockMode: "fefo", barcode: "8901234500006" });
  await addBatch(VAR.masker3plyBox, { hpp: 18000, quantity: 100, supplier: "PT OneMed Indonesia", expiredDate: "2027-12-31" });

  // 6. Masker N95 GEA Medical
  await upsertProduct(PROD.maskerN95, { categoryId: CAT.apd, name: "Masker N95 GEA Medical (isi 20)", brand: "GEA Medical", description: "Respirator N95 partikulat, efisiensi filtrasi ≥95%, dilengkapi nose clip aluminium, bersertifikat NIOSH." });
  await upsertVariant(VAR.maskerN95, { productId: PROD.maskerN95, sku: "GEA-N95-20", activePrice: 95000, minStock: 5, stockMode: "fefo", barcode: "8901234500007" });
  await addBatch(VAR.maskerN95, { hpp: 70000, quantity: 40, supplier: "PT GEA Medical", expiredDate: "2026-06-30" });

  // 7. Termometer Infrared
  await upsertProduct(PROD.termometer, { categoryId: CAT.diagnostik, name: "Termometer Tembak Infrared OneMed", brand: "OneMed", description: "Termometer non-kontak infrared untuk dahi & telinga, respons <1 detik, akurasi ±0,2°C." });
  await upsertVariant(VAR.termometer, { productId: PROD.termometer, sku: "OM-THERMO-IR", activePrice: 150000, minStock: 5, barcode: "8901234500008" });
  await addBatch(VAR.termometer, { hpp: 100000, quantity: 25, supplier: "PT OneMed Indonesia" });

  // 8. Stetoskop GEA Medical
  await upsertProduct(PROD.stetoskop, { categoryId: CAT.diagnostik, name: "Stetoskop Dual Head GEA Medical", brand: "GEA Medical", description: "Stetoskop dual head untuk dewasa & anak, membran presisi, selang anti-kink, nyaman di telinga." });
  await upsertVariant(VAR.stetoskop, { productId: PROD.stetoskop, sku: "GEA-STETO-DH", activePrice: 165000, minStock: 3, barcode: "8901234500009" });
  await addBatch(VAR.stetoskop, { hpp: 120000, quantity: 20, supplier: "PT GEA Medical" });

  // ── CMS Content ───────────────────────────────────────────────────────────
  console.log("\n📝 CMS Content:");
  await upsertContentSections();

  // ── Voucher demo ──────────────────────────────────────────────────────────
  console.log("\n📰 Artikel:");
  await upsertArticles();

  console.log("\n🎟️  Voucher:");
  await upsertVoucher("SEHAT10", { type: "percent", value: 10, minOrder: 100000, maxDiscount: 50000 });
  await upsertVoucher("ALKES5",  { type: "percent", value: 5,  minOrder: 50000 });
  await upsertVoucher("DISKON20RB", { type: "fixed", value: 20000, minOrder: 200000 });

  console.log("\n✅ Seeding selesai!\n");
  console.log("Ringkasan:");
  console.log("  • 2 akun (admin@si4care.com, superadmin@si4care.com) — password dari SEED_ADMIN_PASSWORD / SEED_SUPERADMIN_PASSWORD");
  console.log("  • 4 kategori");
  console.log("  • 8 produk, 9 varian, 9 batch");
  console.log("  • Content sections (landing page dengan hero, testimonial, FAQ, CTA)");
  console.log("  • 3 voucher (SEHAT10, ALKES5, DISKON20RB)");
  console.log("\nBuka http://localhost:3000/shop untuk melihat hasilnya.\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});
