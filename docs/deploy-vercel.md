# Panduan Deploy ke Vercel

Untuk pemilik proyek. Semua yang bisa dikerjakan dari sisi kode sudah selesai dan diuji di build production
(lihat `checklist.md` §7h); dokumen ini berisi langkah yang **harus dilakukan manusia** — login, kredensial,
dan pengaturan di dashboard pihak ketiga.

## 0. Sebelum mulai — jangan dilewati

| # | Cek | Kenapa |
|---|---|---|
| 1 | **Ganti password akun seed** (`admin@`, `superadmin@`, dan akun pelanggan contoh) lalu perbarui `SEED_*` di `.env.local` | Password lama ada di riwayat git yang sudah ter-push (`checklist.md` A3a). Setelah deploy, akun itu bisa login di situs publik. Perintah: `NEW_PASSWORD='sandi-kuat-min-12-karakter' npm run db:set-password -- admin@si4care.com` (ulangi untuk tiap email; sesi login lama otomatis dicabut). Untuk database produksi, jalankan dengan `DATABASE_URL` produksi |
| 2 | Pastikan repo GitHub **privat** — atau sudah yakin riwayatnya aman | Sama seperti di atas |
| 3 | Buat **database Upstash Redis baru** | Yang lama sudah dihapus (`selected-buzzard-…upstash.io` tidak ada lagi). Tanpa Redis situs tetap jalan, tapi tanpa cache ongkir dan rate-limit lintas-instance |
| 4 | Putuskan: **database produksi terpisah dari lokal?** | Vercel memakai database yang sama dengan `.env.local` kecuali kamu membuat proyek Supabase kedua. Transaksi uji dan akun contoh di lokal akan langsung terlihat di situs live |

## 1. Hubungkan GitHub ke Vercel

Akun GitHub dan akun Vercel **boleh berbeda**; yang menentukan adalah akun GitHub mana yang ditautkan ke scope Vercel.

1. Di Vercel (scope `si-4-care`): **Settings → Login Connections / Git** → *Connect GitHub* → login sebagai `MuhammadNurIrfan`.
2. Install **Vercel GitHub App**, beri akses ke repo `SI4CARE-v2` (cukup "Only select repositories").
3. **Add New → Project → Import** `SI4CARE-v2`. Framework terdeteksi otomatis (Next.js); jangan ubah build command.

Batasan Vercel: repo milik **akun personal** hanya bisa di-import oleh **pemilik** repo itu (collaborator tidak bisa).
Satu akun GitHub hanya bisa tertaut ke satu akun Vercel. Kalau buntu: pindahkan repo ke GitHub Organization, atau
deploy lewat CLI (`npx vercel --prod`) tanpa integrasi Git.

`vercel.json` sudah mengunci fungsi di region **Singapore (`sin1`)**, sama dengan database Supabase (`ap-southeast-1`).
Jangan dihapus — tanpanya setiap query menempuh ±200 ms bolak-balik ke AS dan dashboard (±13 query) terasa lambat.

## 2. Environment variables

Isi di **Project → Settings → Environment Variables**, centang **Production** dan **Preview**.
Nilainya ada di `.env.local` kamu; daftar lengkap dengan penjelasan ada di `.env.example`.

| Variabel | Wajib | Catatan |
|---|---|---|
| `DATABASE_URL` | ✅ | **Transaction pooler, port `6543`** — bukan `5432`. Format: `postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`. Port 5432 (mode session) hanya mengizinkan 15 klien untuk seluruh proyek; di serverless kuota itu habis dengan sedikit trafik |
| `BETTER_AUTH_SECRET` | ✅ | Minimal 32 karakter. Bisa memakai yang sama dengan lokal, atau buat baru: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (membuat baru = semua sesi login lama tidak berlaku) |
| `BETTER_AUTH_URL` | ✅ | **Domain Vercel-mu**, mis. `https://si4care.vercel.app` — bukan `localhost` (server menolak start kalau begitu) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Sama dengan `BETTER_AUTH_URL`. Dibaca saat **build**: kalau diubah, deploy ulang |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` | ✅ | Pasangan **Sandbox** (`SB-Mid-…`) dengan `MIDTRANS_IS_PRODUCTION=false` — atau pasangan Production dengan `true`. Tidak boleh dicampur (server menolak start) |
| `MIDTRANS_IS_PRODUCTION` | ✅ | `false` = Sandbox (pembayaran uji); `true` = pembayaran nyata, wajib kunci Production (`Mid-…`, bukan `SB-Mid-…`) |
| `MIDTRANS_MERCHANT_ID` | – | Hanya rujukan; kode tidak memakainya |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | disarankan | Dari database Upstash yang baru. Isi keduanya atau tidak sama sekali |
| `KOMERCE_API_KEY` | disarankan | Tanpanya ongkir memakai tarif cadangan |
| `KOMERCE_STORE_ORIGIN_ID` | disarankan | ID wilayah toko (angka). Cara mencari: lihat komentar di `.env.example` |
| `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | untuk upload foto | Isi **kelimanya** atau kosongkan semua. Tanpa R2, upload foto ditolak (HTTP 503) di production karena disk Vercel tidak bisa ditulis |
| `GOOGLE_CLIENT_ID` / `_SECRET` | – | Hanya bila login Google dipakai. Redirect URI: `https://<domain>/api/auth/callback/google` |
| `SEED_*` | ❌ | **Jangan** diisi di Vercel — hanya dipakai skrip seed lokal |

Kesalahan konfigurasi tidak gagal diam-diam: server production **menolak melayani request** dan menulis daftar
persisnya ke **Vercel → Logs** (cari "Konfigurasi environment tidak valid").

## 3. Deploy dan periksa

Push ke `main` memicu deploy otomatis. Setelah hijau, buka satu per satu:

- [ ] `/` — landing tampil, produk unggulan dari database
- [ ] `/shop` lalu klik satu produk — detail menampilkan produk yang diklik
- [ ] `/blog` dan satu artikel
- [ ] `/shop/id-ngawur` — harus **404**
- [ ] `/login` sebagai admin → `/admin` menampilkan dashboard dengan angka nyata
- [ ] `/api/shipping/cost?destination=BANDUNG` — daftar tarif kurir (bukan error)
- [ ] Ubah judul hero di `/admin/content`, lihat di `/` — berubah seketika

## 4. Midtrans: alamat webhook

Tanpa ini pesanan tetap "Menunggu Bayar" selamanya walau pelanggan sudah membayar.

**Midtrans Dashboard (Sandbox) → Settings → Configuration → Payment Notification URL**:

```
https://<domain-vercel-kamu>/api/payment/notification
```

Uji: buat pesanan, bayar dengan kartu uji `4811 1111 1111 1114` (CVV `123`, OTP `112233`), pastikan status
berubah jadi *Dibayar* dan stok berkurang. Webhook ini aman diulang: pengiriman ganda hanya diproses sekali.

## 5. Kalau ada masalah

| Gejala | Penyebab paling mungkin | Tindakan |
|---|---|---|
| Semua halaman HTTP 500 | Env tidak valid — server sengaja menolak start | Baca **Logs**, perbaiki variabel yang disebut, redeploy |
| `EMAXCONNSESSION` di log | `DATABASE_URL` masih port 5432 | Ganti ke port 6543 |
| Login berputar / redirect ke localhost | `BETTER_AUTH_URL` salah | Samakan dengan domain publik, redeploy |
| Foto tidak muncul | `R2_PUBLIC_URL` kosong atau salah | Isi, redeploy (`next/image` hanya mengizinkan host itu) |
| Edit CMS/produk tidak langsung tampil | Cache ISR (maksimal 60 detik); edit dari admin biasanya langsung | Tunggu ≤1 menit; kalau tetap, periksa Logs |
| Pesanan tak pernah berubah jadi *Dibayar* | URL webhook Midtrans belum diisi | Langkah 4 |
| Upload foto → 503 | R2 belum dikonfigurasi | Isi variabel R2 |

**Rollback:** Vercel → *Deployments* → pilih deploy sebelumnya → *Promote to Production*.
