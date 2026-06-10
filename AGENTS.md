<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# si4care — aturan proyek

## Status
Prototipe **frontend-only** untuk presentasi klien. Data = mock/localStorage.
Backend/DB/auth/pembayaran DITUNDA. Lihat `checklist.md` untuk posisi pekerjaan terakhir — **selalu baca & update file itu tiap sesi**.

## Stack
Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind v4 (CSS-first, token di `src/app/globals.css`) · shadcn/ui (base-ui) · framer-motion · recharts · lucide-react.

## Commands (selalu pakai ini)
- dev: `npm run dev`
- typecheck: `npx tsc --noEmit`  ← wajib hijau sebelum selesai sesi
- lint: `npm run lint`
- build: `npm run build` (di sandbox bisa gagal hanya karena download Google Fonts — bukan error kode)

## Konvensi
- Bahasa kode & identifier: English. Teks UI: Indonesia.
- Komponen shadcn di `src/components/ui/` — pakai, jangan tulis ulang.
- Komponen khusus satu halaman → folder `_components/` di route tsb; lintas halaman → `src/components/<domain>/`.
- Animasi pakai varian dari `src/lib/animationVariants.ts`, jangan inline object baru.
- Data mock: satu sumber (sedang dipusatkan ke `src/lib/mock-data.ts` — lihat checklist §4). Jangan hardcode data produk baru di dalam page.
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
1. `npx tsc --noEmit` & `npm run lint` bersih.
2. Cek tampilan di viewport mobile (≈390px) dan desktop.
3. `checklist.md`: centang item selesai + 1 baris di Log Sesi.
