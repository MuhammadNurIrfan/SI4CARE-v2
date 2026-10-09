# PRD — si4care: Sistem Web Terintegrasi Alat Kesehatan  
## Company Profile + Online Shop + POS/Back-Office  

> **Versi Final** – diturunkan dari SRS v3.3 dan disesuaikan untuk implementasi **Next.js 16 (App Router) + Tailwind + shadcn/ui + Drizzle ORM + PostgreSQL + Better Auth**.  
> **Status: backend aktif.** Dokumen ini menjadi acuan tunggal pengembangan.
>
> **Perubahan sejak versi awal (2026-10-08):** database semula MySQL, kini **PostgreSQL di Supabase** — lihat
> [ADR-0002](docs/adr/0002-pindah-ke-postgresql-supabase.md). Contoh kode di dokumen ini sudah disesuaikan;
> implementasi sebenarnya ada di `src/lib/db/schema.ts`.

---

## Daftar Isi
1. [Overview](#1-overview)
2. [Requirements](#2-requirements)
3. [Core Features](#3-core-features)
4. [User Flow](#4-user-flow)
5. [Arsitektur Teknis](#5-arsitektur-teknis)
6. [Database Schema (Drizzle ORM)](#6-database-schema-drizzle-orm)
7. [Landing Page – Animasi Scroll & Desain Konten](#7-landing-page--animasi-scroll--desain-konten)
8. [Integrasi & Layanan Pihak Ketiga](#8-integrasi--layanan-pihak-ketiga)
9. [Critical Business Rules](#9-critical-business-rules)
10. [Checklist Implementasi (Developer)](#10-checklist-implementasi-developer)

---

## 1. Overview

si4care mendigitalkan dan menyatukan operasi toko alat kesehatan (alkes) ke dalam **satu aplikasi web** dengan tiga muka di atas **satu sumber data**:
- (1) **Company Profile/Landing** (dinamis, SEO, animasi scroll)
- (2) **Online Shop** (etalase, keranjang, checkout Midtrans)
- (3) **POS/Back-Office** (kasir, manajemen batch, laporan, validasi owner)

**Masalah yang diselesaikan:** stok dan harga terpecah antar kanal, HPP/laba sulit dilacak, dana mengendap, dan risiko menjual barang kedaluwarsa.

**Tujuan utama:**
- Stok & harga real‑time satu sumber
- HPP per batch (FIFO/FEFO) + manajemen ED
- Buku biaya per transaksi → laba bersih aktual
- Validasi dana settlement sebelum pengakuan laba final

**Fase implementasi:**
- **Fase 1 (MVP)** – Katalog/varian/batch, online shop + checkout Midtrans, ketahanan ongkir, POS dasar, PPN, laporan & ledger.
- **Fase 2** – Barcode/scan, subsidi ongkir, diskon/voucher, marketplace + settlement, FEFO + alarm ED + retur.
- **Fase 3** – Opname, backup terjadwal, blog SEO, multi-cabang.

---

## 2. Requirements

| Aspek               | Spesifikasi |
| ------------------- | ----------- |
| **Aksesibilitas**   | Responsif (desktop & mobile); HTTPS wajib (karena pembayaran & akses kamera). |
| **Pengguna & Peran**| Super Admin (full access + validasi keuangan + backup), Admin (operasional), Pelanggan. |
| **Input data**      | Manual + scan barcode (kamera) dengan fallback shutter manual. |
| **Spesifisitas data** | Stok berbasis **batch** (no. batch, HPP, qty, tgl masuk, ED, pemasok); produk → varian (atribut dinamis) → batch. |
| **Harga & stok**    | Single source of truth; harga aktif tunggal per varian; stok real‑time lintas kanal. |
| **Pembayaran**      | Midtrans (QRIS/VA/e-wallet/kartu). **Tidak ada COD.** |
| **Ongkir**          | RajaOngkir (Komerce) Starter + cache 24 jam (Redis) + fallback tabel ongkir cadangan. Checkout tidak boleh terblokir. |
| **Pajak**           | PKP aktif (PPN 12%) – tampil di struk/faktur. |
| **HPP**             | FIFO per batch (default); FEFO opsional untuk item ber-ED. |
| **Alarm (dashboard)** | Stok menipis/habis, batch mendekati/terlewat ED, margin negatif, dana pending melebihi batas, beban biaya membengkak. |
| **Keuangan**        | Buku biaya (ledger) per transaksi; laba final setelah dana settle & divalidasi Owner. |
| **Backup**          | Terjadwal otomatis ke cloud/drive + uji restore. |
| **Multi-cabang**    | Skema DB disiapkan (kolom `branch_id`); MVP satu cabang default. |

---

## 3. Core Features

### A. Publik (Storefront)
1. **Landing/Company Profile (CMS dinamis)** – Hero, Social Proof, Benefit, How It Works, Brand, Produk Unggulan, Testimonial, Blog, FAQ, CTA. Semua dapat diatur teks/gambar/urutan/on‑off. Navbar fixed + hamburger mobile. SEO optimized.
2. **Online Shop** – Etalase, filter kategori + pencarian, filter harga/urutan/ketersediaan, detail produk + pemilih varian (harga & stok per varian), qty, tombol Keranjang & Beli Langsung.
3. **Keranjang** – Ubah qty/hapus, partial checkout, kolom voucher, tersimpan per akun.
4. **Checkout & Pembayaran** – Pilih alamat (buku alamat), ongkir otomatis (cache+fallback), diskon/voucher + subsidi ongkir, Biaya Layanan bersyarat, PPN, bayar via Midtrans; webhook → Dibayar → potong stok FIFO/FEFO → catat ledger.
5. **Akun Pelanggan** – Login email/HP + Google, profil, buku alamat (alamat utama), riwayat pesanan, lacak resi, ajukan retur.
6. **Blog Publik** – Artikel + Schema.org + meta SEO.
7. **Retur Pelanggan** – Form pengajuan (item, alasan, foto) dalam masa retur.

### B. Back-Office / POS (Next.js)
8. **Dashboard + Alarm** – Grafik omzet/transaksi/laba per kanal; Uang Riil vs Dana Pending; alarm (stok, ED, margin, settlement, beban biaya); drill‑down.
9. **CMS Landing & Blog** – Kelola semua section + artikel.
10. **Master Kategori / Produk / Varian** – Atribut dinamis per produk; harga aktif tunggal; generate barcode 1D+QR siap cetak massal; izin edar; flag ED + mode FIFO/FEFO.
11. **Master Diskon & Subsidi Ongkir** – Engine subsidi ongkir (min. belanja + zona cover + plafon); voucher; diskon berjenjang; event; prioritas non‑tumpuk; promo clearance ED.
12. **Transaksi Keluar (multi‑kanal)** – POS kasir (scan/cari, tunai+kembalian, cetak struk), penjualan web (otomatis), marketplace; semua menarik stok & HPP FIFO/FEFO per batch + catat ledger.
13. **Transaksi Masuk → Batch** – Input restok membentuk batch (no. batch, HPP, qty, ED, pemasok); banyak item → satu transaksi.
14. **Manajemen Marketplace + Settlement** – Input manual pesanan per platform, booking stok, template biaya dinamis per platform, ongkir/resi manual, rekonsiliasi settlement (ekspektasi vs diterima) + validasi Owner.
15. **Stok & Kartu Stok** – Stok per varian (total + batch + ED), filter/pencarian, penanda min‑stok & mendekati ED; kartu stok in/out/koreksi/write‑off per batch; daftar batch mendekati/terlewat ED + write‑off.
16. **Stock Opname** – Scan/input fisik, selisih, penyesuaian + alasan (opname per batch opsional).
17. **Laporan & Buku Biaya** – Laba/rugi real‑time, per varian/produk/kategori/platform/batch; pemisahan Uang Riil vs Pending; laporan PPN, retur, write‑off ED; laporan beban biaya (ledger drill‑down); ekspor Excel/PDF.
18. **Backup** – Terjadwal (>1×/hari) ke cloud/drive + retensi + uji restore.
19. **Scan Lintas Modul** – Kamera + validasi manusia + fallback shutter + scan beruntun.
20. **Retur/Refund** – Persetujuan, karantina, inspeksi → layak jual/rusak/ED → write‑off; refund Midtrans/manual.
21. **Pengaturan** – PKP/PPN, faktur pajak, ambang alarm (termasuk hari ED), profil & alamat asal, Tabel Ongkir Cadangan, template biaya marketplace, Biaya Layanan, kredensial integrasi, audit log.

---

## 4. User Flow

### 4.1 Pelanggan
1. Buka landing (animasi scroll) → klik ke Online Shop.
2. Telusuri/cari produk → buka detail → pilih varian + qty.
3. **Tambah ke Keranjang** (wajib login) atau **Beli Langsung**.
4. Checkout: pilih alamat (buku alamat) → ongkir otomatis → terapkan voucher/subsidi → lihat PPN + Biaya Layanan → bayar via Midtrans.
5. Pantau status pesanan → lacak resi → (opsional) ajukan retur.

### 4.2 Admin (operasional)
1. Login → cek Dashboard (alarm stok/ED/pesanan).
2. **Barang datang:** Transaksi Masuk → buat batch (no. batch, HPP, ED) → stok bertambah.
3. **Penjualan kasir:** POS → scan/cari varian → qty → bayar (tunai/non‑tunai) → cetak struk.
4. **Pesanan web lunas:** otomatis jadi Transaksi Keluar (stok terpotong FIFO/FEFO).
5. **Pesanan marketplace:** input manual → booking stok → isi biaya platform + ongkir → kemas → input resi.
6. Proses & kirim pesanan (input resi) → status Selesai.
7. Stock opname berkala.

### 4.3 Super Admin (Owner)
1. Pantau Dashboard & alarm (margin, ED, beban biaya).
2. **Validasi dana:** buka daftar Pending → cocokkan settlement (ekspektasi vs diterima) → validasi → laba diakui final.
3. Kelola Pengaturan (pajak, ongkir cadangan, template biaya, Biaya Layanan, ambang alarm).
4. Kelola pengguna, write‑off ED/rusak, dan backup/restore.

---

## 5. Arsitektur Teknis

### 5.1 Stack

| Lapisan            | Teknologi                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| **Frontend publik**  | Next.js 16 (App Router), Tailwind CSS, shadcn/ui, React Hook Form + Zod   |
| **Admin/POS**        | Next.js + Server Components + shadcn/ui (Data Table, Form, Chart)         |
| **Backend API**      | Next.js API Routes + Server Actions + Route Handlers                      |
| **Auth**             | Better Auth (better-auth) + database session + role middleware            |
| **Database**         | PostgreSQL 17 (Supabase, region ap-southeast-1)                           |
| **ORM**              | Drizzle ORM (migration, relational query)                                |
| **Cache & Queue**    | Upstash Redis (ongkir, session cache, antrean webhook/email)              |
| **Integrasi**        | Midtrans (Snap + Core + webhook), RajaOngkir/Komerce, Nodemailer          |
| **Deployment**       | Vercel (disarankan) atau VPS (Docker + PM2) + SSL Let's Encrypt           |

### 5.2 Struktur Folder Next.js
src/
├── app/
│ ├── (landing)/ # Company profile (animasi scroll, SSG/ISR)
│ │ ├── _components/ # Hero, Benefits, HowItWorks, Testimonials, dll
│ │ ├── _hooks/ # useScrollAnimation
│ │ ├── _lib/ # animationVariants.ts (Framer Motion)
│ │ └── page.tsx
│ ├── (shop)/ # Online shop + keranjang + checkout
│ ├── (account)/ # Dashboard pelanggan
│ ├── (admin)/ # Admin + Super Admin (middleware protected)
│ │ ├── dashboard/
│ │ ├── pos/
│ │ ├── products/
│ │ ├── batches/
│ │ ├── orders/
│ │ ├── marketplace/
│ │ ├── reports/
│ │ └── settings/
│ ├── api/ # Webhooks (Midtrans, RajaOngkir)
│ └── layout.tsx
├── components/ # shadcn/ui + custom components
├── lib/
│ ├── db/ # Drizzle schema, client, migrations
│ ├── auth/ # Better Auth config & middleware
│ ├── services/ # Midtrans, RajaOngkir, cache, queue
│ ├── utils/ # FIFO/FEFO engine, formatter, barcode
│ └── validations/ # Zod schemas
├── hooks/ # Custom React hooks (useCart, useAuth)
├── actions/ # Server Actions (CRUD, checkout, POS)
└── middleware.ts # Auth, role-based routing

text

### 5.3 Auth dengan Better Auth
- Provider: Email/Password + Google OAuth.
- Session disimpan di database PostgreSQL dan di‑cache Redis.
- Gate rute di `src/proxy.ts` (Next.js 16 men-deprecate konvensi `middleware.ts`):
  ```ts
  export const middleware = authMiddleware({
    authorized: async ({ auth, request }) => {
      const path = request.nextUrl.pathname;
      if (path.startsWith('/admin')) {
        return auth?.user?.role === 'super_admin' || auth?.user?.role === 'admin';
      }
      if (path.startsWith('/account')) return !!auth;
      return true;
    },
  });
5.4 Server Actions vs API Routes
Server Actions – untuk form CRUD, update keranjang, proses checkout (non‑payment), dll.

API Routes – untuk webhook (Midtrans, RajaOngkir callback), settlement polling, endpoint eksternal.

6. Database Schema (Drizzle ORM)
Berikut tabel‑tabel inti (dapat ditambahkan sesuai kebutuhan fitur lain).

ts
// users (Better Auth akan menambahkan kolom otomatis, kita extend)
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  role: roleEnum(), // pgEnum('role', ['super_admin','admin','customer']) dideklarasikan terpisah
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Sesi & akun untuk Better Auth (akan dibuat oleh library)

export const categories = pgTable('categories', { ... });
export const products = pgTable('products', { ... });
export const variants = pgTable('variants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id').references(() => products.id),
  sku: varchar('sku', { length: 100 }).unique(),
  attributes: json('attributes'), // {"warna":"merah","ukuran":"XL"}
  activePrice: decimal('active_price', { precision: 15, scale: 2 }),
  minStock: int('min_stock').default(0),
  stockMode: enum('stock_mode', ['fifo', 'fefo']).default('fifo'),
  barcode: varchar('barcode', { length: 100 }),
  // timestamps
});

export const batches = pgTable('batches', {
  id: varchar('id', { length: 36 }).primaryKey(),
  variantId: varchar('variant_id').references(() => variants.id),
  batchNumber: varchar('batch_number', { length: 100 }),
  hpp: decimal('hpp', { precision: 15, scale: 2 }),
  quantity: int('quantity'),      // jumlah awal
  remaining: int('remaining'),    // stok tersisa
  expiredDate: date('expired_date'),
  supplier: varchar('supplier', { length: 255 }),
  receivedAt: timestamp('received_at').defaultNow(),
});

export const inboundTransactions = pgTable('inbound_transactions', { ... });
export const inboundItems = pgTable('inbound_items', { ... });

export const outboundTransactions = pgTable('outbound_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 100 }).unique(),
  channel: enum('channel', ['web', 'pos', 'marketplace']),
  status: enum('status', ['pending', 'paid', 'validated', 'shipped', 'completed', 'cancelled']),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
  discount: decimal('discount', { precision: 15, scale: 2 }).default('0'),
  shippingCost: decimal('shipping_cost', { precision: 15, scale: 2 }).default('0'),
  serviceFee: decimal('service_fee', { precision: 15, scale: 2 }).default('0'),
  ppn: decimal('ppn', { precision: 15, scale: 2 }).default('0'),
  total: decimal('total', { precision: 15, scale: 2 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: enum('payment_status', ['unpaid', 'paid', 'refunded']),
  settlementValidated: boolean('settlement_validated').default(false),
  validatedAt: timestamp('validated_at'),
  customerId: varchar('customer_id').references(() => users.id),
  shippingAddress: json('shipping_address'),
  marketplaceFee: decimal('marketplace_fee', { precision: 15, scale: 2 }).default('0'),
});

export const saleItems = pgTable('sale_items', { ... });
export const batchAllocations = pgTable('batch_allocations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  saleItemId: varchar('sale_item_id').references(() => saleItems.id),
  batchId: varchar('batch_id').references(() => batches.id),
  quantity: int('quantity'),
  hpp: decimal('hpp', { precision: 15, scale: 2 }), // snapshot HPP batch
});

export const ledgerEntries = pgTable('ledger_entries', {
  id: varchar('id', { length: 36 }).primaryKey(),
  outboundId: varchar('outbound_id').references(() => outboundTransactions.id),
  account: varchar('account', { length: 100 }), // revenue, hpp, mdr, shipping_subsidy, platform_fee, ppn, service_fee
  amount: decimal('amount', { precision: 15, scale: 2 }),
  type: enum('type', ['debit', 'credit']),
  description: text('description'),
});

// Tabel pendukung: carts, addresses, discounts, blog_posts, shipping_fallback, etc.
7. Landing Page – Animasi Scroll & Desain Konten
7.1 Filosofi & Tujuan
Memberikan kesan modern, profesional, membangun kepercayaan.

Setiap bagian muncul dengan efek reveal saat di-scroll (engagement).

Animasi halus (60fps) tanpa mengganggu Core Web Vitals.

7.2 Teknologi yang Digunakan
Library utama: framer-motion (scroll‑triggered dengan whileInView, viewport).

Smooth scroll: lenis (untuk efek scroll yang halus).

Kompleks (opsional): GSAP ScrollTrigger untuk efek pinning atau parallax.

Carousel: Embla Carousel (terintegrasi dengan shadcn/ui) untuk testimonial dan produk.

7.3 Struktur Konten (Urutan Blok)
No	Blok	Deskripsi	Efek Animasi yang Disarankan
1	Hero	Judul besar + subjudul + CTA utama. Bisa disertai video latar atau gambar animasi	Teks muncul bertahap (stagger), tombol mengambang
2	Social Proof	Logo mitra, sertifikasi, jumlah transaksi. Bisa berbentuk marquee.	Fade in saat muncul, marquee berjalan otomatis
3	Benefit	3-4 nilai jual (Stok Akurat, HPP Real-Time, Manajemen ED). Split‑screen teks & ilustrasi	Slide in dari kiri/kanan, ilustrasi bergerak
4	How It Works	3-4 langkah mudah menggunakan sistem. Kartu-kartu.	Stagger children (muncul bergantian)
5	Brand	Logo brand atau partner yang bekerja sama. Grid sederhana.	Fade in + scale
6	Produk Unggulan	Grid produk alkes terlaris. Setiap kartu produk.	Scale on hover, muncul dengan fade + translateY
7	Testimonial	Carousel slider berisi ulasan pelanggan.	Slide halus, animasi per slide
8	Berita/Blog	3 artikel terbaru dari blog.	Fade in + translateY
9	FAQ	Accordion pertanyaan umum.	Accordion expand dengan animasi
10	Final CTA	Dorongan terakhir untuk mencoba / berbelanja.	Background parallax atau tombol berdenyut
7.4 Contoh Implementasi dengan Framer Motion
tsx
// src/app/(landing)/_components/Benefits.tsx
'use client';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../_lib/animationVariants';

export const Benefits = () => {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="py-20"
    >
      <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-center">
        Kenapa Memilih si4care?
      </motion.h2>
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {/* Masing-masing item akan muncul dengan stagger */}
      </div>
    </motion.section>
  );
};
7.5 Variasi Animasi (animationVariants.ts)
ts
export const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
};

export const scaleOnHover = {
  whileHover: { scale: 1.05, transition: { duration: 0.2 } }
};
7.6 Inisialisasi Smooth Scroll (Lenis)
Buat provider di src/app/(landing)/layout.tsx atau di komponen client wrapper.

tsx
'use client';
import { ReactLenis } from 'lenis/react';

export default function LandingLayout({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      {children}
    </ReactLenis>
  );
}
8. Integrasi & Layanan Pihak Ketiga
Layanan	Tujuan	Implementasi
Midtrans	Pembayaran (QRIS, VA, kartu)	Snap popup di client; webhook di /api/webhooks/midtrans
RajaOngkir (Komerce)	Cek ongkir	API call dengan cache Redis 24 jam; fallback ke tabel shipping_rates
Better Auth	Auth + role	Database session, middleware, OAuth Google
Nodemailer	Email transaksi & notifikasi	Server Action / queue (Upstash Redis)
Upstash Redis	Cache ongkir, queue webhook, session	Library @upstash/redis
8.1 Alur Webhook Midtrans
User bayar → Midtrans kirim notifikasi ke POST /api/webhooks/midtrans.

Verifikasi signature.

Update outboundTransactions.status = 'paid'.

Panggil fungsi allocateStockAndLedger(orderId):

Ambil item pesanan.

Untuk setiap varian, panggil allocateStock(batches, requestedQty, variant.stockMode).

Kurangi batches.remaining.

Buat batchAllocations.

Hitung total HPP.

Buat ledgerEntries:

Revenue (credit)

HPP (debit)

MDR (debit) jika ada

Shipping subsidy (debit)

Platform fee (debit)

Service fee (debit)

PPN (credit)

Kirim email konfirmasi ke pelanggan.

8.2 FIFO/FEFO Engine (TypeScript)
ts
// lib/utils/stockAllocation.ts
export function allocateStock(
  batches: Batch[],
  requestedQty: number,
  mode: 'fifo' | 'fefo'
): AllocationResult {
  const today = new Date();
  const validBatches = batches.filter(b => new Date(b.expiredDate) > today && b.remaining > 0);
  const sorted = [...validBatches].sort((a, b) => {
    if (mode === 'fifo') return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
    if (mode === 'fefo') return new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime();
    return 0;
  });
  let remaining = requestedQty;
  const allocations = [];
  let totalCogs = 0;
  for (const batch of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remaining, remaining);
    allocations.push({ batchId: batch.id, quantity: take, hpp: batch.hpp });
    totalCogs += take * batch.hpp;
    remaining -= take;
  }
  if (remaining > 0) throw new Error('Stok tidak mencukupi');
  return { allocations, totalCogs };
}
9. Critical Business Rules
Single source of truth – harga aktif & stok satu sumber, konsisten di semua kanal.

HPP per batch – konsumsi stok FIFO (default) atau FEFO (jika stock_mode = fefo).

Anti-rugi – tolak/alarm bila active_price < hpp batch yang akan dikonsumsi.

Larangan jual kedaluwarsa – batch expired dikecualikan dari stok jual.

Pengakuan laba – web & POS diakui saat Lunas; diakui final saat settlement divalidasi Owner.

Buku biaya wajib – setiap pesanan menulis ledger_entries untuk semua komponen.

Kepatuhan QRIS – dilarang surcharge QRIS ke pelanggan; Biaya Layanan diterapkan sama rata semua metode dan hanya muncul bila subtotal ≥ ambang.

Ketahanan ongkir – checkout tidak boleh terblokir → cache → fallback Tabel Ongkir Cadangan; pesanan fallback ditandai.

Komposisi total – Total = Subtotal − Diskon/Voucher + Ongkir (setelah subsidi) + Biaya Layanan + PPN.

Retur → karantina – layak jual masuk batch dengan ED-nya; rusak/ED → write‑off (rugi tercatat).

10. Checklist Implementasi (Developer)
Persiapan
npx create-next-app@latest si4care --typescript --tailwind --eslint

npx shadcn@latest init (pilih style default, CSS variables)

Install tambahan: framer-motion lenis drizzle-orm postgres better-auth @upstash/redis

Setup environment variables (.env.local): DATABASE_URL, REDIS_URL, MIDTRANS_*, RAJAONGKIR_*, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

Database & Auth
Buat skema Drizzle sesuai bagian 6.

Generate migration: npm run db:generate

Terapkan ke database: npm run db:migrate  (hindari db:push — interaktif, bisa menggantung)

Konfigurasi Better Auth dengan adapter Drizzle.

Buat halaman /login, /register (client components).

Implementasi middleware dengan role-based routing.

Model & Master Data
CRUD kategori, produk, varian (halaman admin).

Form input batch (inbound transaction) – termasuk upload no. batch, HPP, ED.

Generate barcode (1D/QR) untuk setiap varian.

Online Shop
Halaman daftar produk + filter.

Halaman detail produk dengan pemilih varian (stok real‑time).

Keranjang (server actions untuk add/remove/update).

Checkout: alamat, ongkir (cache+fallback), voucher, total.

Integrasi Midtrans Snap (client component dengan script load).

Webhook handler untuk update status & alokasi stok.

POS & Back-Office
Layout admin dengan sidebar (shadcn/ui sidebar).

Halaman POS: search produk, barcode scanner (WebRTC), keranjang, pembayaran (tunai/non‑tunai).

Cetak struk (CSS print).

Dashboard dengan grafik (Recharts) dan alarm.

Marketplace & Settlement
Form input pesanan manual dari marketplace (booking stok).

Halaman daftar pesanan marketplace yang belum divalidasi.

Fitur rekonsiliasi settlement (input dana diterima, hitung selisih, validasi Owner).

Laporan & Backup
Laporan laba rugi dari ledger entries (filter by validated).

Ekspor Excel/PDF (menggunakan exceljs atau pdfkit).

Cron job backup database (misal dengan GitHub Actions atau Vercel Cron Jobs).

Landing Page (Animasi Scroll)
Inisialisasi Lenis di layout landing.

Buat komponen Hero, Benefits, HowItWorks, Testimonials (dengan carousel).

Implementasi Framer Motion dengan variasi dari animationVariants.ts.

Pastikan semua blok muncul dengan efek whileInView.

Testing & Deployment
Uji semua alur (checkout, POS, validasi settlement).

Uji responsif mobile.

Deploy ke Vercel, set environment variables.

Setup domain & SSL.