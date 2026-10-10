# CHECKLIST — SI4CARE-ag1

> Dokumen handoff. Dibaca AI/developer mana pun yang melanjutkan proyek ini.
> Update file ini setiap sesi: centang yang selesai, tambah catatan di bagian "Log Sesi".
> Terakhir diperbarui: 2026-10-11.

---

## 1. Snapshot Proyek

| Hal | Nilai |
|---|---|
| Produk | si4care — platform toko alat kesehatan (e-commerce + back-office/POS) |
| Stack aktual | **Next.js 16 (App Router, src/) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui (base-ui) + framer-motion + recharts** |
| Status | **Siap go-live dari sisi kode** (uji lengkap lulus di build production, lihat bagian Status). Tinggal tugas Owner O1–O10. Database PostgreSQL (Supabase) sejak 2026-10-08 — §7d. |
| Bahasa UI | Indonesia |
| Dokumen sumber | `prd.md` (requirement), `SI4CARE-SRS.docx`, `RAB Si4Care v2.docx`, `docs/migration-plan-backend.pdf` (rencana migrasi), `docs/adr/0001-backend-stack.md` |
| Perintah | `npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run test:e2e` · `test:reports` · `test:webhook` · `test:settlement` · `test:dashboard` · `test:security` · `db:seed` · `db:seed:demo` · `db:set-password` |
| Backend | **PostgreSQL (Supabase, region ap-southeast-1)** + Drizzle ORM + Better Auth + Upstash Redis + Midtrans + RajaOngkir. ADR-0001 mencatat MySQL — sudah tidak berlaku, lihat §7d. |

**Keputusan desain yang TIDAK boleh diubah tanpa persetujuan owner:**
- Design token di `src/app/globals.css` (oklch): Medical Blue `0.50 0.16 228`, Soft Teal accent, sidebar Deep Navy. Satu accent, netral matang — JANGAN tambah warna baru di luar token.
- Font: Inter (`--font-sans`) + Plus Jakarta Sans (`--font-heading`). 
- Ilustrasi SVG custom per kategori (`(landing)/_components/illustrations.tsx`) — identitas visual, bukan placeholder.
- Komponen UI = shadcn di `src/components/ui/` — jangan tulis ulang dari nol.

---

---

## ⚡ Status & Tugas — diperbarui 2026-10-11

> **Aturan pakai:** bagian ini adalah satu-satunya daftar tugas aktif. Blok P0–P4 dan Tahap A–E versi lama
> sudah dilebur ke sini; riwayatnya ada di **Log Sesi** dan §7e–§7h.

### Kondisi terverifikasi (diukur, bukan diklaim)

| Pemeriksaan | Hasil |
|---|---|
| `npx tsc --noEmit` | bersih |
| `npm test` (Vitest) | **115/115** |
| `npm run test:e2e` (dev server, 1 worker) | **76/76**, 0 skip |
| Build production (`npm run build`) | sukses; `/`, `/shop`, `/shop/[id]`, `/blog`, `/blog/[slug]` = ISR 1 menit |
| `test:webhook` — server **production**, pooler **6543** | 16/16 (termasuk 3 webhook bersamaan → hanya 1 diproses) |
| `test:settlement` / `test:reports` / `test:dashboard` — pooler 6543 | 16/16 · 9/9 · 45/45 |
| `test:security` — serangan ke server action, build production | 14/14 ditolak, DB utuh |
| Server production dengan env salah | menolak melayani request; pesan menunjuk variabelnya |
| Lint seluruh proyek | 15 error **pra-eksisting** (dulu 34); tidak ada yang ditambahkan sesi ini — `landing-editor-client.tsx` yang ikut tersentuh (2 baris impor) punya 5 error sebelum maupun sesudah |

### 🧑 Tugas Owner — hanya kamu yang bisa mengerjakan

Detail langkah ada di **`docs/deploy-vercel.md`**. Urut dari atas.

**Sebelum deploy**

| # | Tugas | Kenapa / catatan |
|---|---|---|
| **O1** | Cek repo GitHub **publik atau privat**; jadikan privat bila boleh | Password lama ada di riwayat git yang ter-push |
| **O2** | **Ganti password** akun seed: `NEW_PASSWORD='…' npm run db:set-password -- admin@si4care.com` (ulangi tiap email, lalu perbarui `SEED_*` di `.env.local`) | Wajib sebelum situs publik. Skrip sudah diuji end-to-end |
| **O3** | Buat **database Upstash Redis baru**, isi `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Yang lama sudah dihapus Upstash (NXDOMAIN). Tanpa ini situs tetap jalan, tapi tanpa cache ongkir & rate-limit lintas-instance |
| **O4** | Putuskan: **Supabase produksi terpisah** dari lokal? | Kalau tidak, transaksi uji dan akun contoh lokal langsung muncul di situs live |
| **O5** | Isi **`KOMERCE_STORE_ORIGIN_ID`** (ID wilayah toko; cara mencari ada di `.env.example`) | Tanpa ini asal ongkir = kelurahan pertama hasil pencarian "JAKARTA SELATAN" — kurang presisi |
| **O6** | **Ganti data placeholder** di `src/lib/site-config.ts`: nomor WhatsApp (`6285555555555` tidak aktif), telepon, alamat, email, jam | Satu file untuk footer, kontak, privasi, S&K, FAQ, struk POS |
| **O7** | **Konten & klaim**: ganti 6 testimoni contoh (`/admin/content`), tulis artikel asli menggantikan 3 artikel contoh, pastikan klaim "Terdaftar BPOM · Izin Alkes Resmi Kemenkes" (hero, metadata, FAQ) benar, siapkan foto kategori/produk asli | Klaim regulasi harus bisa dibuktikan; testimoni contoh memuat nama orang rekaan |

**Deploy**

| # | Tugas | Catatan |
|---|---|---|
| **O8** | `vercel login` (Continue with GitHub → `MuhammadNurIrfan`), import project, isi env var | `vercel.json` sudah mengunci region Singapore. `DATABASE_URL` pakai **port 6543** |
| **O9** | Deploy dan jalankan daftar periksa pasca-deploy (`docs/deploy-vercel.md` §3) | |
| **O10** | Isi **Payment Notification URL** Midtrans: `https://<domain>/api/payment/notification` | Tanpa ini pesanan tak pernah jadi *Dibayar* |

**Sesudahnya**

| # | Tugas | Catatan |
|---|---|---|
| **O11** | Cloudflare **R2** (bucket + 5 env var) bila ingin upload foto di produksi | Tanpa R2, upload ditolak 503 (disk Vercel read-only) |
| **O12** | Hapus akun pelanggan contoh `budi@/siti@/hendra@example.com` dan data uji di DB produksi; `npm run test:reports:clean` sebelum go-live | Jangan jalankan `db:seed:demo` di produksi |
| **O13** | Secret GitHub `DATABASE_URL`, lalu aktifkan blok `schedule` di `.github/workflows/db-backup.yml` | Backup harian |
| **O14** | *(opsional)* Google OAuth; plugin & MCP Vercel (`npx plugins add vercel/vercel-plugin --target claude-code`) | Plugin **wajib** `--target claude-code`: auto-detect salah memilih Cursor |

### 🤖 Sisa pekerjaan kode — tidak memblokir deploy

| # | Pekerjaan | Catatan |
|---|---|---|
| **K1** | Halaman **Pengaturan admin** (`/admin/settings`) hanya tampilan: 28 `useState`, tombol Simpan tidak menyimpan ke mana pun | Profil toko dibaca dari `site-config.ts`, bukan dari halaman ini |
| **K2** | **Security pass lanjutan**: CSRF token, output escaping, role DB least-privilege (jangan pakai `postgres` superuser untuk aplikasi) | Headers + CSP sudah ada di `next.config.ts` |
| **K3** | **Fitur ulasan produk** belum ada. Rating/ulasan/"terjual" karangan sudah dihapus dari UI | Kalau fitur dibuat, `ProductCard` sudah siap menerima `rating`/`sold` |
| **K4** | Tanggal ledger & laporan memakai **UTC**: transaksi pukul 00.00–07.00 WIB tercatat di hari sebelumnya | Berlaku sama untuk POS, web, marketplace |
| **K5** | **Retur/refund setelah dibayar** belum mengoreksi ledger | Ledger mencatat penjualan saat dibayar; pembatalan setelahnya tidak mengurangi |
| **K6** | Stok yang ditampilkan di etalase menghitung **batch kedaluwarsa** juga (`SUM(remaining)`), padahal alokasi FIFO/FEFO membuangnya | Checkout tetap benar karena divalidasi saat alokasi |
| **K7** | 15 error lint `react-hooks/*` pra-eksisting (navbar, carousel, CartContext, landing-editor, dll.) | Perbaiki incremental saat menyentuh file terkait |
| **K8** | Nilai tambah: toast `sonner`, scanner kamera POS, inbound + stock opname atomik, kontras WCAG AA `text-muted-foreground`, cetak struk thermal ESC/POS + label barcode 33×15 mm | |
| **K9** | Transaction pooler: `limit-concurrency.ts` memaksa satu query per koneksi karena Supavisor menggantung bila dipipeline. Cek apakah masih perlu setelah Supabase/`postgres-js` diperbarui | Lihat §7h #9 |

### ✅ Sudah selesai sesi 2026-10-09 → 10-11 (ringkas; rincian di §7e–§7h)

`A1` kredensial Midtrans/Komerce diisi dan diuji ke layanan nyata · `A1b` kegagalan Redis tak lagi mematikan ongkir ·
`A1c` integrasi Komerce ditulis ulang untuk API baru · `A2` validasi env (server production menolak start) ·
`A3` password keluar dari repo · `A4` push · `B0` Vercel CLI v63.1.0 · `B4–B5` env & URL (panduan di docs) ·
`C5` rate-limit login aktif di production · `D1` CMS membaca DB · `E1` koreksi catatan CSP ·
`E2` `mysql2` bukan dependensi langsung lagi · `E3` `mock-data.ts` dihapus · `E4` SQL chat usang dihapus ·
`E5` tab POS memakai `Tabs` shadcn · dashboard `/admin` memakai data nyata · ledger web & marketplace ·
webhook atomik · foto kategori dari DB · halaman detail produk nyata · ISR · klien DB tahan pooler transaksi.

---

## 2. Peta Kode (untuk orientasi cepat)

```
src/
├─ app/
│  ├─ (landing)/        # landing + halaman publik (about, faq, blog, dst) + _components/
│  ├─ shop/, cart/, checkout/, account/   # alur belanja pelanggan
│  ├─ login|register|forgot-password/
│  └─ admin/            # back-office: dashboard, pos, orders, marketplace, messages,
│                       # products, categories, inbound, stock-opname, discounts,
│                       # content (CMS), reports, alarms, settings
├─ components/  ui/ (shadcn) · layout/ · shop/ · admin/ · barcode.tsx
├─ context/     CartContext · ContentContext (CMS→localStorage) · CategoryContext (localStorage)
├─ hooks/       use-mobile.ts
└─ lib/         utils.ts · animationVariants.ts
```

Kunci localStorage lama `si4care_categories` dan `si4care_content_v1` sudah tidak dibaca aplikasi (data kini dari database).
Voucher awal (`db:seed`): `SEHAT10`, `ALKES5`, `DISKON20RB`.

Catatan teknis: QR pakai `uqr` (zero-dependency); barcode Code128 di-encode manual
tanpa dependensi di `src/components/barcode.tsx`; format generate = EAN-13.

---

## 3. SELESAI (jangan dikerjakan ulang)

- [x] Seluruh halaman landing, shop, cart, checkout(+success), akun, auth (UI saja)
- [x] Seluruh halaman admin (14 menu): dashboard, POS, pesanan, marketplace, pesan, produk, kategori, inbound, stock opname, diskon, konten (CMS), laporan, alarm, pengaturan
- [x] Sistem barcode: input/scan/generate EAN-13, render Code128 + QR (`uqr`), unduh SVG
- [x] POS mobile (bottom sheet keranjang), stock opname, CMS per-section, foto kategori
- [x] Kolom biaya/potongan custom POS marketplace, floating contact (WA + chat), room chat pelanggan & admin
- [x] Audit responsivitas mobile menyeluruh (tabel→card view, tabs scrollable, dialog scrollable)
- [x] `npx tsc --noEmit` bersih

---

## 4. PEKERJAAN RUMAH — Housekeeping (kerjakan duluan, ±30 menit)

Temuan audit 2026-06-11. Prioritas karena menyangkut disk/memori & kebersihan repo:

- [x] **Hapus folder `build-verify` s/d `build-verify6` (±780 MB sampah artefak build)** — selesai 2026-06-11
- [x] **Hapus `tmp/`** — selesai 2026-06-11
- [x] **Bersihkan `tsconfig.json`** — entri `build-verify*/types/**` dihapus dari `include`
- [x] **Tulis ulang `README.md`** — deskripsi, status proyek, cara run, struktur, link dokumen
- [x] **Ganti `"name": "si4care_temp"`** di package.json → `si4care`
- [x] **Pindahkan `*.docx` ke `docs/`** (`SI4CARE-SRS.docx`, `RAB Si4Care v2.docx`) — selesai 2026-09-24
- [x] **`.DS_Store` cleanup** — dihapus dari disk; tidak ada yang ter-commit di git
- [x] **Sentralisasi data mock** — semua data produk/order/POS kini satu sumber di `src/lib/mock-data.ts`; 9 file konsumen (CartContext, shop, shop/[id], checkout, checkout/success, pos, inbound, orders, featured-products) tinggal impor. Saat backend siap: ganti isi mock-data.ts dengan fetch API, konsumen tidak berubah.

Catatan lint (pra-eksisting, bukan dari sentralisasi): `npm run lint` melaporkan 12 error aturan baru `react-hooks` (setState-in-effect / impure-render) di navbar, carousel, use-mobile, CategoryContext, ContentContext, admin/content, login, dll. `npx tsc --noEmit` bersih. Perbaiki saat menyentuh file terkait.

---

## 5. SEBELUM GO-LIVE (arsip — status terkini di bagian atas)

- [x] Uji di perangkat fisik (mobile viewport 375x812): Landing hero, POS, checkout, orders — selesai 2026-09-24
- [x] `npm run build` di mesin lokal — selesai 2026-09-24, TypeScript bersih, build artifact ✓
- [ ] Siapkan 2–3 foto kategori asli untuk uji upload foto  → tugas owner **O7**
- [x] Panduan uji alur utama tertulis: belanja → checkout voucher `SEHAT10` → pesanan admin → POS → stock opname — selesai: `docs/uji-alur-utama.md`

## 6. NILAI TAMBAH (menengah, opsional)

- [x] Halaman detail artikel `/blog/[slug]` (kartu blog belum bisa diklik ke isi) — selesai (`blog/[slug]` + ISR; landing menaut ke artikel nyata)
- [ ] Toast/notifikasi global (sebagian aksi tanpa umpan balik visual) — pakai `sonner`  → **K8**
- [x] Upload foto per-produk (override foto kategori) — selesai (Fase 6; produksi butuh R2, lihat **O11**)
- [ ] Scanner kamera (getUserMedia) untuk tombol Scan di POS  → **K8**
- [x] Riwayat sesi stock opname — selesai (`getSessionHistory`)
- [ ] Cek kontras WCAG AA untuk `text-muted-foreground` di atas latar muted  → **K8**

---

## 7. MENUJU PRODUKSI (migrasi backend — DIMULAI 2026-06-17)

Rencana lengkap & rinci ada di `docs/migration-plan-backend.pdf` (per-fase, dipetakan ke file frontend yang ada). Urutan di bawah ini ringkasannya — vertical slice per domain, bukan layer-by-layer.

### 7a. Fondasi (Fase 0)
- [x] **ADR-0001: stack backend dipilih & dicatat** — MySQL + Drizzle ORM + Better Auth + Upstash Redis + Midtrans + RajaOngkir, satu stack (tanpa API server terpisah). Alasan: tim 2 orang, familiar MySQL, konsisten dengan `prd.md` §5. Detail di `docs/adr/0001-backend-stack.md`.
- [x] **Dependensi terinstall**: `drizzle-orm`, `mysql2`, `better-auth`, `@upstash/redis`, `drizzle-kit` (dev)
- [x] **MySQL lokal siap**: MariaDB 10.4.28 via XAMPP, database `db_toko_si4care` dibuat (0 tabel — skema belum ditulis). Port **3307** (bukan 3306 default — bentrok dengan service MySQL Homebrew lain di mesin dev; lihat ADR-0001).
- [x] **`.env.local` dibuat** dengan `DATABASE_URL` (terisi & terverifikasi konek), `BETTER_AUTH_SECRET`+`BETTER_AUTH_URL` (terisi), serta placeholder kosong untuk `GOOGLE_CLIENT_ID/SECRET`, `REDIS_URL`/`UPSTASH_REDIS_REST_*`, `MIDTRANS_*`, `RAJAONGKIR_API_KEY` — **belum** ada validasi env via zod, isi placeholder masih kosong (perlu didaftarkan ke Upstash/Midtrans Sandbox/Google Cloud Console/RajaOngkir saat mau lanjut fase yang membutuhkannya)
- [x] **Struktur folder dibuat**: `src/lib/db`, `src/lib/auth`, `src/lib/services`, `src/lib/validations`, `src/actions` (masih kosong/placeholder — isi menyusul di Fase 1.1)
- [x] Skema DB awal (Drizzle) — selesai sebagai bagian Fase 1.1 di bawah

### 7a-lanjutan. Fase 1.1 — Schema dasar & Auth (selesai 2026-06-17)
- [x] **Tabel `user`/`session`/`account`/`verification`** di-generate via `npx @better-auth/cli generate` (jangan edit `src/lib/db/auth-schema.ts` manual, regenerate ulang kalau config auth berubah). Field tambahan: `role` (text, default `customer`) dan `phone` (text).
- [x] **Role yang dipakai sesuai `prd.md` §6**: `super_admin` / `admin` / `customer` — bukan "Owner/Kasir/Admin Konten" seperti yang sempat disebut di versi checklist sebelumnya (itu hanya inferensi dari sidebar, tidak ada di skema PRD). **Keputusan owner 2026-06-17: cukup 3 role ini, tidak perlu granularitas Kasir/Admin Konten terpisah** — semua yang role-nya admin/super_admin boleh akses semua menu `/admin`. Dianggap **selesai**, bukan utang lagi.
- [x] **Tabel `addresses`** (FK ke `user.id`, cascade delete) — server actions CRUD di `src/actions/addresses.ts` (anti-IDOR: tiap mutasi cek kepemilikan via `userId`), halaman `account/addresses` dipecah jadi server component (`page.tsx`, fetch langsung) + client component (`_components/addresses-client.tsx`, dialog tambah/ubah + dropdown aksi)
- [x] **Better Auth dikonfigurasi** (`src/lib/auth/index.ts`): email/password + Google OAuth (kredensial masih placeholder kosong, tombol Google baru fungsional setelah `GOOGLE_CLIENT_ID/SECRET` diisi), drizzle adapter. Client hooks di `src/lib/auth/client.ts` (pakai plugin `inferAdditionalFields` agar `role`/`phone` ter-tipe di client).
- [x] **`login/page.tsx` & `register/page.tsx`** disambungkan nyata ke Better Auth (form submit, loading/error state) — tidak lagi dummy `<Link>`.
- [x] **`account/layout.tsx`**: nama/email dari `useSession()`, tombol "Keluar" memanggil `signOut()` lalu redirect ke `/login`.
- [x] **`admin/layout.tsx`**: jadi async server component, cek `auth.api.getSession` — redirect ke `/login` bila tidak ada sesi, redirect ke `/` bila role bukan admin/super_admin. Data user diteruskan ke `AppSidebar` (footer + tombol Keluar nyata) & header (nama asli, bukan "Super Admin" hardcode).
- [x] **`src/proxy.ts`** (bukan `middleware.ts` — Next.js 16 men-deprecate konvensi itu, lihat `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`): gate cepat berbasis cookie untuk `/admin/*` & `/account/*`, redirect ke `/login?redirect=...` bila tak ada sesi sama sekali. Cek role tetap di layout (butuh query DB, proxy hanya cek cookie).
- [x] **Diuji end-to-end via curl**: sign-up → role default `customer` tersimpan benar; akses `/admin` sebagai customer → redirect ke `/`; promote role ke `admin` langsung di DB → akses `/admin` jadi 200; akses `/account/addresses` tanpa cookie → redirect ke `/login`; sign-in mengembalikan role terbaru. Data uji sudah dihapus dari DB setelah verifikasi.
- [x] Rate-limit login — **dipindah ke Fase 1.3** (Online shop/checkout): butuh Upstash Redis aktif untuk simpan counter percobaan login, dan Redis pertama kali memang diaktifkan di 1.3 untuk cache ongkir RajaOngkir — sekalian setup di situ, jangan lupa. **→ SELESAI 2026-10-11** (`lib/auth/rate-limit-storage.ts`, aktif di production: 10 percobaan/15 mnt per IP, fallback memori bila Redis mati)

**~~Catatan teknis (operasional MySQL/MariaDB lokal)~~ — TIDAK BERLAKU sejak 2026-10-08 (pindah ke PostgreSQL, lihat §7d). Disimpan sebagai catatan sejarah:** `drizzle-kit push` punya bug reproducible di MariaDB 10.4.28 — push kedua ke tabel yang sudah ada selalu gagal dengan `ER_MULTIPLE_PRI_KEY` pada tabel `account` (drizzle-kit salah membaca PK saat re-introspeksi). **Solusinya: pakai `npm run db:generate` lalu `npm run db:migrate`** (migration file based, terbukti idempotent — sudah dites jalan 2x tanpa error), bukan `npm run db:push`. Script `db:push` masih ada di `package.json` tapi hindari dipakai berulang di tabel yang sudah ada.

### 7b. Integrasi per domain (tiap baris = 1 slice penuh DB→API→UI→validasi)
- [x] **Fase 1.2 — Katalog (kategori → produk → varian → batch)** — selesai 2026-06-18:
  - Tabel `categories`, `products`, `variants`, `batches` di-migrate ke `db_toko_si4care`.
  - FIFO/FEFO engine murni di `src/lib/utils/stockAllocation.ts` (sesuai prd.md §8.2, pure function, siap unit-test).
  - `admin/categories/page.tsx` → async server component + `_components/categories-client.tsx`; upload foto ke `public/uploads/` via `/api/upload` (swap ke R2/S3 sebelum deploy — `public/` read-only di Vercel).
  - `admin/products/page.tsx` → async server component + `_components/products-client.tsx` + `product-dialog.tsx`; model produk+varian (satu produk = satu atau lebih varian SKU); stok computed dari SUM(batches.remaining) — read-only di halaman ini, ditambah via inbound.
  - `admin/inbound/page.tsx` → server wrapper + `_components/inbound-client.tsx`; "Simpan Transaksi Masuk" memanggil `createBatch()` per item — stok real bertambah di DB.
  - `CategoryContext.tsx` tetap ada (masih dipakai POS & shop/product-card) — akan dihapus di Fase shop/POS.
  - `mock-data.ts` masih ada untuk bagian non-katalog (cart, checkout, orders, POS_CATALOG, FEATURED_PRODUCTS) — akan digantikan fase berikutnya.
  - **Catatan**: `date()` kolom Drizzle MySQL perlu `{ mode: "string" }` agar insert/select sebagai YYYY-MM-DD string. Zod v4 `z.record()` butuh 2 argumen (key+value); `z.number({ invalid_type_error })` diganti tanpa arg.
- [x] **Konten CMS (gantikan localStorage `si4care_content_v1`)** — Fase 4.1 selesai 2026-09-20
- [x] **Fase 1.3 — Checkout + Midtrans + Ongkir + Redis** — selesai 2026-06-19, diuji end-to-end 2026-06-19:
  - `src/lib/redis.ts` — Upstash Redis client (`@upstash/redis` yang sudah terinstall).
  - Rate-limit login di `src/lib/auth/index.ts` — `rateLimit.customStorage` pakai Redis (max 5 percobaan / 15 menit per IP).
  - 4 tabel baru dimigrasikan: `vouchers`, `cart_items`, `orders`, `order_items` — migration `drizzle/0002_faulty_captain_flint.sql`.
  - `src/actions/vouchers.ts` — `validateVoucher` + `calcDiscount` (gantikan `PROMO_CODES` hardcode).
  - `src/actions/orders.ts` — `createOrder` (validasi stok via FIFO/FEFO → buat order → Midtrans Snap token), `getMyOrders`, `getOrderDetail`.
  - `src/lib/midtrans.ts` — singleton Snap + CoreApi client; `MIDTRANS_CLIENT_KEY` & `MIDTRANS_IS_PRODUCTION` di-export untuk dipakai halaman.
  - `src/lib/validations/order.ts` — `createOrderSchema` dengan Zod.
  - `/api/shipping/cost` — GET route: query Komerce API (3 kurir paralel) + cache Redis 24 jam; fallback built-in jika Sandbox Komerce tidak mengembalikan data.
  - `/api/payment/notification` — POST webhook Midtrans: verifikasi SHA512 signature, update status order, deduct `batches.remaining` via alokasi FIFO/FEFO yang sudah tersimpan di `order_items.batch_allocations`.
  - `checkout/page.tsx` → async server component (session guard, fetch alamat user, load Snap.js via `<Script>`).
  - `checkout/_components/checkout-client.tsx` — form checkout real: pilih alamat, pilih ongkir dari API, validasi voucher, panggil `createOrder`, lalu `window.snap.pay(token)`.
  - `checkout/success/page.tsx` — terima `?orderId=` dari URL, tampilkan detail order nyata dari DB.
  - `actions/addresses.ts` — tambah `getMyAddresses()` + export `AddressRow`.
  - `.env.local` — diisi: Midtrans Sandbox (SB-Mid-server-... / SB-Mid-client-...), Komerce API key, Upstash Redis URL+Token.
  - **Catatan deploy**: webhook Midtrans butuh URL publik; saat dev lokal pakai `ngrok` atau Midtrans Simulator.
  - `CartContext` masih in-memory; `cart_items` tabel ada tapi belum dipakai — akan diisi saat Fase POS/Shop.
  - `mock-data.ts` masih dipakai untuk FEATURED_PRODUCTS, ORDER_SUCCESS_ITEMS lama, POS_CATALOG — akan digantikan fase berikutnya.
  - `shop/page.tsx` di-migrate ke server component + `_components/shop-client.tsx`; produk dari DB via `getShopProducts()`.
  - `src/lib/db/seed.ts` + `npm run db:seed` — 4 kategori, 8 produk, 9 varian+batch, 3 voucher (SEHAT10/ALKES5/DISKON20RB). Idempotent.
  - **Bug fixes selama testing**: `calcDiscount` dipindah ke `src/lib/utils/discount.ts` (tidak boleh sync export di `"use server"`); `<Script strategy="afterInteractive">` (bukan `beforeInteractive`); `db.query...with` diganti query manual (MariaDB 10.4 tidak support LATERAL JOIN yang dipakai Drizzle relational API).
  - **~~Temuan penting MariaDB~~ — TIDAK BERLAKU sejak pindah ke PostgreSQL (§7d)**: dulu `db.query.X.findFirst/findMany({ with: {...} })` dilarang karena LATERAL JOIN gagal di MariaDB 10.4. **PostgreSQL mendukung LATERAL JOIN**, jadi relational API aman dipakai untuk kode baru. Kode lama yang sudah memakai `db.select()` + query terpisah tidak perlu diubah — tetap benar, hanya lebih bertele-tele.
- [x] **Fase 1.4 — POS + Transaksi Marketplace** — selesai 2026-06-21:
  - Schema baru: `outbound_transactions`, `outbound_items`, `ledger_entries` — migration `0003_wet_jamie_braddock.sql`.
  - `src/lib/pos-calc.ts` — ekstrak kalkulasi murni: `calcLineDiscount`, `calcCartTotals`, `calcMarketplaceNet`, `MDR_RATES`, `PLATFORM_COMMISSION`.
  - `src/actions/pos.ts` — `getPosProducts()` (join variants+batches+HPP rata-rata tertimbang), `savePosTransaction()` (FIFO/FEFO + potong stok + ledger), `saveMarketplaceTransaction()` (booking stok, status pending_settlement).
  - `pos/page.tsx` → thin server wrapper; `_components/pos-client.tsx` (tab switcher); `kasir-tab.tsx` + `marketplace-tab.tsx` wired ke DB.
  - KasirTab: "Konfirmasi Bayar" → server action → potong stok → ledger entry → struk real (refNumber POS-XXXXXX). `router.refresh()` untuk update stok katalog.
  - MarketplaceTab: "Simpan" → server action → booking stok → `outbound_transactions` status `pending_settlement`.
- [x] **Fase 5 — Manajemen Pesanan Web** — selesai 2026-09-20:
  - **Admin Orders** (`admin/orders/page.tsx`): server component fetch `adminGetOrders()`, client component `orders-client.tsx` tampilkan table (desktop) + card (mobile) dengan filter status. Dialog detail: customer info, alamat snapshot, pricing breakdown, Midtrans verification, status transition buttons (processing/shipped/delivered/cancelled). Audit log otomatis.
  - **Customer Orders** (`account/orders/page.tsx`): server component fetch `getMyOrders()`, client component `orders-list.tsx` tampilkan card list dengan status tabs (berlangsung/selesai/dibatalkan). Aksi: Detail, Lacak Resi (shipped), Ajukan Retur (delivered). Responsive mobile.
  - **Server Actions** (`src/actions/orders.ts`): `getMyOrders()`, `adminGetOrders()`, `adminUpdateOrderStatus()`, `getOrderDetail()`. Semua auth-guarded & anti-IDOR.
  - `adminUpdateOrderStatus()` sudah ada dari Fase Hardening (2026-06-22) — teguh-tested real-time status transitions.
- [x] **Fase 3 — Stock Opname + Blog SEO + Backup + Multi-cabang MVP** — selesai 2026-06-22:
  - **Stock Opname** (`admin/stock-opname`): konversi ke server+client split. Schema baru: `stock_opname_sessions` + `stock_opname_items`. Actions: `startSoSession()` (snapshot semua varian aktif ke tabel item), `saveOpnameProgress()`, `closeSession()` (terapkan delta FIFO/FEFO ke `batches.remaining`). UI: tampilkan sesi terbuka dari DB; tombol "Mulai Sesi Baru" + "Simpan Progres" + "Selesaikan"; histori sesi via dialog.
  - **Artikel / Blog SEO** (`(landing)/blog`): tabel `articles` baru + `src/actions/articles.ts` (CRUD, auto-slugify, `getPublishedArticles`, `getArticleBySlug`). `blog/page.tsx` jadi server component (fetch DB). `blog/[slug]/page.tsx` BARU: `generateMetadata()` (title, description, openGraph, twitter, canonical) + JSON-LD schema.org (`Article`/`NewsArticle`). 3 artikel seed di-insert langsung via SQL migration.
  - **Admin CMS Artikel** (`admin/content`): `_components/articles-manager.tsx` BARU — DB-backed CRUD dengan form SEO (metaTitle, metaDescription). Menggantikan inline ArticlesManager yang pakai localStorage. Form editor mendukung Markdown minimal (## heading, - list, paragraf).
  - **ContentContext**: `articles: Artikel[]` dihapus dari `SiteContent`; `SECTION_META` entri "articles" dihapus — artikel sepenuhnya pindah ke DB.
  - **Backup terjadwal** (`.github/workflows/db-backup.yml`): cron 02:00 WIB + `workflow_dispatch`, `mysqldump --single-transaction --routines --triggers | gzip`, upload artifact 30 hari, slot B2/S3 siap uncomment. `npm run db:backup` untuk backup lokal via XAMPP.
  - **Multi-cabang MVP**: tabel `branches` + default row `('main', 'Toko Utama')`. Kolom `branch_id VARCHAR(36) DEFAULT 'main' NOT NULL` ditambah ke `outbound_transactions`, `orders`, `ledger_entries`, dan `stock_opname_sessions`. Semua transaksi eksisting otomatis masuk cabang 'main'.
  - **Migration**: semua tabel baru + kolom baru via direct SQL XAMPP mysql client (MariaDB 10.4 kompatibel).
- [ ] Inbound + stock opname atomik (sudah ada sesi opname; inbound tetap manual via existing page)  → **K8**
- [x] **Fase 1.5 — Laporan + Fase 2 Domain Lanjutan** — selesai 2026-06-22:
  - **Laporan** (`admin/reports`): tambah tombol Laporan di header admin; `admin/reports/page.tsx` jadi server component dengan query agregat dari `ledger_entries`/`outbound_transactions`; `_components/reports-client.tsx` (filter periode+channel, KPI cards, AreaChart, PieChart, BarChart, top produk, MDR table).
  - **Barcode POS** (`kasir-tab.tsx`): mode scan via tombol toggle — input mono autoFocus, `handleBarcodeSubmit` (Enter = exact match `p.barcode === val` → `addToCart`, feedback 2.5 detik).
  - **Schema baru** (`db/schema.ts`): kolom `settled_amount` di `outbound_transactions`, tabel `app_settings` (key-value JSON), tabel `returns` (reason enum, status enum 5 state, FK orders/user). Migration via XAMPP mysql client langsung ke MariaDB 10.4.
  - **Diskon & voucher** (`admin/discounts`): `src/actions/vouchers.ts` ditambah CRUD penuh (`getVouchers`, `upsertVoucher`, `deleteVoucher`, `toggleVoucher`, `incrementVoucherUsage` atomic), subsidi ongkir & diskon berjenjang disimpan ke `app_settings` (bukan localStorage). Halaman jadi server component + `_components/discounts-client.tsx`.
  - **Marketplace settlement** (`admin/marketplace`): `src/actions/marketplace-settlement.ts` — `getMarketplaceTxs` + `validateSettlement`. Status UI dipetakan dari kolom yang ada (`pending_settlement + settledAmount IS NULL/NOT NULL`, `completed`). Halaman jadi server+client split.
  - **Alarm real-time** (`admin/alarms`): `src/actions/alarms.ts` — `getLiveAlarms()` dengan 4 blok query Drizzle (stok rendah via HAVING, mendekati ED ≤30 hari, batch kadaluarsa, margin tipis/negatif). Dismiss ephemeral di client-side `Set<string>`.
  - **Retur** (`account/returns` + `admin/returns`): `src/actions/returns.ts` — full CRUD. Halaman customer (form ajukan retur + riwayat). Halaman admin (`/admin/returns`) dengan tabel+card mobile + dialog proses karantina (pending→inspeksi→layak_jual/write_off/ditolak). Sidebar sidebar `app-sidebar.tsx` tambah menu Retur.
  - **FEFO**: sudah ada sejak Fase 1.2 (`variants.stockMode` enum + `stockAllocation.ts`) — tidak perlu perubahan.
- [x] **Chat pelanggan↔admin** — selesai 2026-06-24:
  - Tabel baru: `chat_threads` + `chat_messages` di `src/lib/db/schema.ts`.
  - `src/actions/chat.ts` — `getOrCreateMyThread`, `sendMessage`, `getMessages`, `getThreadsForAdmin`, `closeThread`.
  - `account/chat/page.tsx` → server component (ambil/buat thread + pesan awal) + `_components/chat-client.tsx` (polling 3 detik).
  - `admin/messages/page.tsx` → server wrapper + `_components/messages-client.tsx` (thread list + chat + polling 3 detik + tombol Tutup thread).
  - Migration SQL: `docs/sql/chat-migration.sql` — jalankan di XAMPP sebelum test.

### 7c. Eksternal & hardening
- [x] Pembayaran Midtrans (verifikasi callback signature!) · Ongkir RajaOngkir/Komerce + cache Redis 24 jam + fallback tabel ongkir cadangan — Midtrans diuji ke layanan nyata (Snap token + webhook 16/16); integrasi Komerce ditulis ulang untuk API baru (§7h #1)
- [x] **Hardening (paralel)** — selesai 2026-06-22:
  - **Audit Log**: tabel `audit_logs` (userId, action, entityType, entityId, detail, createdAt) + `src/lib/audit.ts` helper. Log dipasang di: ubah status pesanan admin (`ORDER_STATUS_CHANGED`), validasi settlement marketplace (`SETTLEMENT_VALIDATED`), tutup sesi stock opname (`STOCK_OPNAME_CLOSED`), jual di bawah HPP (`PRICE_BELOW_HPP`).
  - **Anti-rugi**: `savePosTransaction` dan `createOrder` — cek `unitPrice < avgHpp` setelah alokasi batch; tolak dengan error + log audit `PRICE_BELOW_HPP`.
  - **AuthZ / anti-IDOR**: `marketplace-settlement.ts` ditambah `requireAdmin()` (sebelumnya tidak ada auth sama sekali). `vouchers.ts`: `requireAdmin()` di `getVouchers`, `upsertVoucher`, `deleteVoucher`, `toggleVoucher`. `returns.ts`: `requireAdmin()` di `getAdminReturns` dan `updateReturnStatus` (sebelumnya cuma cek session, bukan role). `articles.ts`: `requireAdmin()` di `upsertArticle` dan `deleteArticle`. `orders.ts`: `adminUpdateOrderStatus()` server action baru (dengan admin check + audit log) menggantikan versi awal yang hanya mengubah state di client.
  - **Validasi Zod**: `submitReturn` (orderId, reason enum, detail min 5 char). `upsertArticle` (title, category, body, status, coverImage URL). `validateSettlement` (txId, settledAmount ≥0, newUiStatus enum). `submitReturn` juga memvalidasi IDOR (orderId harus milik user yang login, status `delivered`).
  - **Shared helpers**: `src/lib/server-auth.ts` — `requireSession()` + `requireAdmin()` reusable. `src/lib/audit.ts` — `logAudit()` never throws (audit failure tidak boleh block transaksi).
  - **QRIS compliance**: Dropdown POS tidak lagi tampilkan "0.7% MDR" di nama metode (tidak boleh menyiratkan surcharge ke pelanggan). MDR row di summary berubah jadi "MDR X% (ditanggung toko)". Note di QR dialog: "Pelanggan bayar {total} · MDR 0.7% ditanggung toko". `SERVICE_FEE` di orders.ts sudah flat Rp4.500 untuk semua metode (tidak berubah).
  - **Migration**: `CREATE TABLE audit_logs` via XAMPP mysql (MariaDB 10.4).
- [ ] Security pass lanjutan: output escaping, CSRF token, akun DB non-root least-privilege. **Security headers/CSP sudah selesai** di `next.config.ts` (bukan helmet/middleware).  → **K2**
- [x] **Test: unit untuk logika harga/diskon/stok, e2e alur checkout & POS** — selesai 2026-06-24:
  - Vitest v2 (`npm test`): 51 unit tests, 3 file, semua hijau.
    - `src/lib/utils/__tests__/stockAllocation.test.ts` — 13 test: FIFO order, FEFO order, expired skip, shortfall, COGS calc, tie-breaker.
    - `src/lib/__tests__/pos-calc.test.ts` — 26 test: `calcLineDiscount` (pct/rp/cap), `calcCartTotals` (disc item+cart, PPN 12%, MDR semua metode, margin), `calcMarketplaceNet` (komisi, ongkir, custom fees ±, isMinus/isTipis).
    - `src/lib/utils/__tests__/discount.test.ts` — 12 test: fixed (capped), percent (rounded, maxDiscount, edge 0%).
  - Playwright (`npm run test:e2e`): 3 spec file, browser Chromium+mobile.
    - `tests/e2e/checkout.spec.ts` — produk dari DB, tambah ke keranjang, guest redirect login, form checkout, voucher SEHAT10.
    - `tests/e2e/pos.spec.ts` — auth guard, katalog, klik → keranjang, scan barcode, tab marketplace.
    - `tests/e2e/returns.spec.ts` — riwayat pesanan, form retur customer, admin orders+returns.
  - **Prasyarat e2e** (diperbarui 2026-10-09): `npm run dev` + koneksi ke Supabase (XAMPP sudah tidak
    dipakai sejak §7d) + **`npm run db:seed` DAN `npm run db:seed:demo`**. Seeder data uji wajib karena
    menyediakan akun customer beserta alamat kirim & riwayat pesanan yang dipakai spec checkout/retur.
    Akun yang dipakai:
    - Customer: `budi@example.com` / *(dari `SEED_CUSTOMER_PASSWORD`)* (dari `db:seed:demo`; juga ada `siti@`/`hendra@example.com`)
    - Admin: `admin@si4care.com` / *(dari `SEED_ADMIN_PASSWORD`)*
    - Super Admin: `superadmin@si4care.com` / *(dari `SEED_SUPERADMIN_PASSWORD`)*
    - ⚠️ `testing@gmail.com` / `testing123` yang tercatat di versi sebelumnya **tidak pernah ada di
      seeder mana pun** — itu sebabnya seluruh spec customer gagal login. Jangan dipakai lagi.
  - **Status 2026-10-09**: 4 spec file, **52/52 lolos** (chromium + mobile), nol skip. Spec `admin-flow`
    baru ditambahkan. Riwayat perbaikannya di §7g.
- [x] **Foto Produk Per-Item** — sudah selesai (belum ada foto real, tapi infrastruktur 100% complete):
  - Schema: `products.imageUrl` (VARCHAR 500) + migration di 0004
  - `/api/upload?folder=products` — auth-guarded endpoint, support JPG/PNG/WebP/GIF (max 5MB), fallback lokal `/public/uploads/products/`
  - `ImageUpload` component — drag-drop upload, preview, delete, loading state
  - `ProductDialog` — integrated photo field di admin/products
  - `getShopProducts()` — returns imageUrl untuk semua produk
  - `ProductCard` — display imageUrl (fallback ke kategori foto jika null)
  - **R2 Swap (before deploy)**: set `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` di `.env.local`
- [x] Deploy hemat memori: `output: "standalone"` di next.config, VPS ≥1GB + swap, atau Vercel; cetak struk thermal ESC/POS + label barcode 33×15mm — usang: deploy ke Vercel (`output: standalone` tidak perlu); `vercel.json` mengunci region `sin1`. Struk thermal → **K8**

---

### 7d. Migrasi MySQL → PostgreSQL / Supabase (selesai 2026-10-08)

Alasan: owner memilih hosting gratis yang tetap SQL. Supabase free tier (PostgreSQL 500MB)
dipilih karena Drizzle mendukungnya penuh, jadi schema & server actions tidak perlu ditulis ulang.
Firestore sempat dipertimbangkan tapi ditolak — butuh denormalisasi, tidak punya JOIN untuk
laporan agregat, dan batas 25 write per transaksi berisiko untuk POS.

**Yang berubah di kode:**
- `src/lib/db/schema.ts` — `mysqlTable`→`pgTable`, `int`→`integer`, `mysqlEnum`→`pgEnum`.
  Di PostgreSQL enum adalah tipe terpisah: dideklarasikan di atas file (11 enum) lalu direferensikan.
- `src/lib/db/auth-schema.ts` — ditulis ulang ke `pgTable`; `timestamp({fsp:3})`→`{precision:3}`.
- `src/lib/auth/index.ts` — drizzleAdapter `provider: "mysql"` → `"pg"`.
- `src/lib/db/index.ts` — driver `mysql2` → `postgres-js` (`prepare:false` + `ssl:"require"` untuk Supabase).
- `drizzle.config.ts` — dialect `mysql` → `postgresql`.
- `src/actions/vouchers.ts` — `.onDuplicateKeyUpdate()` → `.onConflictDoUpdate({target, set})`.
- `src/actions/reports.ts` — `DATE_FORMAT(x,'%Y-%m')` → `TO_CHAR(x,'YYYY-MM')`; 12× `CAST(... AS CHAR)` → `AS TEXT`;
  **(temuan 2026-10-08, terlewat di pass pertama)** 2× `CAST(... AS SIGNED)` → `AS INTEGER`; 10× `DATE(col)` → `(col)::date`.
- `src/actions/alarms.ts` — **(temuan 2026-10-08)** `CURDATE()` → `CURRENT_DATE`; `DATE_ADD(CURDATE(), INTERVAL 30 DAY)` → `CURRENT_DATE + INTERVAL '30 days'`.
  Pelajaran: pass pertama hanya grep `DATE_FORMAT`/`AS CHAR`/`IFNULL`. Sintaks MySQL lain (`AS SIGNED`, `DATE(`, `CURDATE`, `DATE_ADD`)
  baru ketahuan saat menyiapkan uji laporan. Grep menyeluruh: `AS SIGNED|AS UNSIGNED|CURDATE|DATE_ADD|DATE_FORMAT|DATE\(|AS CHAR|onDuplicate`.
- `scripts/test-reports.ts` (baru) + `npm run test:reports` — buat 3 transaksi POS nyata (pakai `allocateStock`+`calcCartTotals` asli),
  jalankan `getReportData` yang sebenarnya, verifikasi angka vs hitungan independen. Idempotent (notes=`TEST-REPORTS`, stok dipulihkan tiap run).
  **Raw SQL tidak tertangkap `tsc`** — selalu uji query laporan langsung ke DB setelah ubah dialect.
- `scripts/db-backup.sh` (baru) — `mysqldump` → `pg_dump`. Memilih pg_dump ≥ versi server otomatis
  (Homebrew sering memasang versi lama di PATH; libpq biasanya lebih baru).
- `.github/workflows/db-backup.yml` — mysqldump → pg_dump; sekarang butuh **secret `DATABASE_URL`**
  di repo settings (secret `MYSQL_*` lama sudah tidak dipakai).
- Migration MySQL `0000`–`0004` + `drizzle/meta/` **dihapus** (snapshot tidak kompatibel lintas dialect).
  Riwayatnya masih ada di git history commit `4493c93` ke belakang.

**Catatan operasional penting:**
- Versi `drizzle-orm` & `drizzle-kit` **harus cocok dengan peer dependency `better-auth`**
  (saat ini `drizzle-orm@0.45.x` + `drizzle-kit@0.31.x`). Menurunkan salah satunya memicu
  `ERESOLVE` saat `npm install` dan `ERR_PACKAGE_PATH_NOT_EXPORTED` saat runtime.
- `npm run db:push` bersifat interaktif dan bisa menggantung di sesi non-interaktif.
  Untuk perubahan schema pakai `npm run db:generate` lalu jalankan SQL-nya, atau `db:migrate`.
- Supabase free tier: **direct connection hanya IPv6**. Jaringan tanpa IPv6 wajib lewat
  session pooler (`aws-0-<region>.pooler.supabase.com:5432`, user `postgres.<project-ref>`).
- **Sebagian ISP Indonesia memblokir port 5432/6543.** Gejalanya menipu: TCP handshake berhasil,
  tapi koneksi diputus ~1 RTT kemudian tanpa pesan error, sehingga mirip password salah.
  Cara memastikan: tes dari jaringan lain (tethering seluler). Kalau berhasil di sana,
  masalahnya ISP — bukan kredensial dan bukan Supabase.

**Utang yang sengaja ditinggalkan:**
- [x] `mysql2` masih terdaftar di `dependencies`. **Jangan dihapus dulu** — git worktree **→ SELESAI 2026-10-11**: bukan dependensi langsung lagi (worktree `grizzly-slip` sudah tak ada; `swamp-tracker` tak punya node_modules). Tersisa hanya sebagai peer dependency opsional `better-auth`/`drizzle-orm`.
  `.kilo/worktrees/grizzly-slip` berbagi `node_modules` dengan root dan kodenya masih mengimpor
  `drizzle-orm/mysql2`. Hapus setelah worktree itu selesai/dibuang.
- [ ] Set secret `DATABASE_URL` di GitHub repo settings agar workflow backup harian jalan lagi.  → **O13**
- [x] ADR-0001 ditandai superseded + dibuat `docs/adr/0002-pindah-ke-postgresql-supabase.md` — selesai 2026-10-08.

---

### 7e. Jebakan migrasi #2 — agregat SQL mengembalikan **string** (ditemukan 2026-10-09)

Ditemukan saat `npm run test:reports` akhirnya bisa dijalankan. Gejalanya halus: laporan
menampilkan `Transaksi: 03` — hasil `0 + "3"` (konkatenasi string), bukan `0 + 3`.

**Sebabnya:** di PostgreSQL `COUNT(*)` bertipe `bigint` dan `SUM(integer)` juga `bigint`;
driver `postgres-js` menyerahkan `bigint` & `numeric` sebagai **string** supaya presisi tidak
hilang. `mysql2` dulu mengembalikan `number`, jadi semua kode yang ikut terbawa migrasi
mengasumsikan number. Anotasi `sql<number>` **hanya klaim tipe** — Drizzle tidak mengonversi
apa pun saat runtime, dan `tsc` tidak memeriksa isi template `sql\`...\``.

Dibuktikan langsung ke DB:

| SQL | typeof hasil |
|---|---|
| `COUNT(*)` | `string` |
| `CAST(COUNT(*) AS INTEGER)` | `number` ✓ |
| `SUM(kolom_integer)` | `string` |
| `CAST(SUM(int) AS INTEGER)` | `number` ✓ |
| `SUM(kolom_decimal)` | `string` (butuh `parseFloat`) |

**Yang diperbaiki:**
- `src/actions/reports.ts` — 4× `COUNT(*)` → `CAST(COUNT(*) AS INTEGER)` (`count`, `jumlah`, 2× `vol`).
- `src/actions/products.ts` — 2× `COALESCE(SUM(remaining),0)` → dibungkus `CAST(... AS INTEGER)`.
  **Ini bug yang tidak tertangkap test mana pun**: `getVariants()` mengembalikan `rows as VariantRow[]`
  (cast telanjang, tanpa konversi), sehingga `totalStock` berupa string. Di
  `admin/products/_components/products-client.tsx` badge dihitung dengan `v.totalStock === 0` —
  dan `"0" === 0` itu `false`, jadi **produk berstok 0 tidak pernah ditandai "habis"**, hanya "ok".
  Perbandingan `<` lolos karena JS mengoersi, jadi bug ini tersembunyi di balik kode yang
  sebagian tampak benar.
- `scripts/test-reports.ts` — pemilihan varian sebelumnya hanya menyaring `remaining > 5`, padahal
  `allocateStock` membuang batch kadaluarsa (seed sengaja punya 1 batch expired untuk uji alarm),
  dan tanpa `ORDER BY` urutan Postgres bebas → script lolos/gagal berganti-ganti tiap run.
  Sekarang menyaring kadaluarsa + `orderBy` deterministik. Ditambah mode `--clean`
  (`npm run test:reports:clean`) untuk menghapus transaksi uji sebelum go-live.

**Sudah aman (tidak perlu diubah)** — sudah dibungkus konversi di sisi JS:
`pos.ts` (`Number(r.stock)`, `parseFloat(r.avgHpp)`), `stock-opname.ts` (`Number(v.systemStock)`,
`Number(v.avgHpp)`), `marketplace-settlement.ts` (`Number(c.cnt)`), `alarms.ts` (`Number(r.stock)`,
anotasinya pun sudah jujur `sql<string>`). Catatan: anotasi `sql<number>` di `pos.ts:57` dan
`stock-opname.ts:47-48` masih menyesatkan walau runtime-nya benar — jangan dijadikan contoh.

**Aturan untuk query agregat baru:** bungkus hitungan bilangan bulat dengan
`CAST(... AS INTEGER)` di SQL, atau konversi eksplisit (`Number()`/`parseFloat()`) di sisi JS.
Jangan pernah mengandalkan anotasi `sql<number>`. Grep pemeriksa:
`grep -rnE "COUNT\(|SUM\(|AVG\(" src --include='*.ts' | grep -vE "AS TEXT|AS INTEGER|AS DECIMAL"`
— lalu untuk setiap hasil, pastikan konsumennya mengonversi.

---

### 7f. Server action tanpa auth guard (ditemukan & ditutup 2026-10-09)

**Blocker deploy.** Ditemukan tidak sengaja: mau menguji `closeSession()` lewat script, ternyata
`src/actions/stock-opname.ts` tidak mengimpor `server-auth` sama sekali.

**Kenapa ini berbahaya.** Fungsi di file `"use server"` menjadi **endpoint POST**. Begitu fungsi itu
direferensikan dari sebuah client component, ID action-nya ikut ke bundle browser — artinya siapa pun
bisa mem-POST endpoint itu tanpa login. Guard di `admin/layout.tsx` **tidak melindungi** jalur ini:
layout hanya menjaga render halaman, bukan pemanggilan action. Jadi guard wajib ada **di dalam
action-nya sendiri**.

Cara memeriksa apakah sebuah action benar-benar terekspos — cek apakah ada client component yang
mengimpornya:

```bash
# daftar action tanpa guard
for f in src/actions/*.ts; do
  grep -q "requireAdmin()\|requireSession()\|auth.api.getSession" "$f" || echo "TANPA GUARD: $f"
done
# untuk nama fungsi tertentu: apakah dipakai dari client component?
grep -rl "<namaFungsi>" src --include='*.tsx' | xargs -I{} sh -c 'head -1 {} | grep -q "use client" && echo {}'
```

**Yang ditemukan terekspos ke publik:**

| Fungsi | Dipanggil dari | Dampak |
|---|---|---|
| `closeSession`, `startSoSession`, `saveOpnameProgress` | `stock-opname-client.tsx` | **Kritis** — stok bisa disetel sewenang-wenang (delta FIFO/FEFO langsung ke `batches.remaining`) |
| `updateContentSection` | `landing-editor-client.tsx` | Tinggi — defacement konten |
| `getReportData` | `reports-client.tsx` | Tinggi — bocornya seluruh penjualan, HPP, margin |

`getLiveAlarms`, `getOpenSession`, `getSessionHistory` hanya dipanggil server component (belum
terekspos), tapi tetap diberi guard sebagai pertahanan berlapis.

**Yang sengaja TIDAK diberi guard:** `getContentSections()` — dipakai `admin/content/page.tsx` dan
berpotensi dipakai landing publik nanti (lihat §7g). Jangan tambahkan `requireAdmin()` di situ tanpa
memeriksa pemanggilnya lebih dulu.

**Catatan arsitektur:** `getReportData` juga dipakai `scripts/test-reports.ts`, yang berjalan di luar
request context sehingga `requireAdmin()` (lewat `headers()`) akan melempar error. Karena itu query-nya
dipindahkan ke **`src/lib/reports-query.ts`** (`buildReportData`, modul biasa), dan
`src/actions/reports.ts` tinggal wrapper tipis ber-guard yang me-reekspor tipenya. Pola ini yang
dipakai kalau ada logika lain yang perlu diuji di luar request context.

**Masih terbuka (§7c, P3):** output escaping, CSRF token, role DB least-privilege.
Security headers + CSP sudah ada di `next.config.ts`. Jangan anggap §7f menutup seluruh security pass.

---

### 7g. Temuan saat merapikan E2E (2026-10-09)

Suite E2E belum pernah dijalankan ulang sejak migrasi. Begitu dijalankan: **34 dari 38 test gagal** —
semuanya karena spec-nya usang/salah, **bukan** karena aplikasi rusak. Setelah dirapikan: **52/52 lolos**.

**Akar masalah yang berulang — layak diingat saat menulis test baru:**

1. **Strict mode violation karena duplikasi responsif.** Tabel/judul admin punya pasangan
   desktop + card-view mobile; versi yang tidak aktif **tetap ada di DOM** dalam keadaan hidden.
   `.first()` bisa mengunci elemen tersembunyi → gagal "visible". Pakai
   `.filter({ visible: true }).first()`.
2. **Navbar punya tombol "Masuk" juga**, jadi `getByRole("button", {name:/masuk/i})` di halaman login
   cocok 2 elemen. Scope ke `page.locator("form")`.
3. **Test guard akses ditaruh di dalam `describe` yang `beforeEach`-nya login.** Komentarnya bahkan
   menulis "test ini tidak pakai beforeEach login" — padahal `beforeEach` berlaku ke semua test di
   describe itu, jadi sesi sudah terpasang dan redirect ke `/login` tak pernah terjadi. Taruh test
   kontrol akses di `describe` sendiri.
4. **Selector dikarang, tidak dicek ke UI.** `getByRole("tab")` padahal `pos-client.tsx` memakai
   `<button>` biasa; `locator("form")` di `/checkout` padahal halaman itu **tidak punya elemen
   `<form>` sama sekali`; `[data-testid="cart-item"]`/`tr` padahal halaman keranjang me-render `<div>`.
5. **Asersi yang lolos walau fitur gagal.** Test keranjang memakai
   `locator("h1,h2").filter({hasText:/keranjang/i})` — dan itu cocok ke **"Keranjang Anda Kosong"**,
   jadi test tetap hijau untuk keranjang kosong. Sekarang diasersi ke "Keranjang Belanja" yang hanya
   dirender saat keranjang berisi.
6. **Test yang diam-diam di-skip.** Uji voucher memakai `getByPlaceholder(/kode voucher|voucher/i)`,
   sedangkan placeholder sebenarnya "Masukkan kode promo" → tidak cocok → masuk cabang
   `test.skip()`. Jadi **item P1 "checkout voucher SEHAT10" sebenarnya belum pernah teruji** meski
   suite-nya hijau. Hati-hati dengan `if (await x.isVisible()) {...} else { test.skip() }` — itu
   menyembunyikan test yang rusak.
7. **Akun test tidak pernah di-seed.** Spec memakai `testing@gmail.com` / `testing123` yang tidak ada
   di seeder mana pun (hilang saat re-seed pasca-migrasi). Sekarang memakai `budi@example.com` /
   *(dari `SEED_CUSTOMER_PASSWORD`)* dari `npm run db:seed:demo`, lengkap dengan alamat + riwayat pesanan, jadi suite
   bisa direproduksi tanpa membuat akun manual.
8. **Minimum belanja voucher bikin test rapuh.** `SEHAT10` minimum Rp100.000 sedangkan produk termurah
   Rp25.000, jadi "tambah produk pertama" tidak deterministik. Spec sekarang menyaring lewat kotak
   cari `/shop` ke produk mahal (Nebulizer Rp620.000).

**Perbaikan di kode aplikasi (bukan test):** tombol Scan di POS memakai label `hidden sm:inline`,
jadi di viewport mobile tombol itu **tidak punya nama aksesibel** sama sekali — ditambah `aria-label`.
Ini a11y defect nyata yang tersingkap karena testnya ter-skip di mobile.

**Spec baru:** `tests/e2e/admin-flow.spec.ts` — smoke test `/admin/reports`, `/admin/alarms`,
`/admin/stock-opname`, `/admin/products` dengan sesi admin, plus pengecekan redirect tanpa sesi.
Gunanya menangkap guard §7f yang salah pasang: guard keliru tampak sebagai halaman error/kosong
saat login, bukan sebagai redirect.

#### Celah fungsional: CMS tulis ke DB, baca dari localStorage

Ditemukan saat memeriksa pemanggil `getContentSections`. **Fase 4.1 ("CMS Konten → DB") hanya
setengah jadi:**

- Editor admin (`landing-editor-client.tsx`) menulis ke tabel `content_sections` ✓
- Tapi halaman depan (`(landing)/page.tsx`, `hero.tsx`, `cta.tsx`, `testimonials.tsx`, `faq.tsx`)
  membaca lewat `useContent()` → `ContentContext` → **`localStorage` saja**, tidak pernah dari DB.

Akibatnya **edit konten oleh admin tidak pernah terlihat pengunjung lain** — hanya tersimpan di DB
tanpa pembaca, sementara publik selalu melihat `DEFAULT_CONTENT`. Jadi jangan mengandalkan alur ini
(sudah diperbaiki 2026-10-11, lihat §7h #2).

- [x] **Sambungkan jalur baca CMS ke DB.** Rencana: `(landing)/page.tsx` jadi async server component
  **→ SELESAI 2026-10-11** — lihat §7h #2.
  yang memanggil `getContentSections()`, lalu hasilnya di-inject sebagai nilai awal
  `ContentProvider` (`initialContent`), dengan `localStorage` dipakai hanya sebagai cache. Perlu
  mengubah API `ContentProvider`, jadi **sengaja tidak dikerjakan menjelang deploy** — butuh
  persetujuan owner karena menyentuh halaman depan.

---

### 7h. Temuan & perbaikan sesi 2026-10-10 → 10-11

**Pemicu:** kredensial akhirnya diisi dan build production dijalankan untuk pertama kalinya sejak migrasi. Hampir
semua temuan di bawah **tersembunyi oleh `npm run dev`** (di dev halaman selalu dirender ulang, CSP lebih longgar,
status HTTP di-stream) dan hanya terlihat lewat `npm run build` + `next start` + serangan langsung.

1. **API Komerce berubah total, bukan sekadar pindah host.** `merchant-api.komerce.id` → NXDOMAIN. Baru:
   `rajaongkir.komerce.id/api/v1`, `POST /calculate/domestic-cost`, `x-www-form-urlencoded`, dan `origin`/`destination`
   berupa **ID numerik** dari pencarian wilayah (bukan nama kota). Ditulis ulang di `lib/komerce.ts` (resolve nama kota →
   ID, memo + cache, filter layanan kargo `JTR>200`/`DANGEROUS GOODS`, `0 day` → "Hari ini"). Untuk rute uji hanya
   `jne`, `pos`, `sap` yang menjawab; `jnt`/`sicepat` dijawab 404 (diabaikan). Route `shipping/destinations` & `test` juga diperbarui.
   Database Upstash lama **sudah tidak ada** — `lib/cache.ts` (tak pernah melempar, timeout 1,5 dtk, *circuit breaker* 30 dtk)
   membuat Redis mati hanya menurunkan kualitas: sebelumnya `/api/shipping/cost` → **HTTP 500** → checkout tak bisa memuat ongkir.
2. **CMS menulis ke DB tapi landing membaca `localStorage`** — edit admin tak pernah terlihat pengunjung. Sekarang
   `lib/content-query.ts` (`loadContent` untuk render, `readStoredContent` yang **melempar** untuk jalur tulis — supaya DB yang
   gagal dibaca sesaat tak berujung menimpa konten tersimpan dengan default), `ContentProvider` menerima `initialContent`
   dari `(landing)/layout.tsx`. `DEFAULT_CONTENT` yang tadinya ditulis dua kali kini satu (`lib/content-defaults.ts`).
3. **Jebakan render statis saat build.** `/`, `/shop`, `/blog`, `/blog/[slug]` membaca DB tanpa API dinamis, sehingga Next
   merendernya **sekali saat build** — produk, harga, stok, artikel, dan konten CMS "terbakar" sampai deploy ulang. Diperbaiki
   dengan `export const revalidate = 60` + `lib/revalidate.ts` (`revalidatePath` di semua mutasi katalog/artikel/CMS).
   **Cek di tabel rute build: kolom `Revalidate` harus terisi** untuk halaman publik yang membaca DB. Dibuktikan di production:
   edit DB tidak langsung terlihat (di-cache), lalu muncul setelah jendela 60 dtk tanpa deploy ulang.
   `shop/[id]` memakai `generateStaticParams`, dan `shop/loading.tsx` **dihapus**: batas Suspense-nya membuat Next mengirim
   cangkang HTTP 200 sebelum `notFound()` sempat jalan, sehingga ID produk yang tak ada menghasilkan *soft 404*.
4. **Halaman detail produk mengabaikan ID di URL** dan selalu menampilkan satu produk contoh (`DEMO_PRODUCT_DETAIL`), dengan
   tombol keranjang yang menambahkan item ber-ID palsu. Kini server component + `lib/shop-queries.ts` (varian, stok, atribut,
   metadata, 404). `mock-data.ts` dihapus.
5. **Angka karangan di UI dibuang** (tidak ada fitur ulasan/pelanggan yang mendukungnya): rating bawaan `4.8 · 0 terjual` di
   *setiap* kartu produk, "4,9/5 · 2.847 ulasan" (hero & testimoni), "10.000+ pelanggan puas", "500+ produk", statistik
   "10rb+ / 500+ / 34 provinsi", harga coret & badge "Terlaris" palsu, 7 produk unggulan fiktif, 3 artikel fiktif. Diganti data
   DB atau fakta sistem. **Dashboard `/admin` — 477 baris angka karangan beserta `periodFactor` palsu — kini dari DB**
   (`lib/dashboard-query.ts`; omzet bruto = ledger + MDR + biaya agar MDR tak terpotong dua kali; 45 cek vs SQL independen).
6. **Ledger hanya diisi alur POS.** Pesanan web (Midtrans) dan settlement marketplace tak pernah menulis `ledger_entries`,
   sehingga `/admin/reports` di operasi nyata hanya memuat penjualan POS (data uji menutupinya karena `seed-demo` mengisi
   ledger manual). Kini `lib/ledger.ts` (idempoten) + `lib/ledger-calc.ts` (murni, diuji): web = `subtotal − diskon`
   (ongkir titipan kurir & service fee tidak dihitung; harga sudah termasuk PPN, sama seperti POS), marketplace = `netAmount`
   saat settlement selesai (basis kas) dan **dihapus lagi bila status dikembalikan ke pending**.
7. **Webhook Midtrans tidak atomik:** stok dipotong dulu, status diubah belakangan — proses mati di antaranya → webhook
   dikirim ulang → stok terpotong dua kali. Kini satu transaksi dengan klaim `UPDATE … WHERE status='pending_payment' RETURNING`;
   3 webhook bersamaan → tepat 1 diproses. `validateSettlement` juga kini hanya menerima transaksi marketplace (dulu id apa
   pun, termasuk transaksi POS, bisa diubah) dan diekstrak ke `lib/marketplace-settle.ts` agar bisa diuji.
8. **Nama env R2 tidak cocok:** `r2.ts` membaca `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`, sementara `.env` & dokumentasi
   memakai `R2_ACCESS_KEY`/`R2_SECRET_KEY` — `.env` yang diisi benar membuat `r2Configured` diam-diam `false` dan upload jatuh
   ke disk lokal (read-only di Vercel → 500). Kini kedua nama diterima; production tanpa R2 → HTTP 503 yang jelas; ekstensi
   file diturunkan dari tipe MIME tervalidasi, bukan dari nama file kiriman pengguna.
9. **Pooler Supabase.** (a) Mode *session* (5432) hanya mengizinkan **15 klien untuk seluruh proyek** (`EMAXCONNSESSION`):
   `postgres-js` membuka 10 koneksi per proses dan tiap hot-reload dev membuat klien baru tanpa menutup yang lama.
   Kini `max` kecil (5 dev / 3 production, `DATABASE_POOL_MAX`), `idle_timeout`, dan klien tunggal lintas hot-reload.
   (b) **Mode transaksi (6543) — wajib untuk serverless — menggantung selamanya** bila satu koneksi menerima belasan query
   berbeda sekaligus (`Promise.all`). Direproduksi dengan klien `postgres` mentah tanpa Drizzle (15 query: berurutan OK,
   bersamaan timeout; mulai ±11 query, kadang lebih sedikit). `max_pipeline: 1` **tidak menolong** (`sent.length < max_pipeline`
   dievaluasi setelah query pertama aktif → minimal 2 tetap terbang). Solusi: `lib/db/limit-concurrency.ts` menjaga jumlah
   query aktif ≤ jumlah koneksi → tak ada pipelining. Dashboard di 6543: dari menggantung menjadi 5/5 sukses ±350 ms.
   Tanpa ini dashboard/laporan akan menggantung begitu di-deploy ke Vercel.
10. **Validasi env (`lib/env.ts` + `src/instrumentation.ts`).** Tiga tingkat: *error* (production menolak melayani request),
    *peringatan*, sehat. Menangkap: kredensial Midtrans kosong, kunci Sandbox vs Production tak cocok `MIDTRANS_IS_PRODUCTION`,
    `BETTER_AUTH_URL` localhost di production, Redis/R2 terisi separuh, `DATABASE_URL` pooler session di production.
    Di development hanya mencetak peringatan. Terbukti: server production dengan env salah menjawab 500 + daftar persis.
11. **Rate-limit login aktif di production** (10 percobaan/15 mnt per IP; sebelumnya `enabled:false` permanen): storage Redis
    atomik, fallback penghitung memori. Terbukti: percobaan ke-11 → HTTP 429. Sebelum breaker, tiap percobaan menunggu timeout
    Redis 1,5 dtk saat Redis mati; kini 2,6 dtk sekali lalu ±0,15 dtk.
12. **Foto kategori dari DB** (`categories.imageUrl`) ke kartu produk & POS. Sebelumnya `CategoryContext` — localStorage dengan
    SEED hardcoded 6 kategori (DB punya 4) — sehingga foto yang diunggah admin tak pernah tampil. Context dihapus.
13. **Data kontak placeholder terpusat** di `lib/site-config.ts`: nomor WhatsApp `6285555555555` (palsu) tertulis di 2 file,
    alamat dalam 2 versi berbeda, 2 nomor telepon. Halaman Pengaturan admin hanya tampilan (K1).
14. **Seed artikel hilang** — artikel lama dulu dimasukkan langsung ke XAMPP dan tak pernah tercatat di repo; blog kosong
    setelah migrasi. `seed.ts` kini memuat 3 artikel contoh (idempoten, **ganti dengan tulisan asli**).
15. **`scripts/test-action-security.ts`** (`npm run test:security`): menyerang 7 server action sensitif di build production
    dengan cookie palsu dan sebagai pelanggan asli, dengan kontrol positif (admin harus bisa membaca) dan perbandingan
    snapshot DB. Perhatian: server action hanya jalan lewat **rute yang membundelnya**, dan `proxy.ts` hanya mengecek *adanya*
    cookie — percobaan pertama saya mem-POST ke `/` sehingga semua tampak "bocor" padahal request tak pernah sampai ke action.
16. **`scripts/set-password.ts`** (`npm run db:set-password`): `db:seed` melewati akun yang sudah ada, jadi tak ada cara lain
    mengganti password akun seed. Password lewat env (bukan argumen), sesi lama dicabut. Diuji end-to-end.
17. **Infrastruktur E2E:** `locator.isVisible({timeout})` **tidak menunggu** (timeout diabaikan) → tes yang memakai
    `if (await x.isVisible()) … else test.skip()` diam-diam di-skip saat halaman belum dirender; ditulis ulang dengan `expect`.
    `/shop` di mobile kadang punya 2 kotak cari (panel filter di-mount lewat portal) → pakai `.filter({visible:true})`.
    `npx playwright` langsung **tidak memuat `.env.local`** — jalankan lewat `npm run test:e2e`. Suite dijalankan 1 worker
    (mesin pengembangan sempat load average 60; dengan 2 worker tes yang sehat sesekali melewati batas waktu).
18. Lain-lain: CSP `unsafe-eval` hanya di development (lencana "1 Issue" di dev = React eval diblokir CSP); `data-scroll-behavior`
    di `<html>`; host Komerce di CSP diperbarui; tab POS → `Tabs` shadcn (semantik `role="tab"`); `aria-label` tombol Scan;
    lint 34 → 15 error.

**Pelajaran yang berlaku seterusnya**
- Halaman publik yang membaca DB: **cek tabel rute `npm run build`** (harus ada `Revalidate`) dan uji dengan `next start`, bukan hanya `npm run dev`.
- Harness uji harus punya **kontrol positif** (hal yang *harus* berhasil) — tanpa itu "semua ditolak" bisa berarti "tak pernah sampai".
- Verifikasi pemulihan data produksi dengan **hash** (`md5(data::text)`), bukan ukuran file (byte ≠ karakter).
- Jangan pernah merangkai `cmd || echo` / `| tail` lalu membaca exit code-nya sebagai milik `cmd`.

---

## 8. Aturan Untuk AI yang Melanjutkan

1. Baca `AGENTS.md` (aturan agent), `prd.md` (requirement), lalu file ini (status + riwayat di Log Sesi).
2. Next.js versi ini ≠ training data — baca `node_modules/next/dist/docs/` sebelum menulis kode Next.
3. Jangan tambah dependensi tanpa alasan kuat; proyek ini sengaja ramping.
4. Ikuti token desain & komponen yang ada. Jangan ubah palet/font/radius.
5. Halaman admin besar (pos 763 baris, reports 673, products 553) — bila menyentuhnya, pecah jadi sub-komponen di folder `_components/` halaman tsb; jangan biarkan tumbuh.
6. Setiap selesai sesi: jalankan `npx tsc --noEmit` + `npm run lint`, centang item di sini, tambah 1 entri di Log Sesi.

## Log Sesi

- **2026-10-10 → 10-11 — Production-readiness: 18 temuan, semuanya diperbaiki dan dibuktikan di build production**:
  Setelah kredensial Midtrans/Komerce diisi (Midtrans hidup; Upstash lama sudah dihapus; API Komerce berubah total), build
  production dijalankan pertama kali dan membuka serangkaian masalah yang disembunyikan `npm run dev`. Yang terpenting:
  halaman publik yang membaca DB (`/`, `/shop`, `/blog`) **terbakar statis saat build** (→ ISR `revalidate=60` + `revalidatePath`);
  `/shop/[id]` mengabaikan ID dan selalu menampilkan produk contoh; dashboard admin 477 baris angka karangan; ledger tak pernah
  diisi pesanan web & marketplace; webhook Midtrans tidak atomik (stok bisa terpotong dua kali); **pooler transaksi Supabase
  menggantung** bila satu koneksi menerima banyak query berbeda sekaligus (dibuktikan dengan klien `postgres` mentah; diperbaiki
  `limitConcurrency`); `.env` R2 memakai nama berbeda dari kode; rating/ulasan/pelanggan karangan di UI; kontak placeholder
  tersebar di ±10 file. Ditambahkan: `lib/env.ts` + `instrumentation.ts` (server production menolak start bila env salah),
  rate-limit login, `lib/komerce.ts`, `lib/cache.ts` (breaker), `lib/ledger*.ts`, `lib/dashboard-*.ts`, `lib/site-config.ts`,
  `vercel.json` (region sin1), `docs/deploy-vercel.md`, `db:set-password`, `.env.example`, dan 6 skrip uji (`test:webhook`,
  `test:settlement`, `test:dashboard`, `test:security`, plus `test:reports`) — semuanya lulus di mode transaksi 6543 terhadap
  server production (16/16, 16/16, 45/45, 9/9, 14/14). Vitest 51 → 115; E2E 52 → 76 (0 skip). Rincian + pelajaran: **§7h**.
  Daftar tugas yang butuh pemilik (O1–O14) ada di bagian status di atas dan `docs/deploy-vercel.md`.
  Satu kesalahan saya dicatat: tabel serangan pertama memberi hasil "bocor" yang keliru karena request di-POST ke rute yang
  tak membundel action; saya tidak menjadikannya dasar kesimpulan dan mengulang dengan metode benar + kontrol positif.

- **2026-10-09 (lanjutan 2) — Setup Vercel + temuan kredensial kosong + daftar eksekusi**:
  Vercel CLI dipasang (**v63.1.0**); percobaan pertama gagal `ECONNRESET` karena tethering tidak
  stabil untuk download besar, berhasil setelah `--fetch-retries=10`. **Pelajaran: jangan rangkai
  `npm install ... || echo` atau `| tail`** — exit code yang dilaporkan jadi milik perintah terakhir,
  bukan npm, sehingga instalasi gagal sempat terbaca "sukses". Verifikasi dengan memeriksa binary &
  log, bukan exit code pipeline. `vercel login` dan MCP butuh OAuth interaktif; plugin guidance
  diblokir untuk AI (self-modification) — semuanya diserahkan ke owner. **Temuan penting saat
  memeriksa kesiapan deploy: 5 kredensial kosong di `.env.local`** (`MIDTRANS_SERVER_KEY`,
  `MIDTRANS_CLIENT_KEY`, `KOMERCE_API_KEY`, `UPSTASH_REDIS_REST_URL`/`_TOKEN`) padahal §7b
  mengklaim terisi — hilang saat `.env.local` dibuat ulang waktu migrasi. Akibatnya **checkout tidak
  bisa diselesaikan**; tidak tertangkap E2E karena spec hanya menguji sampai validasi voucher, belum
  sampai pembayaran. Lolos tanpa sadar karena `midtrans.ts` fallback `?? ""` dan `redis.ts` pakai `!`.
  Temuan lain: `next.config.ts` **sudah** punya security headers + CSP lengkap (3 catatan usang di
  checklist dikoreksi), dan `R2_PUBLIC_URL` dirujuk `next.config.ts` tapi tidak ada di `.env.local`
  sehingga `images.remotePatterns` kosong di production. Juga: perintah plugin di panduan Vercel
  salah auto-detect ke **Cursor**, bukan Claude Code — wajib `--target claude-code`. Seluruh pekerjaan
  tersisa disusun jadi **daftar eksekusi Tahap A–E** di bagian atas file ini, dengan penanda siapa
  yang bisa mengerjakan (owner vs AI).

- **2026-10-09 (lanjutan) — P1 selesai: E2E 52/52 + 4 lubang auth ditutup + celah CMS ditemukan**:
  Menjalankan E2E pertama kali sejak migrasi: **34 dari 38 test gagal**, semuanya karena spec usang,
  bukan aplikasi. Dirapikan jadi **52/52 lolos, nol skip** (4 spec, chromium + mobile). Pola
  kesalahannya didokumentasikan di **§7g** — yang paling penting: (a) uji voucher `SEHAT10` ternyata
  **diam-diam ter-skip** karena placeholder dicari `/kode voucher/` padahal aslinya "Masukkan kode
  promo", jadi item P1 itu sebenarnya belum pernah teruji walau suite hijau; (b) akun
  `testing@gmail.com` yang tercatat di checklist **tidak pernah ada di seeder mana pun** — diganti ke
  `budi@example.com` dari `db:seed:demo`; (c) test kontrol akses ditaruh di dalam `describe` yang
  `beforeEach`-nya login, jadi tidak pernah benar-benar menguji penolakan; (d) asersi keranjang cocok
  ke "Keranjang Anda Kosong" sehingga hijau walau fitur gagal; (e) duplikasi tabel desktop/mobile
  membuat `.first()` mengunci elemen hidden. **Temuan paling serius muncul di luar E2E**: saat
  menyiapkan uji stock opname, ternyata `stock-opname.ts`, `content.ts`, `alarms.ts`, dan `reports.ts`
  **tidak punya auth guard sama sekali** — dan tiga di antaranya direferensikan dari client component,
  artinya endpoint-nya bisa di-POST anonim dari internet; `closeSession()` membolehkan siapa pun
  menyetel ulang stok. Guard di `admin/layout.tsx` tidak melindungi jalur ini karena hanya menjaga
  render halaman. Semua ditutup dengan `requireAdmin()` (§7f). Supaya `scripts/test-reports.ts` tetap
  bisa menguji query asli di luar request context, query laporan dipindah ke
  **`src/lib/reports-query.ts`** dan `actions/reports.ts` jadi wrapper ber-guard. Ditemukan juga
  **celah fungsional**: Fase 4.1 CMS hanya setengah jadi — editor menulis ke DB tapi halaman depan
  masih membaca `localStorage`, jadi **edit konten tidak pernah terlihat pengunjung**; sengaja belum
  diperbaiki karena menyentuh halaman depan (butuh persetujuan owner), dan kemudian
  diperbaiki (§7h #2). Perbaikan kode aplikasi: `aria-label` untuk tombol Scan POS yang di mobile tidak
  punya nama aksesibel. Dibuat panduan uji alur utama (kini `docs/uji-alur-utama.md`) dan `tests/e2e/admin-flow.spec.ts`. Dijalankan
  `npm run db:seed:demo` → 3 customer + alamat + 6 web order (semua status) + 5 POS + 3 marketplace.
  DoD: `tsc` bersih · `eslint` 0 error pada file yang disentuh · unit 51/51 · E2E 52/52 ·
  `test:reports` 9/9 · transaksi uji dibersihkan.

- **2026-10-09 — Koneksi Supabase terverifikasi + `test:reports` 9/9 + temuan bug agregat→string**:
  Jaringan tethering HP diuji bertahap (DNS → TCP → **query nyata**): tembus penuh, PostgreSQL 17.11,
  26 tabel + seed utuh. Ditegaskan di §P0: TCP handshake saja bukan bukti, karena saat ISP memblokir
  handshake tetap lolos lalu koneksi diputus ~1 RTT kemudian — harus dites dengan query sungguhan.
  `npm run test:reports` akhirnya bisa jalan: **run pertama gagal 2/9** dengan gejala `Transaksi: 03`,
  yang membongkar kelas bug migrasi baru — `COUNT(*)`/`SUM(int)` di PostgreSQL bertipe `bigint` dan
  driver `postgres-js` menyerahkannya sebagai **string**, sementara anotasi `sql<number>` hanya klaim
  tipe (tidak mengonversi apa pun) dan `tsc` tidak memeriksa isi template `sql\`...\``. Diperbaiki
  dengan `CAST(... AS INTEGER)`: 4 titik di `reports.ts`, 2 di `products.ts`. **Temuan sampingan yang
  lebih serius**: `products.ts` mengembalikan `rows as VariantRow[]` (cast telanjang) sehingga
  `totalStock` berupa string, dan badge di `products-client.tsx` memakai `v.totalStock === 0` —
  `"0" === 0` itu `false`, jadi **produk berstok 0 selama ini tidak pernah ditandai "habis"**.
  Tidak tertangkap test mana pun; dibuktikan read-only langsung ke DB (sebelum: `"0"` string → badge
  "ok"; sesudah: `0` number → badge "habis"). `scripts/test-reports.ts` juga diperbaiki: dulu memilih
  varian hanya dengan `remaining > 5` tanpa menyaring kadaluarsa (seed sengaja punya 1 batch expired
  untuk uji alarm) dan tanpa `ORDER BY`, jadi hasilnya berganti-ganti tiap run — itu sebabnya run
  kedua gagal di varian berbeda dari run pertama. Ditambah `npm run test:reports:clean` untuk
  menghapus transaksi uji sebelum go-live (diverifikasi: 0 transaksi sisa, 9 batch kembali `quantity =
  remaining`). Detail lengkap + aturan untuk query agregat baru dicatat di **§7e**.
  `npx tsc --noEmit` bersih; `eslint` bersih pada semua file yang disentuh.

- **2026-10-08 (lanjutan) — Perbaikan dok + temuan bug SQL laporan**: Dokumen diselaraskan ke PostgreSQL — README ditulis ulang (status backend aktif, setup `.env.local`, troubleshooting ISP), AGENTS.md (status + section Database berisi jebakan migrasi), prd.md (stack + contoh `pgTable`), ADR-0001 ditandai superseded + dibuat ADR-0002. Workflow backup harian dinonaktifkan sementara (blok `schedule` di-comment; hanya `workflow_dispatch` aktif) sampai secret `DATABASE_URL` diisi. **Saat menyiapkan uji `/admin/reports` ditemukan bug SQL MySQL yang terlewat di pass migrasi pertama**: `CAST(... AS SIGNED)` (2×) + `DATE(col)` (10×) di `reports.ts`, `CURDATE()`/`DATE_ADD()` di `alarms.ts` — semua lolos `tsc` tapi gagal di runtime PostgreSQL. Diperbaiki (`AS INTEGER`, `::date`, `CURRENT_DATE`, `+ INTERVAL '30 days'`). Dibuat `scripts/test-reports.ts` + `npm run test:reports`: bikin 3 transaksi POS nyata via fungsi asli lalu verifikasi angka `getReportData` vs hitungan independen (idempotent, stok dipulihkan). Script terverifikasi meng-compile & membangun query valid; **belum dijalankan penuh** karena jaringan saat ini memblokir port DB — tinggal jalankan di jaringan seluler. `npx tsc --noEmit` bersih.

- **2026-10-08 — Migrasi database MySQL → PostgreSQL (Supabase) — SELESAI**: Owner minta opsi DB gratis; dipilih Supabase free tier karena Drizzle mendukung PostgreSQL penuh (Firestore ditolak: butuh denormalisasi, tanpa JOIN untuk laporan, batas 25 write/transaksi berisiko untuk POS). Dikonversi: `schema.ts` + `auth-schema.ts` ke `pgTable`/`pgEnum` (11 enum jadi tipe terpisah), auth provider ke `pg`, driver ke `postgres-js`, `drizzle.config.ts` ke dialect postgresql. Diperbaiki sintaks MySQL yang lolos typecheck: `onDuplicateKeyUpdate`→`onConflictDoUpdate` (vouchers), `DATE_FORMAT`→`TO_CHAR` + 12× `CAST AS CHAR`→`AS TEXT` (reports — diuji langsung ke DB karena raw SQL tidak dicek `tsc`). Migration MySQL 0000–0004 dihapus (snapshot tak kompatibel), digenerate ulang jadi satu migration PostgreSQL berisi 26 tabel + 11 enum, dieksekusi via Supabase SQL Editor. Kolom `variants.stockMode` sempat jadi camelCase karena enum tanpa nama kolom eksplisit — diperbaiki ke `stock_mode`. Backup: `scripts/db-backup.sh` baru (pg_dump, auto-pilih versi ≥ server) + workflow GitHub dikonversi ke pg_dump (**perlu secret `DATABASE_URL`**). Seed berhasil: 2 akun admin, 4 kategori, 8 produk, 9 varian/batch, 3 voucher, konten landing. Diverifikasi: `/`, `/shop`, `/login` HTTP 200, produk seed tampil di `/shop`, login admin mengembalikan token + role `admin`. `npx tsc --noEmit` bersih; lint tidak bertambah dari file yang disentuh (34 error `react-hooks` pra-eksisting, terhitung dobel karena worktree `.kilo` ikut ter-scan). **Hambatan terbesar: ISP memblokir port PostgreSQL** — TCP handshake lolos tapi koneksi diputus ~1 RTT tanpa pesan error, sangat mirip password salah; terbukti setelah tes dari jaringan lain berhasil. `mysql2` sengaja dipertahankan karena worktree `.kilo/grizzly-slip` masih memakainya.

- **2026-09-24 — Housekeeping + Persiapan Rilis — SELESAI**: Pindahkan `SI4CARE-SRS.docx` + `RAB Si4Care v2.docx` ke `docs/` folder. Fix TypeScript error di `src/lib/db/index.ts` SSL config (spread operator conditional daripada passing `false` langsung). Run `npm run build` lokal — TypeScript ✓ bersih, build artifact berhasil di `.next/`. Dev server verified running; mobile viewport test pada landing hero — responsive sempurna 375x812. Update checklist: mark housekeeping item done, Fase 4.1 CMS done (dari sesi sebelumnya), test mobile/build done. `npx tsc --noEmit` ✓ bersih. Siap commit & push.
- **2026-09-20 — Fase 6: Photo Uploads (Per-Product) review complete — SUDAH SELESAI**: Infrastruktur 100% complete! Schema imageUrl di products table (migration 0004). `/api/upload?folder=products` endpoint auth-guarded, lokal fallback `/public/uploads/products/`. `ImageUpload` component dengan drag-drop, preview, delete. `ProductDialog` integrated. `getShopProducts()` returns imageUrl. `ProductCard` display imageUrl + fallback kategori foto. Siap untuk R2 swap sebelum deploy (set R2_ENDPOINT + credentials). Tinggal admin upload foto real produk.
- **2026-09-20 — Fase 4.1 + Fase 5 selesai (CMS Konten + Order Management Web)**:
  - **Fase 4.1 — CMS Konten → DB**: Tabel `content_sections` (key VARCHAR, data JSON) + server actions (getContentSections, updateContentSection, resetContent). `admin/content/page.tsx` jadi async server component; `landing-editor-client.tsx` client component (Hero/CTA/Visibility/Testimonial/FAQ CRUD, useTransition). Seed data dengan default landing content. Migration 0004 ready. `.env.local` created. `npx tsc --noEmit` ✅ bersih.
  - **Fase 5 — Order Management Web**: Review completed — implementation sudah ada & lengkap (berasal dari Fase 1.3 + Hardening). `/admin/orders`: table (desktop) + card (mobile) dengan filter status, detail dialog (customer, alamat snapshot, pricing, Midtrans verify, status transitions). `/account/orders`: customer riwayat dengan status tabs, quick actions (detail, lacak, retur). Server actions: `getMyOrders()`, `adminGetOrders()`, `adminUpdateOrderStatus()`, `getOrderDetail()`. Auth-guarded & anti-IDOR lengkap. `npx tsc --noEmit` ✅ bersih.
- **2026-06-24 — Chat pelanggan↔admin selesai**: Tabel `chat_threads`+`chat_messages` di schema. Server actions `chat.ts` (getOrCreate, send, poll, adminList, close). UI customer (`account/chat`) + admin (`admin/messages`) di-wire ke DB dengan polling 3 detik. Migration SQL di `docs/sql/chat-migration.sql`. `npx tsc --noEmit` bersih.
- **2026-06-24 — Tests selesai**: Vitest v2 setup (`vitest.config.mts`). 51 unit tests hijau: `stockAllocation.test.ts` (13), `pos-calc.test.ts` (26), `discount.test.ts` (12). Playwright setup (`playwright.config.ts`, `tests/e2e/`): 3 spec file (checkout, pos, returns). Scripts: `npm test`, `npm run test:e2e`. Prasyarat e2e: dev server + akun test di DB. `npx tsc --noEmit` bersih.
- **2026-06-22 — Hardening selesai (paralel di semua slice)**: Audit log tabel + helper `logAudit()`. Anti-rugi di POS + online checkout (tolak jika harga < HPP). AuthZ: `requireAdmin()` ditambah ke marketplace-settlement, vouchers, returns admin, articles (semua sebelumnya tidak terproteksi). Validasi Zod: submitReturn, upsertArticle, validateSettlement. Shared helper `src/lib/server-auth.ts`. QRIS: MDR label diklasifikasikan sebagai biaya toko, tidak surcharge ke pelanggan. `adminUpdateOrderStatus()` server action + audit log. `npx tsc --noEmit` ✅ bersih.
- **2026-06-22 — Fase 3 selesai (Stock Opname + Blog SEO + Backup + Multi-cabang)**: Stock opname berbasis DB (sesi+item, delta FIFO ke batches, riwayat sesi). `articles` tabel + `blog/[slug]` dengan `generateMetadata()` + JSON-LD schema.org. Admin CMS artikel → `_components/articles-manager.tsx` pakai server actions (bukan localStorage). ContentContext dibersihkan dari articles. Backup terjadwal via GitHub Actions (`02:00 WIB`) + `npm run db:backup` lokal. Multi-cabang MVP: tabel `branches` + `branch_id` di 4 tabel inti, default 'main'. Migration via XAMPP. `npx tsc --noEmit` bersih; lint bersih dari file baru.
- **2026-06-22 — Fase 1.5 + Fase 2 selesai**: Laporan dari query DB (bukan hardcode). Barcode scan POS kasir-tab (exact-match Enter → addToCart, feedback 2.5s). Schema baru: `settled_amount`, `app_settings`, `returns` — dimigrasikan direct SQL via XAMPP mysql client (MariaDB 10.4 incompatible dengan `db:push`). Diskon/voucher CRUD + subsidi ongkir + diskon berjenjang persistent di `app_settings`. Marketplace settlement: status UI dari kolom existing. Alarm live: 4 Drizzle query (stok rendah, mendekati ED, kadaluarsa, margin tipis). Retur: tabel + server actions + UI pelanggan + admin (flow karantina 5-state). `npx tsc --noEmit` bersih; semua lint error dari file baru dibersihkan.
- **2026-06-08 (dan sebelumnya)** — barcode per item (input/scan/generate + unduh SVG), POS mobile bottom-sheet, CMS per-section, foto kategori, stock opname, keranjang dipadatkan, voucher checkout.
- **2026-06-10** — kolom biaya/potongan custom POS marketplace, floating contact (WA + chat), room chat pelanggan & menu Pesan admin, halaman kontak disederhanakan, grid produk mobile 2 kolom, audit responsivitas (discounts/inbound/content/orders/detail produk).
- **2026-06-11** — Audit struktur & housekeeping (Claude Code): temuan di bagian 4; dibuat `checklist.md`, `AGENTS.md` diisi aturan proyek.
- **2026-06-11 (lanjutan)** — Housekeeping dieksekusi: hapus build-verify*/tmp (±780 MB), tsconfig & README & nama package dibereskan, mock data disentralisasi ke `src/lib/mock-data.ts` (9 file konsumen jadi impor). tsc bersih; 12 error lint react-hooks pra-eksisting dicatat di §4.
- **2026-06-16/17** — Migrasi backend dimulai (owner menyatakan lanjut). Dibuat `docs/migration-plan-backend.pdf` (rencana lengkap per-fase) & `docs/adr/0001-backend-stack.md` (MySQL + Drizzle + Better Auth, satu stack — alasan: tim 2 orang, familiar MySQL, konsisten `prd.md`). Fase 0 dieksekusi: dependensi terinstall, MySQL lokal (MariaDB 10.4.28 via XAMPP, port 3307 karena bentrok port dengan MySQL Homebrew) tersambung ke `db_toko_si4care`, `.env.local` terisi (DATABASE_URL & BETTER_AUTH_SECRET nyata, sisanya placeholder kosong menunggu pendaftaran akun Upstash/Midtrans/Google/RajaOngkir), struktur folder `src/lib/{db,auth,services,validations}` + `src/actions` dibuat. `npx tsc --noEmit` dicek ulang setelah install — bersih.
- **2026-06-19 — Fase 1.3 diuji end-to-end, lulus**: pembayaran kartu kredit Sandbox berhasil, order tersimpan di DB, stok terpotong via FIFO. Bug: `calcDiscount` dipindah ke `lib/utils/discount.ts`; Script strategy `afterInteractive`; `db.query...with` diganti query manual (MariaDB 10.4 no LATERAL JOIN). Shop di-migrate ke DB sekaligus (bonus). Seed script `npm run db:seed` dibuat (8 produk, 9 varian, 3 voucher).
- **2026-06-19 — Fase 1.3 selesai (Checkout + Midtrans + Ongkir Komerce + Redis)**: Redis client + rate-limit login (Upstash, max 5/15 menit). 4 tabel baru (vouchers, cart_items, orders, order_items) + migration 0002. `createOrder` server action: validasi stok FIFO/FEFO → insert orders+order_items → Midtrans Snap token. `/api/shipping/cost` (Komerce, 3 kurir paralel, fallback built-in, Redis cache 24 jam). `/api/payment/notification` webhook: SHA512 signature verify → deduct batches.remaining. `checkout/page.tsx` jadi server component (session guard + Snap.js Script). `checkout/_components/checkout-client.tsx` pakai data nyata (alamat DB, ongkir API, voucher DB). Dependensi baru: `midtrans-client`. `npx tsc --noEmit` bersih.
- **2026-06-18 — Fase 1.2 selesai (Katalog)**: Tabel `categories`/`products`/`variants`/`batches` dibuat & dimigrasikan. FIFO/FEFO engine murni (`src/lib/utils/stockAllocation.ts`) sesuai prd.md §8.2. Upload foto kategori via `/api/upload` → `public/uploads/` (TODO: ganti R2/S3 sebelum deploy). Halaman `admin/categories`, `admin/products`, `admin/inbound` diubah ke server component + DB — tidak lagi pakai `CategoryContext`/`mock-data.ts` untuk admin. `CategoryContext` masih aktif untuk POS & shop. `npx tsc --noEmit` bersih; 12 lint error pra-eksisting tidak bertambah. Temuan Zod v4: `z.record()` butuh 2 arg; `date()` Drizzle MySQL butuh `{ mode: "string" }`.
- **2026-06-17 (lanjutan) — Fase 1.1 selesai**: skema auth (`user`/`session`/`account`/`verification` via Better Auth CLI generate + field custom `role`/`phone`) dan tabel `addresses` dibuat & dimigrasikan ke `db_toko_si4care`. Better Auth dikonfigurasi penuh (email/password + Google OAuth placeholder), `src/proxy.ts` dibuat (bukan `middleware.ts` — deprecated di Next.js 16, ganti konvensi ke `proxy.ts`/`export function proxy`). Halaman `login`, `register`, `account/layout`, `admin/layout` + `app-sidebar` disambungkan ke session asli (bukan lagi dummy "Budi Santoso"/"Super Admin"); `account/addresses` jadi CRUD nyata via server actions. Diuji end-to-end pakai curl: signup/login, role default `customer`, proteksi `/admin` per role, redirect tanpa sesi — semua sesuai ekspektasi; data uji dihapus setelah verifikasi. `npx tsc --noEmit` & `npm run lint` bersih (12 error react-hooks pra-eksisting tidak bertambah). **Temuan penting**: `drizzle-kit push` punya bug di MariaDB 10.4.28 (gagal `ER_MULTIPLE_PRI_KEY` pada push kedua ke tabel yang sudah ada) — beralih ke workflow `db:generate` + `db:migrate` yang sudah terverifikasi idempotent, dicatat di §7a-lanjutan. Tambahan dependensi: `zod` (sempat hanya transitive lewat better-auth, sekarang dideklarasikan langsung karena dipakai untuk validasi input). Lanjutan: Fase 1.2 — kategori/produk/varian/batch (gantikan `mock-data.ts`).
