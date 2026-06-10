# Audit Tampilan SI4CARE — 10 Juni 2026

Prototipe UI untuk presentasi klien (data masih mock, belum ada backend).

## Yang dikerjakan pada sesi ini

1. **Barcode per item** — kolom barcode di Produk & Harga: bisa input/scan barcode yang sudah ada, atau klik *Generate* (format EAN-13). Preview langsung **barcode garis (Code128)** dan **QR code**, bisa diunduh sebagai SVG dari dialog barcode. Pencarian produk & POS juga mendukung barcode.
2. **POS mobile** — keranjang kasir dipindah ke *bottom sheet*: katalog kini memakai layar penuh, item mudah dipilih, ada tombol keranjang melayang berisi jumlah item + total. Tinggi halaman memakai `dvh` agar tidak terpotong di browser mobile.
3. **Audit mobile menyeluruh** — semua dialog kini bisa di-scroll (`max-h` + `overflow-y-auto`), tab Transaksi Marketplace di POS kini bisa di-scroll, ringkasan checkout tidak lagi sticky di mobile, semua tabel admin punya versi kartu mobile atau scroll horizontal.
4. **CMS konten per-section** — Konten & Artikel dirombak: Hero, CTA Penutup, Testimonial, FAQ, dan Visibilitas Section masing-masing punya tombol **Simpan Section Ini** sendiri. Perubahan langsung tampil di website (tersimpan di localStorage untuk prototipe). Artikel ber-status *Terbit* otomatis muncul di halaman /blog dengan filter kategori yang berfungsi.
5. **Foto kategori** — menu baru **Kategori** di admin: unggah foto per kategori; foto otomatis dipakai semua produk sekategori di katalog toko, POS, dan kartu produk (selama produk belum punya foto sendiri).
6. **Stock Opname** — halaman baru: progress hitung, scan barcode (+1 otomatis), stepper stok fisik, tombol "Sesuai Sistem", filter status (Belum/Cocok/Selisih), catatan wajib saat selisih, nilai selisih dalam Rp (HPP), dialog ringkasan penyesuaian + cetak berita acara. Mobile-friendly (kartu + action bar bawah).
7. **Keranjang belanja** — baris item dipadatkan (mobile & desktop): thumbnail kecil, satu baris per item, lebih banyak item termuat. Tulisan "Total Diskon −Rp 0" dihapus, diganti info "masukkan voucher di halaman checkout". Ada bar checkout sticky di mobile.
8. **Voucher checkout** — kode promo demo berfungsi (coba `SEHAT10` / `ALKES5`): diskon hanya tampil saat voucher berhasil diterapkan, PPN dihitung dari nilai setelah diskon.

## Status kelengkapan halaman

| Area | Status |
|---|---|
| Landing (hero, benefit, produk, testimoni, FAQ, CTA, blog) | Lengkap, konten dinamis dari CMS |
| Shop (katalog, filter, detail produk, keranjang, checkout, sukses) | Lengkap |
| Akun (pesanan, alamat, retur) + login/register/lupa password | Lengkap |
| Admin: dashboard, POS, pesanan, marketplace, produk, kategori, inbound, stock opname, diskon, konten, laporan, alarm, pengaturan | Lengkap |

## Rekomendasi penyempurnaan (prioritas)

**Tinggi — sebelum presentasi**
- Uji cepat di perangkat asli (bukan hanya DevTools) terutama POS, stock opname, dan keranjang.
- Siapkan 2–3 foto kategori asli agar demo foto kategori terlihat nyata.

**Menengah — nilai tambah demo**
- Foto per-produk (upload di form produk) sebagai override foto kategori.
- Halaman detail artikel (/blog/[slug]) — saat ini kartu artikel belum punya halaman isi.
- Scanner kamera (getUserMedia + library pemindai) untuk tombol "Scan" di POS agar demo barcode end-to-end.
- Notifikasi/toast global (kini sebagian aksi hanya mengubah state tanpa umpan balik).
- Riwayat sesi stock opname (daftar sesi lama + status).

**Jangka panjang — menuju produksi**
- Backend & database (produk, kategori, konten, transaksi) menggantikan mock/localStorage.
- Autentikasi & role (Owner vs Kasir vs Admin Konten) — sidebar sudah menyiratkan role.
- Integrasi pembayaran (Midtrans) & ongkir (RajaOngkir/Biteship) sungguhan.
- Cetak struk thermal (ESC/POS) dan label barcode (ukuran 33×15 mm) dari dialog barcode.
- Aksesibilitas: kontras teks `text-muted-foreground` di atas latar muted perlu dicek WCAG AA.

## Catatan teknis
- `npx tsc --noEmit` bersih. Build produksi di sandbox hanya gagal mengunduh Google Fonts (keterbatasan jaringan sandbox) — jalankan `npm run build` di mesin Anda untuk verifikasi final.
- Dependensi baru: `uqr` (generator QR, zero-dependency). Code128 di-encode manual tanpa dependensi (`src/components/barcode.tsx`).
- Data kategori & konten CMS disimpan di localStorage browser (kunci `si4care_categories`, `si4care_content_v1`) — cukup untuk demo; reset dengan menghapus site data.
