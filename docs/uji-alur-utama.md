# Panduan Uji Alur Utama si4care

Daftar periksa untuk memastikan alur-alur inti berfungsi — dipakai setelah setiap deploy, sebelum go-live,
dan saat ada perubahan besar. Setiap alur ditulis sebagai langkah yang bisa dicentang beserta hasil yang
harus terlihat. Tes otomatis (`npm run test:e2e`) mencakup sebagian besar; panduan ini melengkapinya dengan
pemeriksaan manual di lingkungan yang sebenarnya.

**Perkiraan waktu:** ±20 menit · **Terakhir diverifikasi:** 2026-10-11

---

## 0. Persiapan

| # | Langkah | Catatan |
|---|---|---|
| 1 | Pastikan database terjangkau | Lokal: `psql "$DATABASE_URL" -c "select 1;"`. Sebagian ISP Indonesia memblokir port PostgreSQL (5432/6543) — pindah jaringan bila menggantung. Situs di Vercel tidak terpengaruh |
| 2 | **Lingkungan non-produksi saja:** isi data uji | `npm run db:seed` lalu `npm run db:seed:demo` (idempoten). **Jangan jalankan `db:seed:demo` di database produksi** — ia membuat akun pelanggan, pesanan, dan transaksi contoh |
| 3 | Bersihkan sisa transaksi uji | `npm run test:reports:clean` — transaksi dari skrip uji tidak boleh tercampur dengan laporan |
| 4 | Siapkan dua sesi browser | Satu jendela normal untuk **pelanggan**, satu jendela incognito untuk **admin** |

### Akun uji (hanya non-produksi)

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@si4care.com` | dari `SEED_ADMIN_PASSWORD` |
| Super Admin | `superadmin@si4care.com` | dari `SEED_SUPERADMIN_PASSWORD` |
| Pelanggan | `budi@example.com` | dari `SEED_CUSTOMER_PASSWORD` |

Di produksi, ganti password akun seed (`npm run db:set-password`) dan hapus akun pelanggan contoh sebelum dibuka ke publik.

---

## 1. Katalog dan halaman publik

- [ ] `/` memuat tanpa error; **Produk unggulan** dan **Artikel** berasal dari database
- [ ] `/shop` menampilkan produk aktif beserta stok; pencarian `Nebulizer` menyisakan satu produk
- [ ] Klik produk → halaman detail menampilkan **produk yang diklik** (nama, harga, stok, varian)
- [ ] Produk bervarian (mis. Tensimeter) menampilkan pemilih varian; harga dan stok ikut berubah
- [ ] `/shop/id-ngawur` dan `/blog/slug-ngawur` menjawab **404**
- [ ] Satu artikel di `/blog` terbuka penuh

## 2. Belanja, voucher, dan pembayaran

1. Tambahkan produk dengan subtotal ≥ Rp100.000 (mis. Nebulizer) → `/cart` → **Checkout** (login sebagai pelanggan).
2. Pilih alamat dan layanan pengiriman.
3. Kode Promo `SEHAT10` → **Pakai**.

- [ ] Muncul `✓ SEHAT10 — hemat Rp50.000` (10% dari Rp620.000 = Rp62.000, **dibatasi maksimal Rp50.000**)
- [ ] Ongkir tampil: tarif kurir nyata bila `KOMERCE_API_KEY` terisi; tarif cadangan (15.000 / 40.000 / 18.000 / 14.000) bila API tidak terjangkau
- [ ] Voucher dengan minimum belanja tidak terpenuhi ditolak dengan pesan jelas
- [ ] Pembayaran Midtrans terbuka. Sandbox: kartu `4811 1111 1111 1114`, CVV `123`, OTP `112233`
- [ ] Setelah dibayar, status pesanan berubah menjadi **Dibayar** dan **stok berkurang** (butuh Payment Notification URL Midtrans — `docs/deploy-vercel.md` §4)
- [ ] Pengiriman ulang notifikasi yang sama tidak memotong stok dua kali

## 3. Pesanan di sisi admin

- [ ] `/admin/orders` menampilkan pesanan; filter status bekerja
- [ ] Detail pesanan memuat data pelanggan, alamat, rincian harga, dan verifikasi Midtrans
- [ ] Ubah status `processing` → `shipped`; tercatat di audit log; pelanggan melihat status baru di `/account/orders`

## 4. Kasir (POS)

- [ ] `/admin/pos` → tab **Kasir Toko** memuat katalog dengan stok
- [ ] Tambah 2–3 produk → ringkasan Subtotal, DPP, PPN 12%, Total, dan indikator margin tampil
- [ ] Menjual di bawah HPP **ditolak** dan tercatat di audit log
- [ ] Pembayaran QRIS menampilkan catatan MDR ditanggung toko (tidak dibebankan ke pelanggan)
- [ ] **Proses Pembayaran → Konfirmasi Bayar** → struk bernomor `POS-xxxxxx`; stok berkurang (FIFO/FEFO)
- [ ] Barcode tak dikenal di mode Scan → pesan "tidak ditemukan", bukan error
- [ ] Di HP, keranjang terbuka lewat tombol **Keranjang** (bottom sheet)

## 5. Stock opname

- [ ] `/admin/stock-opname` → **Mulai Sesi Baru** mengambil snapshot semua varian aktif
- [ ] Isi stok fisik berbeda dari stok sistem → kolom selisih dan nilai rupiahnya benar
- [ ] **Simpan Progres** lalu **Selesaikan** → selisih diterapkan ke batch (FIFO/FEFO) dan sesi masuk riwayat
- [ ] Jangan biarkan sesi menggantung: sesi yang belum diselesaikan tampil sebagai sesi terbuka berikutnya

## 6. Dashboard, laporan, dan alarm

- [ ] `/admin` (Dashboard): ganti **Periode** → data dihitung ulang server; **Ekspor** mengunduh CSV
- [ ] Laba bersih Dashboard sama dengan jumlah margin buku besar (MDR tidak terhitung dua kali)
- [ ] `/admin/reports`: KPI, tren, produk terlaris, tabel MDR sesuai periode & kanal. Pesanan web yang dibayar dan settlement marketplace **masuk ledger**
- [ ] `/admin/alarms`: stok menipis, mendekati kedaluwarsa, batch kedaluwarsa, margin tipis
- [ ] `/admin/marketplace`: mengubah status settlement ke *selesai* membuat entri ledger; mengembalikannya ke *pending* menghapusnya
- [ ] `/admin/returns`: alur retur lima tahap (pending → inspeksi → layak jual / write-off / ditolak)

## 7. Konten (CMS)

- [ ] `/admin/content`: ubah teks hero → muat ulang `/` → berubah (seketika; paling lambat 60 detik)
- [ ] Ubah visibilitas satu section, simpan, periksa halaman depan
- [ ] Artikel baru berstatus *Terbit* di `/admin/content` muncul di `/blog` dan di landing

## 8. Kontrol akses

- [ ] Tanpa login, `/admin/*` dan `/account/*` mengalihkan ke `/login`
- [ ] Login sebagai **pelanggan** lalu buka `/admin` → dialihkan ke beranda
- [ ] `npm run test:security` (di build production) menolak seluruh serangan ke server action sensitif

---

## Bila ada yang tidak sesuai

| Gejala | Penyebab paling sering | Tindakan |
|---|---|---|
| Halaman menggantung lalu error koneksi | Port database diblokir ISP (lokal) | Pindah jaringan |
| Semua halaman HTTP 500 di produksi | Env tidak valid — server sengaja menolak start | Baca Vercel → Logs, perbaiki variabel yang disebut |
| Voucher ditolak "minimum belanja" | Subtotal di bawah Rp100.000 | Tambah produk bernilai lebih tinggi |
| Katalog POS atau toko kosong | Seed belum dijalankan | `npm run db:seed` |
| Laporan memuat angka aneh | Transaksi uji tertinggal | `npm run test:reports:clean` |
| Ongkir selalu tarif cadangan | API Komerce tak terjangkau / kota tak dikenal / key kosong | Periksa `KOMERCE_API_KEY` dan `KOMERCE_STORE_ORIGIN_ID` |
| Pesanan tak pernah jadi *Dibayar* | Payment Notification URL Midtrans belum diisi | `docs/deploy-vercel.md` §4 |
| Upload foto → 503 di produksi | R2 belum dikonfigurasi | Isi variabel R2 |

## Yang belum tersedia

| Bagian | Keterangan |
|---|---|
| Halaman `/admin/settings` | Hanya tampilan; tombol Simpan tidak menyimpan (`checklist.md` K1). Profil toko dibaca dari `src/lib/site-config.ts` |
| Ulasan & rating produk | Fiturnya belum ada, jadi tidak ditampilkan |
