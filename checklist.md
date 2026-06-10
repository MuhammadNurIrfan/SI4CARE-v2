# CHECKLIST — SI4CARE-ag1

> Dokumen handoff. Dibaca AI/developer mana pun yang melanjutkan proyek ini.
> Update file ini setiap sesi: centang yang selesai, tambah catatan di bagian "Log Sesi".
> Terakhir diperbarui: 2026-06-11.

---

## 1. Snapshot Proyek

| Hal | Nilai |
|---|---|
| Produk | si4care — platform toko alat kesehatan (e-commerce + back-office/POS) |
| Stack aktual | **Next.js 16 (App Router, src/) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui (base-ui) + framer-motion + recharts** |
| Status | **Prototipe FRONTEND ONLY untuk presentasi klien.** Semua data mock/hardcode/localStorage. Backend, DB, auth, pembayaran = DITUNDA, belum dikerjakan. |
| Bahasa UI | Indonesia |
| Dokumen sumber | `prd.md` (requirement), `AUDIT-UI.md` (log audit UI per sesi), `SI4CARE-SRS.docx`, `RAB Si4Care v2.docx` |
| Perintah | `npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit` |

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

---

## 3. SELESAI (jangan dikerjakan ulang)

- [x] Seluruh halaman landing, shop, cart, checkout(+success), akun, auth (UI saja)
- [x] Seluruh halaman admin (14 menu) — lihat tabel di `AUDIT-UI.md`
- [x] Sistem barcode: input/scan/generate EAN-13, render Code128 + QR (`uqr`), unduh SVG
- [x] POS mobile (bottom sheet keranjang), stock opname, CMS per-section, foto kategori
- [x] Kolom biaya/potongan custom POS marketplace, floating contact (WA + chat), room chat pelanggan & admin
- [x] Audit responsivitas mobile menyeluruh (tabel→card view, tabs scrollable, dialog scrollable)
- [x] `npx tsc --noEmit` bersih

---

## 4. PEKERJAAN RUMAH — Housekeeping (kerjakan duluan, ±30 menit)

Temuan audit 2026-06-11. Prioritas karena menyangkut disk/memori & kebersihan repo:

- [ ] **Hapus folder `build-verify` s/d `build-verify6` (±780 MB sampah artefak build)** — sudah di-.gitignore tapi masih makan disk: `rm -rf build-verify*`
- [ ] **Hapus `tmp/`** (`si4care-dist`) dan jalankan `rm -rf .next` bila perlu ruang
- [ ] **Bersihkan `tsconfig.json`** — hapus semua entri `build-verify*/types/**` dari `include` (12 baris; memperlambat typecheck & rusak setelah folder dihapus)
- [ ] **Tulis ulang `README.md`** — masih template create-next-app; isi: deskripsi, status prototipe, cara run, struktur, link prd/checklist
- [ ] **Ganti `"name": "si4care_temp"`** di package.json → `si4care`
- [ ] **Pindahkan `*.docx` ke `docs/`** (`SI4CARE-SRS.docx`, `RAB Si4Care v2.docx`) — file biner besar sudah ter-commit; minimal keluarkan dari root. Tambah `*.docx` ke .gitignore bila tidak ingin versinya di git
- [ ] **Tambah `.DS_Store` cleanup**: `find . -name .DS_Store -delete` (sudah di-gitignore, tapi satu ter-commit di `src/components/`? cek `git ls-files | grep DS_Store`)
- [ ] **Sentralisasi data mock** — data produk yang sama (mis. "Omron HEM-7120") di-hardcode terpisah di **9 file** (CartContext, shop, shop/[id], checkout, checkout/success, pos, inbound, orders, featured-products). Buat `src/lib/mock-data.ts` satu sumber, semua file impor dari sana. **Ini prasyarat penting sebelum integrasi backend** — nanti tinggal ganti satu file dengan fetch API.

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

## 7. MENUJU PRODUKSI (DITUNDA — kerjakan hanya jika owner menyatakan lanjut)

Urutan yang disarankan (vertical slice per domain, bukan layer-by-layer):

### 7a. Fondasi
- [ ] ADR-0001: pilih backend (opsi wajar: Next.js Route Handlers + Prisma/Drizzle + PostgreSQL, ATAU Laravel API terpisah — putuskan & catat alasan di `docs/adr/`)
- [ ] Skema DB dari prd.md — snake_case plural, prefix per domain bila perlu (`shop_*`, `pos_*`, `cms_*`); FK eksplisit
- [ ] `.env` + validasi env (mis. zod) — JANGAN hardcode secret
- [ ] Auth + role (Owner / Kasir / Admin Konten — sidebar admin sudah menyiratkan ini); rate-limit login
- [ ] Middleware proteksi `/admin/*` per role

### 7b. Integrasi per domain (tiap baris = 1 slice penuh DB→API→UI→validasi)
- [ ] Produk + kategori + varian (gantikan mock-data.ts)
- [ ] Konten CMS (gantikan localStorage `si4care_content_v1`)
- [ ] Keranjang + checkout + pesanan
- [ ] POS + transaksi marketplace
- [ ] Inbound + stock opname (mutasi stok atomik/transaction)
- [ ] Diskon/voucher (validasi server-side, bukan kode hardcode)
- [ ] Chat pelanggan↔admin (mulai polling sederhana; websocket belakangan)
- [ ] Laporan (query agregat, bukan hitung di client)

### 7c. Eksternal & hardening
- [ ] Pembayaran Midtrans (verifikasi callback signature!) · Ongkir Biteship/RajaOngkir
- [ ] Security pass penuh: validasi server semua input, authZ per resource (anti-IDOR), output escaping, CSRF, security headers/CSP, akun DB non-root least-privilege, audit log aksi sensitif
- [ ] Test: unit untuk logika harga/diskon/stok, e2e alur checkout & POS
- [ ] Foto produk: ganti ilustrasi SVG → `next/image` + storage (saat ini 0 pemakaian next/image — wajar karena belum ada foto asli)
- [ ] Deploy hemat memori: `output: "standalone"` di next.config, VPS ≥1GB + swap, atau Vercel; cetak struk thermal ESC/POS + label barcode 33×15mm

---

## 8. Aturan Untuk AI yang Melanjutkan

1. Baca `AGENTS.md` (aturan agent), `prd.md` (requirement), file ini, lalu `AUDIT-UI.md` (riwayat).
2. Next.js versi ini ≠ training data — baca `node_modules/next/dist/docs/` sebelum menulis kode Next.
3. Jangan tambah dependensi tanpa alasan kuat; proyek ini sengaja ramping.
4. Ikuti token desain & komponen yang ada. Jangan ubah palet/font/radius.
5. Halaman admin besar (pos 763 baris, reports 673, products 553) — bila menyentuhnya, pecah jadi sub-komponen di folder `_components/` halaman tsb; jangan biarkan tumbuh.
6. Setiap selesai sesi: jalankan `npx tsc --noEmit` + `npm run lint`, centang item di sini, tambah 1 entri di Log Sesi.

## Log Sesi

- **2026-06-10** — lihat `AUDIT-UI.md` (fitur POS marketplace custom fee, floating contact, chat, responsivitas mobile).
- **2026-06-11** — Audit struktur & housekeeping (Claude Code): temuan di bagian 4; dibuat `checklist.md`, `AGENTS.md` diisi aturan proyek.
