# si4care

Platform toko alat kesehatan: e-commerce pelanggan (katalog, keranjang, checkout, akun) + back-office admin (dashboard, POS, pesanan, marketplace, inventori, stock opname, diskon, CMS konten, laporan).

> **Status: prototipe frontend-only untuk presentasi klien.**
> Semua data mock/localStorage — belum ada backend, database, auth, maupun pembayaran sungguhan.
> Posisi pekerjaan terakhir & backlog: lihat [checklist.md](checklist.md).

## Stack

Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui (base-ui) · framer-motion · recharts · lucide-react

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Perintah lain: `npm run build` · `npm run lint` · `npx tsc --noEmit`

## Struktur

```
src/
├─ app/
│  ├─ (landing)/      # landing + halaman publik (about, faq, blog, dst)
│  ├─ shop/ cart/ checkout/ account/   # alur belanja pelanggan
│  ├─ login/ register/ forgot-password/
│  └─ admin/          # back-office (14 menu)
├─ components/        # ui/ (shadcn) · layout/ · shop/ · admin/
├─ context/           # Cart, Content (CMS), Category — state prototipe
└─ lib/               # utils, animationVariants, mock-data
```

## Catatan demo

- Voucher checkout demo: `SEHAT10`, `ALKES5`
- Konten CMS & foto kategori tersimpan di localStorage (`si4care_content_v1`, `si4care_categories`) — reset dengan hapus site data browser
- Halaman admin: `/admin`

## Dokumen

- [prd.md](prd.md) — product requirements
- [checklist.md](checklist.md) — status pengerjaan, log sesi, & handoff antar sesi/AI
- [AGENTS.md](AGENTS.md) — aturan untuk AI coding agent
