# si4care

Platform toko alat kesehatan: e-commerce pelanggan (katalog, keranjang, checkout, akun) + back-office admin (dashboard, POS, pesanan, marketplace, inventori, stock opname, retur, diskon, CMS konten, laporan).

> **Status: backend aktif.** Data tersimpan di PostgreSQL (Supabase), autentikasi lewat Better Auth,
> pembayaran lewat Midtrans Sandbox. Posisi pekerjaan terakhir & backlog: lihat [checklist.md](checklist.md).

## Stack

**Frontend** — Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui (base-ui) · framer-motion · recharts · lucide-react

**Backend** — PostgreSQL (Supabase) · Drizzle ORM · Better Auth · Upstash Redis · Midtrans · RajaOngkir/Komerce

## Menjalankan

### 1. Install

```bash
npm install
```

### 2. Siapkan `.env.local`

```bash
# Database — connection string session pooler dari Supabase
# Settings > Database > Connection string > Session pooler
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require

# Auth — generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET=<random-hex-32-byte>
BETTER_AUTH_URL=http://localhost:3000

# Sisanya opsional sampai fitur terkait dipakai
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
KOMERCE_API_KEY=
```

### 3. Siapkan database

Untuk database kosong, jalankan isi `drizzle/0000_late_natasha_romanoff.sql` di Supabase SQL Editor
(26 tabel + 11 enum). Lalu isi data demo:

```bash
npm run db:seed        # akun admin, 4 kategori, 8 produk, 9 varian+batch, 3 voucher, konten landing
npm run db:seed:demo   # 3 customer + alamat, 6 web order (semua status), 5 POS, 3 marketplace
```

Keduanya idempoten — aman dijalankan ulang. **`db:seed:demo` wajib** kalau mau menjalankan E2E
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
| `npm test` | Unit test (Vitest) — 51 test |
| `npm run test:e2e` | E2E test (Playwright) — 52 test; butuh dev server jalan + kedua seeder |
| `npm run test:reports` | Buat 3 transaksi POS nyata lalu verifikasi angka `/admin/reports` |
| `npm run test:reports:clean` | Hapus transaksi uji — **jalankan sebelum demo/presentasi** |
| `npm run db:generate` | Generate file migration dari `schema.ts` |
| `npm run db:migrate` | Terapkan migration ke database |
| `npm run db:seed` | Isi data dasar (akun admin, katalog, voucher) |
| `npm run db:seed:demo` | Isi data transaksi historis + akun customer |
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

## Akun demo

Dari `npm run db:seed`:

| Email | Password | Role |
|---|---|---|
| `admin@si4care.com` | `Admin1234!` | admin |
| `superadmin@si4care.com` | `SuperAdmin1234!` | super_admin |

Dari `npm run db:seed:demo` — punya alamat kirim & riwayat pesanan, dipakai juga oleh E2E:

| Email | Password | Role |
|---|---|---|
| `budi@example.com` | `Customer1234!` | customer |
| `siti@example.com` | `Customer1234!` | customer |
| `hendra@example.com` | `Customer1234!` | customer |

Pelanggan juga bisa daftar sendiri lewat `/register` (role default `customer`).

Voucher demo:

| Kode | Potongan | Minimum belanja | Maks. diskon |
|---|---|---|---|
| `SEHAT10` | 10% | Rp 100.000 | Rp 50.000 |
| `ALKES5` | 5% | Rp 50.000 | — |
| `DISKON20RB` | Rp 20.000 | Rp 200.000 | — |

> ⚠️ Akun-akun di atas adalah **akun demo dengan password yang diketahui publik lewat repo ini**.
> Hapus atau ganti passwordnya sebelum dipakai di lingkungan produksi yang sesungguhnya.

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
- [docs/skenario-demo.md](docs/skenario-demo.md) — panduan presentasi ke klien (persiapan, urutan babak, yang jangan didemokan)
- [AGENTS.md](AGENTS.md) — aturan untuk AI coding agent
- [docs/adr/](docs/adr/) — architecture decision records
