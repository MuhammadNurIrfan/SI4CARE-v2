# ADR-0001 — Stack Backend

**Status:** Diterima — 2026-06-17
**Konteks:** si4care dimulai sebagai prototipe frontend-only (lihat `checklist.md`). `prd.md` §5 sudah menetapkan arsitektur target sejak awal proyek. ADR ini mengonfirmasi keputusan tersebut secara resmi untuk konteks tim aktual, sebelum implementasi backend (Fase 0) dimulai.

## Keputusan

Satu stack di dalam satu aplikasi Next.js — tidak ada API server terpisah (bukan Laravel/Node terpisah):

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js (App Router) — lanjutan dari prototipe, Server Actions + Route Handlers |
| Database | **MySQL-compatible** — lokal dev pakai MariaDB 10.4.28 via XAMPP (port 3307), production bisa MySQL 8 asli |
| ORM | **Drizzle ORM** (`drizzle-orm` + `mysql2` driver) |
| Auth | **Better Auth** — email/password + Google OAuth, session di database |
| Cache/Queue | Upstash Redis (cache ongkir 24 jam, antrean webhook/email) |
| Pembayaran | Midtrans (Snap + Core API + webhook) |
| Ongkir | RajaOngkir/Komerce + fallback tabel ongkir cadangan |
| Deployment | Vercel atau VPS (Docker + PM2) + SSL |

## Alasan

1. **Tim kecil (2 orang)** — satu stack/bahasa mengurangi context-switching dan beban operasional dibanding split frontend/backend ke repo & bahasa berbeda.
2. **Familiaritas MySQL** — salah satu anggota tim sudah biasa dengan MySQL/SQL; tidak ada kebutuhan fitur di proyek ini yang mengharuskan PostgreSQL.
3. **Konsisten dengan `prd.md`** — dokumen requirement yang sudah ada sejak awal proyek ini sudah menetapkan MySQL + Drizzle + Better Auth (lihat `prd.md` §5.1 & §6). ADR ini bukan keputusan baru, melainkan konfirmasi resmi supaya tidak dipertanyakan ulang di sesi mendatang.

## Catatan implementasi lokal

- Engine database lokal yang dipakai tim adalah **MariaDB 10.4.28** (dibundel XAMPP, bukan MySQL murni) — wire-compatible dengan driver `mysql2`, tidak ada penyesuaian skema yang diperlukan untuk kebutuhan proyek ini (DECIMAL, ENUM, JSON, FULLTEXT, transaction semuanya didukung).
- Database lokal `db_toko_si4care` berjalan di **port 3307**, bukan default 3306, karena ada service MySQL Homebrew lain yang sudah menempati port itu di mesin development. Lihat `.env.local` (`DATABASE_URL`).

## Konsekuensi

- Skema, alur webhook Midtrans, dan algoritma alokasi stok FIFO/FEFO di `prd.md` §6/§8 dipakai langsung sebagai acuan implementasi, bukan didesain ulang dari nol.
- Rencana eksekusi lengkap (pemetaan dari kode prototipe yang ada ke skema target, per fase) ada di [`docs/migration-plan-backend.pdf`](../migration-plan-backend.pdf).
- Kalau ke depan kebutuhan berubah (mis. tim bertambah dengan spesialisasi backend berbeda, atau pindah ke PostgreSQL untuk kebutuhan tertentu), buat ADR baru — jangan ubah keputusan ini secara diam-diam.
