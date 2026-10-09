# Skenario Demo si4care

Panduan presentasi ke klien. Urutannya disusun supaya tiap langkah memakai hasil langkah sebelumnya,
jadi ceritanya menyambung dan tidak ada layar kosong.

**Durasi:** ±15 menit · **Terakhir diuji:** 2026-10-09

---

## 0. Persiapan (10 menit sebelum mulai)

| # | Langkah | Perintah / catatan |
|---|---|---|
| 1 | **Pakai jaringan yang tidak memblokir port 5432** | Sebagian ISP Indonesia memblokir port PostgreSQL. Tethering HP sudah terbukti jalan. Tanpa ini aplikasi tidak bisa jalan sama sekali. |
| 2 | Pastikan DB terjangkau | `psql "$DATABASE_URL" -c "select 1;"` — harus menjawab, bukan menggantung |
| 3 | Siapkan data demo | `npm run db:seed` lalu `npm run db:seed:demo` (keduanya idempoten, aman diulang) |
| 4 | **Bersihkan transaksi uji** | `npm run test:reports:clean` — kalau dilewat, 3 transaksi uji ikut muncul di Laporan |
| 5 | Jalankan aplikasi | `npm run dev` → buka `http://localhost:3000` |
| 6 | Login dua browser | Satu jendela normal untuk **pelanggan**, satu jendela incognito untuk **admin**. Hemat waktu, tidak perlu logout-login di tengah demo. |

### Akun

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@si4care.com` | `Admin1234!` |
| Super Admin | `superadmin@si4care.com` | `SuperAdmin1234!` |
| Pelanggan | `budi@example.com` | `Customer1234!` |

### Angka yang sudah tersedia di data demo

6 pesanan web (semua status: paid, processing, shipped, delivered, cancelled, pending) ·
5 transaksi POS (tunai, QRIS, kartu kredit, transfer, kartu debit) ·
3 transaksi marketplace (Tokopedia ×2, Shopee ×1) · 9 produk · 3 voucher.

---

## 1. Halaman depan & katalog (2 menit)

1. Buka `/` — tunjukkan hero, kategori dengan ilustrasi SVG custom, produk unggulan.
2. Buka `/shop` — **sebutkan bahwa produk ini datang dari database**, bukan data palsu.
3. Pakai kotak cari: ketik `Nebulizer` → tinggal 1 produk.
4. Klik produk → halaman detail.

> **Kalimat pembuka yang enak:** "Semua yang Bapak/Ibu lihat ini sudah tersambung ke database sungguhan —
> stok, harga, dan pesanan bukan tampilan contoh."

---

## 2. Belanja + voucher (3 menit) — jalur paling penting

1. Di `/shop`, cari `Nebulizer` (Rp620.000) → **Tambah**.
   *Kenapa produk ini:* harganya melewati minimum belanja voucher `SEHAT10` (Rp100.000).
   Kalau pakai produk murah seperti masker Rp25.000, vouchernya akan ditolak dan demo tersendat.
2. Buka `/cart` → tunjukkan item, ubah jumlah.
3. **Checkout** → login sebagai `budi@example.com` kalau belum.
4. Pilih alamat (sudah ada dari data demo).
5. Pilih layanan pengiriman — ongkir diambil dari API Komerce, di-cache 24 jam di Redis.
6. **Kode Promo:** isi `SEHAT10` → **Pakai**.
   → muncul `✓ SEHAT10 — hemat Rp50.000`.
   **Poin jualan:** diskonnya 10% dari Rp620.000 = Rp62.000, tapi **dibatasi maksimal Rp50.000**
   sesuai aturan voucher. Tunjukkan ini — membuktikan aturan diskon benar-benar dijalankan,
   bukan sekadar potong persen.
7. Lanjut ke pembayaran → Midtrans Snap (Sandbox).

> **Pembayaran kartu uji Midtrans:** `4811 1111 1111 1114`, CVV `123`, exp bulan/tahun apa saja ke depan, OTP `112233`.

---

## 3. Admin melihat pesanan (2 menit)

Pindah ke jendela admin.

1. `/admin/orders` — daftar pesanan dari DB. Tunjukkan filter status.
2. Klik **Detail** pada pesanan tadi → data pelanggan, snapshot alamat, rincian harga, verifikasi Midtrans.
3. Ubah status: `processing` → `shipped`.
   **Poin jualan:** tiap perubahan status dicatat di audit log, lengkap dengan siapa yang mengubah.
4. Kembali ke jendela pelanggan → `/account/orders` → status sudah ikut berubah.

---

## 4. POS / kasir toko (3 menit)

1. `/admin/pos` — tab **Kasir Toko**.
2. Klik 2–3 produk → masuk keranjang. Di HP, keranjang ada di bottom sheet (tombol **Keranjang**).
3. Tunjukkan baris ringkasan: Subtotal → DPP → **PPN 12%** → Total, plus **indikator margin**.
   **Poin jualan:** kalau harga jual di bawah HPP, transaksi **ditolak** dan dicatat di audit log.
   Ini pengaman supaya kasir tidak menjual rugi.
4. Pilih **Bayar via: QRIS** → tunjukkan catatan "MDR 0.7% ditanggung toko".
   **Poin kepatuhan:** MDR tidak dibebankan ke pelanggan — sesuai aturan QRIS.
5. **Proses Pembayaran** → **Konfirmasi Bayar** → struk muncul dengan nomor `POS-xxxxxx`.
6. Tunjukkan stok produk berkurang — pemotongan stok memakai **FIFO/FEFO**
   (barang dengan kadaluarsa terdekat keluar lebih dulu).
7. Coba juga tombol **Scan barcode**: ketik barcode ngawur → muncul "tidak ditemukan"
   (bukan error). Scanner fisik bekerja seperti keyboard, jadi langsung jalan.

---

## 5. Stock opname (2 menit)

1. `/admin/stock-opname` → **Mulai Sesi Baru**.
   Sistem mengambil snapshot semua varian aktif beserta stok sistem saat itu.
2. Isi stok fisik salah satu produk berbeda dari stok sistem → tunjukkan kolom **selisih**
   dan nilai rupiah selisihnya.
3. **Simpan Progres** (boleh ditinggal dan dilanjutkan nanti) → lalu **Selesaikan**.
4. Selisihnya diterapkan ke batch dengan aturan FIFO/FEFO, dan sesinya masuk riwayat.

> **Hati-hati:** kalau sesi dibuka tapi tidak diselesaikan, tombolnya berubah jadi
> "Simpan Progres" dan sesi itu akan terlihat menggantung di demo berikutnya.
> Selesaikan atau tutup sesinya sebelum presentasi berakhir.

---

## 6. Laporan & alarm (2 menit)

1. `/admin/reports` — pilih periode & channel.
   Tunjukkan KPI, grafik tren, produk terlaris, dan tabel MDR per metode bayar.
   **Poin jualan:** angka ini dihitung langsung dari buku besar (ledger), bukan diketik manual.
2. `/admin/alarms` — stok menipis, mendekati kadaluarsa, batch kadaluarsa, margin tipis.
   Data demo memang memuat satu batch masker N95 yang sudah kadaluarsa, jadi alarmnya nyata.
3. Singgung juga: `/admin/marketplace` (rekonsiliasi settlement Tokopedia/Shopee) dan
   `/admin/returns` (alur retur 5 tahap dengan karantina).

---

## Yang JANGAN didemokan

| Bagian | Alasan |
|---|---|
| **Edit konten di `/admin/content` lalu cek di halaman depan** | Editor menyimpan ke database, tapi halaman depan masih membaca dari `localStorage` browser — **perubahan tidak akan terlihat** pengunjung lain. Jalur baca belum dimigrasikan. Lihat `checklist.md` §7f. |
| **Upload foto produk/kategori** | Jalan di lokal, tapi file tersimpan di `public/uploads/` yang tidak bisa ditulis di Vercel. Tunggu swap ke Cloudflare R2. |
| **Webhook Midtrans di lokal tanpa ngrok** | Notifikasi pembayaran butuh URL publik. Pakai Midtrans Simulator atau tunggu versi yang sudah di-deploy. |

---

## Kalau ada yang macet

| Gejala | Penyebab paling sering | Tindakan |
|---|---|---|
| Halaman menggantung lama lalu error koneksi | ISP memblokir port 5432 | Pindah ke tethering HP |
| Voucher ditolak "minimum belanja" | Keranjang di bawah Rp100.000 | Tambah produk mahal (Nebulizer / Tensimeter) |
| Katalog POS kosong | Seed belum jalan | `npm run db:seed` |
| Laporan memuat angka aneh | Transaksi uji tertinggal | `npm run test:reports:clean` |
| Ongkir tidak muncul | API Komerce Sandbox kadang kosong | Ada tabel ongkir cadangan; pilih opsi yang muncul saja |
