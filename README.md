# si4care

Platform toko alat kesehatan: e-commerce pelanggan (katalog, keranjang, checkout, akun) + back-office admin (dashboard, POS, pesanan, marketplace, inventori, stock opname, retur, diskon, CMS konten, laporan).

> **Status: backend aktif.** Data tersimpan di PostgreSQL (Supabase), autentikasi lewat Better Auth,
> pembayaran lewat Midtrans (mode Sandbox atau Production ditentukan `MIDTRANS_IS_PRODUCTION`). Posisi pekerjaan terakhir,
> daftar tugas go-live, dan backlog: lihat [checklist.md](checklist.md). Cara deploy: [docs/deploy-vercel.md](docs/deploy-vercel.md).

## Stack

**Frontend** — Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui (base-ui) · framer-motion · recharts · lucide-react

**Backend** — PostgreSQL (Supabase) · Drizzle ORM · Better Auth · Upstash Redis · Midtrans · RajaOngkir/Komerce

## Menjalankan

### 1. Install

```bash
npm install
```

### 2. Siapkan `.env.local`

Salin `.env.example` ke `.env.local` lalu isi nilainya (file itu mendokumentasikan tiap variabel; jangan pernah
meng-commit `.env.local`).

```bash
cp .env.example .env.local
```

Yang **wajib** agar aplikasi berjalan penuh: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY`, dan `SEED_ADMIN_PASSWORD` / `SEED_SUPERADMIN_PASSWORD` /
`SEED_CUSTOMER_PASSWORD` (password akun seed — seeder dan test E2E berhenti dengan pesan jelas bila kosong).
Sisanya (Redis, Komerce, R2, Google) opsional: aplikasi tetap jalan dengan fitur terkait turun kualitas.

Konfigurasi dicek saat server start (`src/lib/env.ts`): di **production** server menolak melayani request bila ada
yang tidak valid; di development hanya mencetak peringatan.

> **Dua jenis connection string Supabase.** Lokal/seed/migrasi: *session pooler* (port **5432**). Production di
> Vercel: *transaction pooler* (port **6543**) — wajib, karena mode session hanya mengizinkan 15 klien untuk seluruh
> proyek. Lihat [docs/deploy-vercel.md](docs/deploy-vercel.md).

### 3. Siapkan database

Untuk database kosong, jalankan isi `drizzle/0000_late_natasha_romanoff.sql` di Supabase SQL Editor
(26 tabel + 11 enum). Lalu isi data awal dan data uji (untuk lingkungan non-produksi):

```bash
npm run db:seed        # akun admin, 4 kategori, 8 produk, 9 varian+batch, 3 voucher, konten landing
npm run db:seed:demo   # 3 customer + alamat, 6 web order (semua status), 5 POS, 3 marketplace
```

Keduanya idempoten — aman dijalankan ulang. **`db:seed:demo` wajib** kalau mau menjalankan E2E (hanya di lingkungan non-produksi)
(spec checkout & retur memakai akun customer beserta alamat dan riwayat pesanan dari seeder ini).

### 4. Jalankan

```bash
npm run dev        # http://localhost:3000
```

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check — **wajib bersih sebelum selesai sesi** |
| `npm test` | Unit test (Vitest) — 115 test |
| `npm run test:e2e` | E2E (Playwright) — 76 test; butuh dev server jalan + kedua seeder |
| `npm run test:reports` | Buat 3 transaksi POS nyata lalu verifikasi angka `/admin/reports` |
| `npm run test:webhook` | Webhook Midtrans end-to-end: stok terpotong sekali, ledger terbentuk, kiriman ganda/bersamaan aman (butuh server berjalan) |
| `npm run test:settlement` | Ledger saat settlement marketplace selesai / dibatalkan |
| `npm run test:dashboard` | Angka dashboard `/admin` vs SQL independen |
| `npm run test:security` | Serangan ke server action di build production (lihat header skripnya) |
| `npm run test:reports:clean` | Hapus transaksi uji — **jalankan sebelum membuka laporan ke pihak lain** |
| `npm run db:generate` | Generate file migration dari `schema.ts` |
| `npm run db:migrate` | Terapkan migration ke database |
| `npm run db:seed` | Isi data dasar (akun admin, katalog, voucher, 3 artikel contoh) |
| `npm run db:seed:demo` | Isi data uji: akun customer, alamat, transaksi historis (**jangan di produksi**) |
| `NEW_PASSWORD='…' npm run db:set-password -- <email>` | Ganti password akun yang sudah ada + cabut sesinya |
| `npm run db:studio` | Drizzle Studio (GUI database) |
| `npm run db:backup` | Backup ke `.sql.gz` lewat `pg_dump` |

> `npm run db:push` bersifat interaktif dan bisa menggantung di terminal non-interaktif.
> Untuk perubahan schema, pakai `db:generate` lalu `db:migrate`.

## Struktur

```
src/
├─ app/
│  ├─ (landing)/      # landing + halaman publik (about, faq, blog, dst)
│  ├─ shop/ cart/ checkout/ account/   # alur belanja pelanggan
│  ├─ login/ register/ forgot-password/
│  ├─ admin/          # back-office (15 menu)
│  └─ api/            # upload, webhook pembayaran, ongkir
├─ actions/           # server actions per domain (orders, pos, vouchers, …)
├─ components/        # ui/ (shadcn) · layout/ · shop/ · admin/
├─ context/           # Cart, Content (CMS), Category
└─ lib/
   ├─ db/             # schema.ts, auth-schema.ts, index.ts (koneksi), seed.ts
   ├─ auth/           # konfigurasi Better Auth
   ├─ utils/          # stockAllocation (FIFO/FEFO), discount
   └─ validations/    # skema Zod
drizzle/              # file migration SQL
scripts/              # db-backup.sh
```

## Akun seed (non-produksi)

Dari `npm run db:seed`:

| Email | Password | Role |
|---|---|---|
| `admin@si4care.com` | *(dari `SEED_ADMIN_PASSWORD`)* | admin |
| `superadmin@si4care.com` | *(dari `SEED_SUPERADMIN_PASSWORD`)* | super_admin |

Dari `npm run db:seed:demo` — punya alamat kirim & riwayat pesanan, dipakai juga oleh E2E:

| Email | Password | Role |
|---|---|---|
| `budi@example.com` | *(dari `SEED_CUSTOMER_PASSWORD`)* | customer |
| `siti@example.com` | *(dari `SEED_CUSTOMER_PASSWORD`)* | customer |
| `hendra@example.com` | *(dari `SEED_CUSTOMER_PASSWORD`)* | customer |

Pelanggan juga bisa daftar sendiri lewat `/register` (role default `customer`).

Voucher awal (dari `db:seed`):

| Kode | Potongan | Minimum belanja | Maks. diskon |
|---|---|---|---|
| `SEHAT10` | 10% | Rp 100.000 | Rp 50.000 |
| `ALKES5` | 5% | Rp 50.000 | — |
| `DISKON20RB` | Rp 20.000 | Rp 200.000 | — |

> ⚠️ Password akun-akun ini **tidak disimpan di repo** — isinya diambil dari `SEED_*` di
> `.env.local` (lihat `.env.example`). Seeder berhenti dengan pesan jelas kalau belum diisi.
>
> Catatan penting: password lama **sudah terlanjur masuk riwayat git yang
> ter-push**, jadi masih bisa ditemukan lewat `git log -p`. Membersihkan file saja tidak cukup —
> **rotasi passwordnya** sebelum dipakai di lingkungan yang bisa diakses publik.

## Troubleshooting

**Koneksi database gagal dengan `ECONNRESET` atau `server closed the connection unexpectedly`**

Sebagian ISP di Indonesia memblokir port database (5432/6543). Gejalanya menipu — TCP handshake
berhasil, lalu koneksi diputus tanpa pesan error, sehingga mirip password salah.

Cara memastikan:

```bash
# 1. Cek apakah port terbuka (biasanya berhasil walau ISP memblokir)
nc -z -v aws-0-<region>.pooler.supabase.com 5432

# 2. Tes koneksi sungguhan
psql "$DATABASE_URL" -c "select 1;"
```

Kalau langkah 1 berhasil tapi langkah 2 gagal, coba dari jaringan lain (tethering seluler).
Kalau di sana berhasil, masalahnya ISP — bukan kredensial dan bukan Supabase. Solusinya: ganti
jaringan atau pakai VPN.

**Catatan Supabase free tier:** direct connection (`db.<ref>.supabase.co`) hanya tersedia lewat
IPv6. Jaringan tanpa IPv6 wajib lewat session pooler.

## Dokumen

- [prd.md](prd.md) — product requirements
- [checklist.md](checklist.md) — status pengerjaan, log sesi, & handoff antar sesi/AI
- [docs/deploy-vercel.md](docs/deploy-vercel.md) — langkah deploy ke Vercel: env var, webhook Midtrans, pemeriksaan pasca-deploy
- [docs/uji-alur-utama.md](docs/uji-alur-utama.md) — daftar periksa alur utama setelah deploy / sebelum go-live
- [AGENTS.md](AGENTS.md) — aturan untuk AI coding agent
- [docs/adr/](docs/adr/) — architecture decision records
