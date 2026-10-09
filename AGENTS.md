<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# si4care — aturan proyek

## Status
**Backend aktif.** Data tersimpan di PostgreSQL (Supabase), auth lewat Better Auth, pembayaran lewat Midtrans Sandbox.
Lihat `checklist.md` untuk posisi pekerjaan terakhir — **selalu baca & update file itu tiap sesi**.

## Stack
**Frontend:** Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind v4 (CSS-first, token di `src/app/globals.css`) · shadcn/ui (base-ui) · framer-motion · recharts · lucide-react.

**Backend:** PostgreSQL (Supabase) · Drizzle ORM (`pg-core`) · Better Auth · Upstash Redis · Midtrans · RajaOngkir/Komerce.

## Commands (selalu pakai ini)
- dev: `npm run dev`
- typecheck: `npx tsc --noEmit`  ← wajib hijau sebelum selesai sesi
- lint: `npm run lint`
- test: `npm test` (Vitest, 51 unit test)
- e2e: `npm run test:e2e` (Playwright, 52 test chromium+mobile) — **butuh `npm run dev` jalan** + `db:seed` **dan** `db:seed:demo`
- uji laporan: `npm run test:reports` (bikin 3 transaksi POS nyata lalu verifikasi angka) · `npm run test:reports:clean` (hapus transaksi uji — jalankan sebelum demo)
- build: `npm run build` (di sandbox bisa gagal hanya karena download Google Fonts — bukan error kode)
- database: `npm run db:generate` → `npm run db:migrate` · `npm run db:seed` · `npm run db:seed:demo` · `npm run db:studio` · `npm run db:backup`

## Database
- Dialect **PostgreSQL** — `pgTable`/`pgEnum` dari `drizzle-orm/pg-core`. Enum adalah tipe terpisah: deklarasikan di atas `schema.ts`, lalu referensikan. **Beri nama kolom eksplisit** (`stockModeEnum("stock_mode")`), kalau tidak Drizzle memakai nama property yang camelCase.
- **`tsc` tidak memeriksa isi template `sql\`...\``.** Setiap kali menyentuh raw SQL, jalankan query-nya langsung ke database. Sintaks MySQL seperti `DATE_FORMAT`, `CAST(... AS CHAR)`, `onDuplicateKeyUpdate` lolos type check tapi gagal saat runtime.
- **Agregat SQL mengembalikan string, bukan number.** `COUNT(*)` dan `SUM(kolom_integer)` bertipe `bigint` di PostgreSQL, dan driver `postgres-js` menyerahkan `bigint`/`numeric` sebagai **string**; `SUM(kolom_decimal)` juga string. Anotasi `sql<number>` hanya klaim tipe — Drizzle tidak mengonversi apa pun. Akibatnya `0 + count` jadi `"03"` dan `stock === 0` jadi `false`. Bungkus dengan `CAST(... AS INTEGER)` di SQL, atau `Number()`/`parseFloat()` di JS. Riwayat & grep pemeriksa ada di `checklist.md` §7e.
- Hindari `npm run db:push` — interaktif, bisa menggantung. Pakai `db:generate` + `db:migrate`.
- Versi `drizzle-orm` & `drizzle-kit` terikat peer dependency `better-auth`. Jangan turunkan versinya.
- Kalau koneksi gagal `ECONNRESET` / "server closed the connection unexpectedly" padahal kredensial benar: sebagian ISP Indonesia memblokir port 5432/6543. Lihat README bagian Troubleshooting.

## Konvensi
- Bahasa kode & identifier: English. Teks UI: Indonesia.
- Komponen shadcn di `src/components/ui/` — pakai, jangan tulis ulang.
- Komponen khusus satu halaman → folder `_components/` di route tsb; lintas halaman → `src/components/<domain>/`.
- Animasi pakai varian dari `src/lib/animationVariants.ts`, jangan inline object baru.
- Data dari database lewat **server action** di `src/actions/<domain>.ts` — jangan query langsung dari komponen. Tiap mutasi wajib cek auth (`requireSession`/`requireAdmin` di `src/lib/server-auth.ts`) dan kepemilikan (anti-IDOR).
- **Guard harus ada DI DALAM server action-nya, bukan cuma di layout.** Fungsi di file `"use server"` adalah endpoint POST; begitu direferensikan dari client component, ID action-nya masuk bundle browser dan bisa dipanggil anonim. `admin/layout.tsx` hanya menjaga render halaman, **tidak** menjaga pemanggilan action. Juga berlaku untuk action yang hanya membaca kalau datanya back-office (laporan, alarm, stok). Riwayat 4 lubang yang pernah lolos + cara auditnya ada di `checklist.md` §7f.
- Butuh logika yang bisa dipanggil **di luar** request context (script/test)? Taruh di `src/lib/<nama>-query.ts` biasa, lalu buat server action tipis ber-guard yang memanggilnya — `requireAdmin()` memakai `headers()` dan akan melempar error di luar request. Contoh: `src/lib/reports-query.ts` ↔ `src/actions/reports.ts`.
- `src/lib/mock-data.ts` tinggal sisa untuk bagian yang belum dimigrasikan — jangan tambah data baru ke sana.
- File halaman maksimal ±400 baris; lebih dari itu pecah ke `_components/`.

## Aturan keras
- JANGAN ubah design token (palet oklch Medical Blue/Teal/Navy, font Inter + Plus Jakarta Sans, skala radius) tanpa persetujuan owner.
- JANGAN tambah warna di luar token; JANGAN pakai gradient ungu-biru generik.
- JANGAN tambah dependensi tanpa alasan kuat tertulis di checklist.
- JANGAN edit file di `node_modules/`, `.next/`.
- JANGAN commit artefak build, `.docx` baru, atau `.DS_Store`.
- Mobile-first: tiap tabel admin baru wajib punya card-view mobile atau scroll horizontal; tiap dialog wajib `max-h` + `overflow-y-auto`.
- State lengkap untuk tiap komponen baru: hover, focus-visible, empty, loading, error.

## Definition of Done (per sesi)
1. `npx tsc --noEmit` & `npm run lint` bersih (lint: tidak menambah error baru dari file yang disentuh).
2. `npm test` hijau kalau menyentuh logika harga/diskon/stok.
3. Kalau menyentuh raw SQL: query diuji langsung ke database, bukan hanya type check.
4. Cek tampilan di viewport mobile (≈390px) dan desktop.
5. `checklist.md`: centang item selesai + 1 baris di Log Sesi.
