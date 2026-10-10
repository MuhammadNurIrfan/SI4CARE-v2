# ADR-0002 — Pindah dari MySQL ke PostgreSQL (Supabase)

**Status:** Diterima — 2026-10-08
**Menggantikan:** baris "Database" dan "ORM driver" pada [ADR-0001](0001-backend-stack.md). Keputusan lain di ADR-0001 tetap berlaku.

## Konteks

ADR-0001 memilih MySQL dengan alasan familiaritas tim, dan untuk dev dipakai MariaDB 10.4.28 lewat XAMPP di mesin lokal. Menjelang deployment muncul dua kebutuhan baru:

1. **Database harus bisa diakses dari luar mesin dev.** XAMPP lokal tidak bisa dipakai untuk pengujian bersama maupun untuk build di CI.
2. **Biaya hosting harus serendah mungkin** — proyek ini belum menghasilkan, owner meminta opsi gratis.

Kandidat yang ditimbang: PlanetScale (MySQL, tidak ada lagi free tier memadai), Railway (MySQL, free credit terbatas), Firebase Firestore (gratis tapi NoSQL), dan Supabase (PostgreSQL, free tier 500MB).

## Keputusan

Pindah ke **PostgreSQL di Supabase** (free tier, region `ap-southeast-1`).

| Lapisan | Sebelum (ADR-0001) | Sekarang |
|---|---|---|
| Database | MySQL/MariaDB 10.4.28 (XAMPP lokal, port 3307) | PostgreSQL 17 (Supabase, terkelola) |
| Driver | `mysql2` | `postgres-js` |
| Dialect Drizzle | `mysql` / `mysqlTable` | `postgresql` / `pgTable` |
| Adapter Better Auth | `provider: "mysql"` | `provider: "pg"` |
| Backup | `mysqldump` (XAMPP) | `pg_dump` (`scripts/db-backup.sh`) |

## Alasan

1. **Gratis tanpa batas waktu** — 500MB cukup untuk katalog + transaksi dalam skala yang direncanakan, dan tidak ada trial yang habis seperti PlanetScale/Railway.
2. **Drizzle mendukung PostgreSQL penuh** — schema, server actions, dan logika FIFO/FEFO tidak perlu ditulis ulang. Perpindahan selesai dalam satu sesi.
3. **Terkelola** — backup harian, tidak perlu mengurus XAMPP di mesin dev, dan bisa diakses dari mana saja.
4. **Firestore ditolak** meski free tier-nya paling murah hati, karena:
   - Tanpa JOIN — laporan agregat (`admin/reports`) harus mengambil seluruh koleksi lalu diproses di klien.
   - Denormalisasi wajib — harga produk tersalin ke `cart_items` dan `order_items`, sehingga satu perubahan harga harus disinkronkan ke banyak tempat.
   - Batas 25 write per transaksi — transaksi POS dengan banyak baris item bisa ditolak.
   - Biaya per-operasi — beberapa mesin POS yang menyegarkan stok akan melampaui kuota gratis dan berubah jadi tagihan yang tidak terduga.

## Konsekuensi

**Positif**

- Tidak ada lagi ketergantungan XAMPP; kontributor baru cukup mengisi `DATABASE_URL`.
- Batasan MariaDB 10.4 yang sebelumnya menghambat hilang — khususnya larangan memakai Drizzle relational API (`db.query.X.findMany({ with })`) karena menghasilkan LATERAL JOIN. Di PostgreSQL ini aman dipakai, walau kode yang sudah terlanjur memakai query manual tidak perlu diubah.

**Negatif / risiko**

- **Sebagian ISP Indonesia memblokir port 5432/6543.** Gejalanya menipu: TCP handshake berhasil, lalu koneksi diputus ~1 RTT kemudian tanpa pesan error — mirip sekali dengan password salah. Terkonfirmasi saat migrasi: koneksi gagal konsisten dari satu jaringan dan langsung berhasil dari jaringan lain. Cara memastikan ada di README bagian Troubleshooting.
- **Direct connection Supabase free tier hanya IPv6.** Jaringan tanpa IPv6 wajib lewat session pooler.
- **Raw SQL perlu ditinjau manual.** `tsc` tidak memeriksa isi template `sql\`...\``. Saat migrasi ditemukan `DATE_FORMAT` dan `CAST(... AS CHAR)` di `src/actions/reports.ts` yang lolos type check tapi akan gagal saat halaman laporan dibuka. Setiap kali menyentuh raw SQL, uji query-nya langsung ke database.
- **Versi `drizzle-orm` dan `drizzle-kit` terikat peer dependency `better-auth`.** Menurunkan salah satunya memicu `ERESOLVE` saat install dan `ERR_PACKAGE_PATH_NOT_EXPORTED` saat runtime.
- 500MB adalah batas keras. Saat mendekati, pilihannya naik ke paket berbayar Supabase atau pindah provider.

## Catatan migrasi

Detail teknis lengkap — daftar file yang berubah, sintaks MySQL yang perlu diganti, dan utang yang
sengaja ditinggalkan — ada di `checklist.md` §7d.

Migration MySQL lama (`drizzle/0000`–`0004` + `drizzle/meta/`) dihapus karena snapshot Drizzle tidak
kompatibel lintas dialect. Riwayatnya masih ada di git sampai commit `4493c93`.
