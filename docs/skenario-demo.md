# Skenario Demo si4care

Panduan presentasi ke klien. Urutannya disusun supaya tiap langkah memakai hasil langkah sebelumnya,
jadi ceritanya menyambung dan tidak ada layar kosong.

**Durasi:** ±15 menit · **Terakhir diuji:** 2026-10-11 (data demo; dev server dan build production)

---

## 0. Persiapan (10 menit sebelum mulai)

| # | Langkah | Perintah / catatan |
|---|---|---|
| 1 | **Pakai jaringan yang tidak memblokir port 5432/6543** | Sebagian ISP Indonesia memblokir port PostgreSQL. Tethering HP sudah terbukti jalan. Tanpa ini aplikasi lokal tidak bisa jalan (situs di Vercel tidak terpengaruh — ia bukan di jaringanmu). |
| 2 | Pastikan DB terjangkau | `psql "$DATABASE_URL" -c "select 1;"` — harus menjawab, bukan menggantung |
| 3 | Siapkan data demo | `npm run db:seed` lalu `npm run db:seed:demo` (keduanya idempoten, aman diulang) |
| 4 | **Bersihkan transaksi uji** | `npm run test:reports:clean` — kalau dilewat, 3 transaksi uji ikut muncul di Laporan |
| 5 | Jalankan aplikasi | `npm run dev` → buka `http://localhost:3000` |
| 6 | Login dua browser | Satu jendela normal untuk **pelanggan**, satu jendela incognito untuk **admin**. Hemat waktu, tidak perlu logout-login di tengah demo. |

### Akun

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@si4care.com` | *(dari `SEED_ADMIN_PASSWORD`)* |
| Super Admin | `superadmin@si4care.com` | *(dari `SEED_SUPERADMIN_PASSWORD`)* |
| Pelanggan | `budi@example.com` | *(dari `SEED_CUSTOMER_PASSWORD`)* |

### Angka yang sudah tersedia di data demo

6 pesanan web (semua status: paid, processing, shipped, delivered, cancelled, pending) ·
5 transaksi POS (tunai, QRIS, kartu kredit, transfer, kartu debit) ·
3 transaksi marketplace (Tokopedia ×2, Shopee ×1) · 8 produk aktif (9 varian) · 3 voucher · 3 artikel contoh.

> Angka-angka ini **nyata**: dashboard, laporan, dan stok menghitungnya dari database. Jangan menjanjikan angka lain
> (jumlah pelanggan, ulasan, dst.) — toko ini baru, dan fitur ulasan memang belum ada.

---

## 1. Halaman depan & katalog (2 menit)

1. Buka `/` — tunjukkan hero, kategori dengan ilustrasi SVG custom, produk unggulan.
2. Buka `/shop` — **sebutkan bahwa produk ini datang dari database**, bukan data palsu.
3. Pakai kotak cari: ketik `Nebulizer` → tinggal 1 produk.
4. Klik produk → halaman detail. **Judul, harga, dan stok di sini adalah produk yang diklik** (dulu semua produk membuka halaman yang sama).
   Pada produk bervarian (Tensimeter) tunjukkan pemilih varian — harga dan stok ikut berubah.
5. Gulir `/` ke bawah: **Produk unggulan** dan **Artikel** juga datang dari database; klik satu artikel.

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

1. `/admin` (**Dashboard**) — ganti **Periode** ke *Tahun Ini* (data dihitung ulang di server), lihat rincian per kanal,
   ringkasan stok, dan transaksi terkini; tombol **Ekspor** mengunduh CSV.
   **Poin jualan:** laba bersih di sini tepat sama dengan jumlah margin di buku besar — dan MDR tidak terhitung dua kali.
2. `/admin/reports` — pilih periode & channel.
   Tunjukkan KPI, grafik tren, produk terlaris, dan tabel MDR per metode bayar.
   **Poin jualan:** angka ini dihitung langsung dari buku besar (ledger), bukan diketik manual. Pesanan web yang dibayar dan
   settlement marketplace otomatis masuk ledger.
3. `/admin/alarms` — stok menipis, mendekati kadaluarsa, batch kadaluarsa, margin tipis.
   Data demo memang memuat satu batch masker N95 yang sudah kadaluarsa, jadi alarmnya nyata.
4. Singgung juga: `/admin/marketplace` (rekonsiliasi settlement Tokopedia/Shopee) dan
   `/admin/returns` (alur retur 5 tahap dengan karantina).

---

## Yang JANGAN didemokan

| Bagian | Alasan |
|---|---|
| **Upload foto di situs Vercel** | Berhasil di lokal, tetapi di Vercel disk tidak bisa ditulis → ditolak (HTTP 503) sampai Cloudflare R2 dikonfigurasi (`docs/deploy-vercel.md`). Foto kategori yang diunggah **tampil di kartu produk**; di lokal aman didemokan |
| **Pembayaran sampai status "Dibayar" di lokal** | Webhook Midtrans butuh URL publik. Di lokal pakai Midtrans Simulator, atau demokan dari situs yang sudah di-deploy (Payment Notification URL sudah diisi) |
| **Halaman `/admin/settings`** | Hanya tampilan — tombol Simpan tidak menyimpan ke mana pun (`checklist.md` K1) |
| **Testimoni di halaman depan** | Enam testimoni **contoh** (nama rekaan). Ganti dengan testimoni asli lewat `/admin/content` sebelum presentasi ke pihak luar |

**Bisa didemokan (sebelumnya tidak):** edit teks hero di `/admin/content` lalu muat ulang halaman depan — perubahan
muncul seketika (jalur baca CMS kini dari database).

---

## Kalau ada yang macet

| Gejala | Penyebab paling sering | Tindakan |
|---|---|---|
| Halaman menggantung lama lalu error koneksi | ISP memblokir port 5432 | Pindah ke tethering HP |
| Voucher ditolak "minimum belanja" | Keranjang di bawah Rp100.000 | Tambah produk mahal (Nebulizer / Tensimeter) |
| Katalog POS kosong | Seed belum jalan | `npm run db:seed` |
| Laporan memuat angka aneh | Transaksi uji tertinggal | `npm run test:reports:clean` |
| Ongkir tampil 4 opsi dengan tarif bulat (15.000 / 40.000 / 18.000 / 14.000) | API Komerce tidak terjangkau atau kota tidak dikenal → tarif **cadangan** | Wajar untuk demo; periksa `KOMERCE_API_KEY` bila ingin tarif kurir nyata |
| Dashboard berubah angka setelah transaksi uji | `test:*` meninggalkan data sebentar | `npm run test:reports:clean` |
| Ada lencana merah "1 Issue" di kiri bawah (dev) | Indikator error Next dev | Sudah diperbaiki (CSP `unsafe-eval` hanya di dev); muat ulang bila muncul lagi |
