/* ───────────────────────────────────────────────────────────────
   Foto di-host lokal di /public/images agar selalu tampil instan —
   tidak bergantung pada Unsplash (yang sering lambat / gagal load /
   kena rate-limit). Ganti file di /public/images dengan foto sendiri
   bila perlu. <Photo> tetap menampilkan gradient on-brand bila suatu
   file gagal dimuat, jadi layout tidak pernah rusak.
──────────────────────────────────────────────────────────────── */

export const PHOTOS = {
  // Hero — caring at-home / clinical setting
  hero: "/images/hero.jpg",
  // Quality / lifestyle band
  quality: "/images/quality.jpg",
  // Articles
  article1: "/images/article1.jpg",
  article2: "/images/article2.jpg",
  article3: "/images/article3.jpg",
  // CTA band
  cta: "/images/cta.jpg",
} as const;
