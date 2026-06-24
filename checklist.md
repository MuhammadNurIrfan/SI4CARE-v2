# CHECKLIST — SI4CARE-ag1

> Dokumen handoff. Dibaca AI/developer mana pun yang melanjutkan proyek ini.
> Update file ini setiap sesi: centang yang selesai, tambah catatan di bagian "Log Sesi".
> Terakhir diperbarui: 2026-06-17.

---

## 1. Snapshot Proyek

| Hal | Nilai |
|---|---|
| Produk | si4care — platform toko alat kesehatan (e-commerce + back-office/POS) |
| Stack aktual | **Next.js 16 (App Router, src/) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui (base-ui) + framer-motion + recharts** |
| Status | UI masih frontend-only (mock/localStorage), **migrasi backend sudah dimulai 2026-06-17** — Fase 0 (setup) selesai, lihat §7a. |
| Bahasa UI | Indonesia |
| Dokumen sumber | `prd.md` (requirement), `SI4CARE-SRS.docx`, `RAB Si4Care v2.docx`, `docs/migration-plan-backend.pdf` (rencana migrasi), `docs/adr/0001-backend-stack.md` |
| Perintah | `npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit` |
| Backend (baru) | MySQL (lokal: MariaDB 10.4.28 via XAMPP, port 3307) + Drizzle ORM + Better Auth + Upstash Redis + Midtrans + RajaOngkir — lihat ADR-0001 |

**Keputusan desain yang TIDAK boleh diubah tanpa persetujuan owner:**
- Design token di `src/app/globals.css` (oklch): Medical Blue `0.50 0.16 228`, Soft Teal accent, sidebar Deep Navy. Satu accent, netral matang — JANGAN tambah warna baru di luar token.
- Font: Inter (`--font-sans`) + Plus Jakarta Sans (`--font-heading`). 
- Ilustrasi SVG custom per kategori (`(landing)/_components/illustrations.tsx`) — identitas visual, bukan placeholder.
- Komponen UI = shadcn di `src/components/ui/` — jangan tulis ulang dari nol.

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

Kunci localStorage prototipe: `si4care_categories`, `si4care_content_v1`.
Voucher demo: `SEHAT10`, `ALKES5`.

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
- [x] **Tulis ulang `README.md`** — deskripsi, status prototipe, cara run, struktur, link dokumen
- [x] **Ganti `"name": "si4care_temp"`** di package.json → `si4care`
- [ ] **Pindahkan `*.docx` ke `docs/`** (`SI4CARE-SRS.docx`, `RAB Si4Care v2.docx`) — file biner besar sudah ter-commit; minimal keluarkan dari root. Tambah `*.docx` ke .gitignore bila tidak ingin versinya di git
- [x] **`.DS_Store` cleanup** — dihapus dari disk; tidak ada yang ter-commit di git
- [x] **Sentralisasi data mock** — semua data produk/order/POS kini satu sumber di `src/lib/mock-data.ts`; 9 file konsumen (CartContext, shop, shop/[id], checkout, checkout/success, pos, inbound, orders, featured-products) tinggal impor. Saat backend siap: ganti isi mock-data.ts dengan fetch API, konsumen tidak berubah.

Catatan lint (pra-eksisting, bukan dari sentralisasi): `npm run lint` melaporkan 12 error aturan baru `react-hooks` (setState-in-effect / impure-render) di navbar, carousel, use-mobile, CategoryContext, ContentContext, admin/content, login, dll. `npx tsc --noEmit` bersih. Perbaiki saat menyentuh file terkait.

---

## 5. SEBELUM PRESENTASI (prioritas tinggi)

- [ ] Uji di perangkat fisik (bukan DevTools): POS, stock opname, keranjang, checkout
- [ ] `npm run build` di mesin lokal (build sandbox gagal hanya karena unduh Google Fonts)
- [ ] Siapkan 2–3 foto kategori asli untuk demo upload foto
- [ ] Skenario demo tertulis: alur belanja → checkout pakai voucher `SEHAT10` → admin lihat pesanan → POS → stock opname

## 6. NILAI TAMBAH DEMO (menengah, opsional)

- [ ] Halaman detail artikel `/blog/[slug]` (kartu blog belum bisa diklik ke isi)
- [ ] Toast/notifikasi global (sebagian aksi tanpa umpan balik visual) — pakai `sonner`
- [ ] Upload foto per-produk (override foto kategori)
- [ ] Scanner kamera (getUserMedia) untuk tombol Scan di POS
- [ ] Riwayat sesi stock opname
- [ ] Cek kontras WCAG AA untuk `text-muted-foreground` di atas latar muted

---

## 7. MENUJU PRODUKSI (migrasi backend — DIMULAI 2026-06-17)

Rencana lengkap & rinci ada di `docs/migration-plan-backend.pdf` (per-fase, dipetakan ke file prototipe yang ada). Urutan di bawah ini ringkasannya — vertical slice per domain, bukan layer-by-layer.

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
- [ ] Rate-limit login — **dipindah ke Fase 1.3** (Online shop/checkout): butuh Upstash Redis aktif untuk simpan counter percobaan login, dan Redis pertama kali memang diaktifkan di 1.3 untuk cache ongkir RajaOngkir — sekalian setup di situ, jangan lupa.

**Catatan teknis penting (operasional MySQL/MariaDB lokal):** `drizzle-kit push` punya bug reproducible di MariaDB 10.4.28 — push kedua ke tabel yang sudah ada selalu gagal dengan `ER_MULTIPLE_PRI_KEY` pada tabel `account` (drizzle-kit salah membaca PK saat re-introspeksi). **Solusinya: pakai `npm run db:generate` lalu `npm run db:migrate`** (migration file based, terbukti idempotent — sudah dites jalan 2x tanpa error), bukan `npm run db:push`. Script `db:push` masih ada di `package.json` tapi hindari dipakai berulang di tabel yang sudah ada.

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
- [ ] Konten CMS (gantikan localStorage `si4care_content_v1`)
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
  - **Temuan penting MariaDB**: `db.query.X.findFirst/findMany({ with: {...} })` JANGAN dipakai — selalu hasilkan LATERAL JOIN yang gagal di MariaDB 10.4. Ganti dengan `db.select()` + query terpisah untuk relasi.
- [x] **Fase 1.4 — POS + Transaksi Marketplace** — selesai 2026-06-21:
  - Schema baru: `outbound_transactions`, `outbound_items`, `ledger_entries` — migration `0003_wet_jamie_braddock.sql`.
  - `src/lib/pos-calc.ts` — ekstrak kalkulasi murni: `calcLineDiscount`, `calcCartTotals`, `calcMarketplaceNet`, `MDR_RATES`, `PLATFORM_COMMISSION`.
  - `src/actions/pos.ts` — `getPosProducts()` (join variants+batches+HPP rata-rata tertimbang), `savePosTransaction()` (FIFO/FEFO + potong stok + ledger), `saveMarketplaceTransaction()` (booking stok, status pending_settlement).
  - `pos/page.tsx` → thin server wrapper; `_components/pos-client.tsx` (tab switcher); `kasir-tab.tsx` + `marketplace-tab.tsx` wired ke DB.
  - KasirTab: "Konfirmasi Bayar" → server action → potong stok → ledger entry → struk real (refNumber POS-XXXXXX). `router.refresh()` untuk update stok katalog.
  - MarketplaceTab: "Simpan" → server action → booking stok → `outbound_transactions` status `pending_settlement`.
- [ ] Manajemen Pesanan web (admin lihat+update status, customer riwayat dari DB)
- [x] **Fase 3 — Stock Opname + Blog SEO + Backup + Multi-cabang MVP** — selesai 2026-06-22:
  - **Stock Opname** (`admin/stock-opname`): konversi ke server+client split. Schema baru: `stock_opname_sessions` + `stock_opname_items`. Actions: `startSoSession()` (snapshot semua varian aktif ke tabel item), `saveOpnameProgress()`, `closeSession()` (terapkan delta FIFO/FEFO ke `batches.remaining`). UI: tampilkan sesi terbuka dari DB; tombol "Mulai Sesi Baru" + "Simpan Progres" + "Selesaikan"; histori sesi via dialog.
  - **Artikel / Blog SEO** (`(landing)/blog`): tabel `articles` baru + `src/actions/articles.ts` (CRUD, auto-slugify, `getPublishedArticles`, `getArticleBySlug`). `blog/page.tsx` jadi server component (fetch DB). `blog/[slug]/page.tsx` BARU: `generateMetadata()` (title, description, openGraph, twitter, canonical) + JSON-LD schema.org (`Article`/`NewsArticle`). 3 artikel seed di-insert langsung via SQL migration.
  - **Admin CMS Artikel** (`admin/content`): `_components/articles-manager.tsx` BARU — DB-backed CRUD dengan form SEO (metaTitle, metaDescription). Menggantikan inline ArticlesManager yang pakai localStorage. Form editor mendukung Markdown minimal (## heading, - list, paragraf).
  - **ContentContext**: `articles: Artikel[]` dihapus dari `SiteContent`; `SECTION_META` entri "articles" dihapus — artikel sepenuhnya pindah ke DB.
  - **Backup terjadwal** (`.github/workflows/db-backup.yml`): cron 02:00 WIB + `workflow_dispatch`, `mysqldump --single-transaction --routines --triggers | gzip`, upload artifact 30 hari, slot B2/S3 siap uncomment. `npm run db:backup` untuk backup lokal via XAMPP.
  - **Multi-cabang MVP**: tabel `branches` + default row `('main', 'Toko Utama')`. Kolom `branch_id VARCHAR(36) DEFAULT 'main' NOT NULL` ditambah ke `outbound_transactions`, `orders`, `ledger_entries`, dan `stock_opname_sessions`. Semua transaksi eksisting otomatis masuk cabang 'main'.
  - **Migration**: semua tabel baru + kolom baru via direct SQL XAMPP mysql client (MariaDB 10.4 kompatibel).
- [ ] Inbound + stock opname atomik (sudah ada sesi opname; inbound tetap manual via existing page)
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
- [ ] Pembayaran Midtrans (verifikasi callback signature!) · Ongkir RajaOngkir/Komerce + cache Redis 24 jam + fallback tabel ongkir cadangan
- [x] **Hardening (paralel)** — selesai 2026-06-22:
  - **Audit Log**: tabel `audit_logs` (userId, action, entityType, entityId, detail, createdAt) + `src/lib/audit.ts` helper. Log dipasang di: ubah status pesanan admin (`ORDER_STATUS_CHANGED`), validasi settlement marketplace (`SETTLEMENT_VALIDATED`), tutup sesi stock opname (`STOCK_OPNAME_CLOSED`), jual di bawah HPP (`PRICE_BELOW_HPP`).
  - **Anti-rugi**: `savePosTransaction` dan `createOrder` — cek `unitPrice < avgHpp` setelah alokasi batch; tolak dengan error + log audit `PRICE_BELOW_HPP`.
  - **AuthZ / anti-IDOR**: `marketplace-settlement.ts` ditambah `requireAdmin()` (sebelumnya tidak ada auth sama sekali). `vouchers.ts`: `requireAdmin()` di `getVouchers`, `upsertVoucher`, `deleteVoucher`, `toggleVoucher`. `returns.ts`: `requireAdmin()` di `getAdminReturns` dan `updateReturnStatus` (sebelumnya cuma cek session, bukan role). `articles.ts`: `requireAdmin()` di `upsertArticle` dan `deleteArticle`. `orders.ts`: `adminUpdateOrderStatus()` server action baru (dengan admin check + audit log) menggantikan state-only prototype.
  - **Validasi Zod**: `submitReturn` (orderId, reason enum, detail min 5 char). `upsertArticle` (title, category, body, status, coverImage URL). `validateSettlement` (txId, settledAmount ≥0, newUiStatus enum). `submitReturn` juga memvalidasi IDOR (orderId harus milik user yang login, status `delivered`).
  - **Shared helpers**: `src/lib/server-auth.ts` — `requireSession()` + `requireAdmin()` reusable. `src/lib/audit.ts` — `logAudit()` never throws (audit failure tidak boleh block transaksi).
  - **QRIS compliance**: Dropdown POS tidak lagi tampilkan "0.7% MDR" di nama metode (tidak boleh menyiratkan surcharge ke pelanggan). MDR row di summary berubah jadi "MDR X% (ditanggung toko)". Note di QR dialog: "Pelanggan bayar {total} · MDR 0.7% ditanggung toko". `SERVICE_FEE` di orders.ts sudah flat Rp4.500 untuk semua metode (tidak berubah).
  - **Migration**: `CREATE TABLE audit_logs` via XAMPP mysql (MariaDB 10.4).
- [ ] Security pass lanjutan: output escaping, CSRF token, security headers/CSP (helmet/middleware), akun DB non-root least-privilege
- [x] **Test: unit untuk logika harga/diskon/stok, e2e alur checkout & POS** — selesai 2026-06-24:
  - Vitest v2 (`npm test`): 51 unit tests, 3 file, semua hijau.
    - `src/lib/utils/__tests__/stockAllocation.test.ts` — 13 test: FIFO order, FEFO order, expired skip, shortfall, COGS calc, tie-breaker.
    - `src/lib/__tests__/pos-calc.test.ts` — 26 test: `calcLineDiscount` (pct/rp/cap), `calcCartTotals` (disc item+cart, PPN 12%, MDR semua metode, margin), `calcMarketplaceNet` (komisi, ongkir, custom fees ±, isMinus/isTipis).
    - `src/lib/utils/__tests__/discount.test.ts` — 12 test: fixed (capped), percent (rounded, maxDiscount, edge 0%).
  - Playwright (`npm run test:e2e`): 3 spec file, browser Chromium+mobile.
    - `tests/e2e/checkout.spec.ts` — produk dari DB, tambah ke keranjang, guest redirect login, form checkout, voucher SEHAT10.
    - `tests/e2e/pos.spec.ts` — auth guard, katalog, klik → keranjang, scan barcode, tab marketplace.
    - `tests/e2e/returns.spec.ts` — riwayat pesanan, form retur customer, admin orders+returns.
  - **Prasyarat e2e**: `npm run dev` + XAMPP MySQL jalan. Akun yang dipakai (sudah ada di DB):
    - Customer: `testing@gmail.com` / `testing123`
    - Admin: `admin@si4care.com` / `Admin1234!`
    - Super Admin: `superadmin@si4care.com` / `SuperAdmin1234!`
- [ ] Foto produk: ganti ilustrasi SVG → `next/image` + storage (saat ini 0 pemakaian next/image — wajar karena belum ada foto asli)
- [ ] Deploy hemat memori: `output: "standalone"` di next.config, VPS ≥1GB + swap, atau Vercel; cetak struk thermal ESC/POS + label barcode 33×15mm

---

## 8. Aturan Untuk AI yang Melanjutkan

1. Baca `AGENTS.md` (aturan agent), `prd.md` (requirement), lalu file ini (status + riwayat di Log Sesi).
2. Next.js versi ini ≠ training data — baca `node_modules/next/dist/docs/` sebelum menulis kode Next.
3. Jangan tambah dependensi tanpa alasan kuat; proyek ini sengaja ramping.
4. Ikuti token desain & komponen yang ada. Jangan ubah palet/font/radius.
5. Halaman admin besar (pos 763 baris, reports 673, products 553) — bila menyentuhnya, pecah jadi sub-komponen di folder `_components/` halaman tsb; jangan biarkan tumbuh.
6. Setiap selesai sesi: jalankan `npx tsc --noEmit` + `npm run lint`, centang item di sini, tambah 1 entri di Log Sesi.

## Log Sesi

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
