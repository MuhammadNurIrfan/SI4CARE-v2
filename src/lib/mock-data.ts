/**
 * Satu-satunya sumber data mock prototipe.
 * Saat backend siap, ganti isi file ini dengan fetch API — konsumen tidak berubah.
 *
 * Catatan: katalog toko (SHOP_PRODUCTS) dan katalog POS/inventori (POS_CATALOG)
 * memang berbeda — keduanya mensimulasikan dataset modul yang berbeda untuk demo.
 */

import type { Product } from "@/components/shop/product-card";
import type { CartItem } from "@/context/CartContext";

/* ─── Katalog toko (shop, landing) ─────────────────────────────── */

export const SHOP_PRODUCTS: Product[] = [
  { id: "1", name: "Tensimeter Digital Omron HEM-7120", price: 540000, originalPrice: 620000, category: "Alat Diagnostik", stock: 15, art: "tensimeter", brand: "Omron", rating: 4.9, sold: 324 },
  { id: "2", name: "Tensimeter Lengan Atas Yuwell YE660D", price: 410000, category: "Alat Diagnostik", stock: 22, art: "tensimeter", brand: "Yuwell", rating: 4.7, sold: 156 },
  { id: "3", name: "Nebulizer Kompresor Omron NE-C28", price: 620000, category: "Alat Terapi", stock: 8, art: "nebulizer", brand: "Omron", rating: 4.8, sold: 142 },
  { id: "4", name: "Nebulizer Portable Yuwell Mesh", price: 385000, originalPrice: 450000, category: "Alat Terapi", stock: 19, art: "nebulizer", brand: "Yuwell", rating: 4.6, sold: 98 },
  { id: "5", name: "Kursi Roda Lipat Standar Sella", price: 1250000, category: "Alat Bantu Jalan", stock: 5, art: "wheelchair", brand: "Sella", rating: 4.7, sold: 64 },
  { id: "6", name: "Kursi Roda Travelling Ringan", price: 1680000, category: "Alat Bantu Jalan", stock: 3, art: "wheelchair", brand: "GEA Medical", rating: 4.8, sold: 31 },
  { id: "7", name: "Pulse Oximeter Fingertip Yuwell", price: 175000, originalPrice: 220000, category: "Alat Diagnostik", stock: 30, art: "oximeter", brand: "Yuwell", rating: 4.8, sold: 210 },
  { id: "8", name: "Termometer Tembak Infrared OneMed", price: 150000, originalPrice: 195000, category: "Alat Diagnostik", stock: 50, art: "thermometer", brand: "OneMed", rating: 4.6, sold: 188 },
  { id: "9", name: "Masker Medis 3-Ply OneMed (Box 50)", price: 25000, category: "APD", stock: 100, art: "mask", brand: "OneMed", rating: 4.9, sold: 1240 },
  { id: "10", name: "Masker N95 GEA Medical (isi 20)", price: 95000, originalPrice: 120000, category: "APD", stock: 0, art: "mask", brand: "GEA Medical", rating: 4.8, sold: 540 },
  { id: "11", name: "Stetoskop Littmann Classic III", price: 1850000, category: "Alat Diagnostik", stock: 4, art: "stethoscope", brand: "Littmann", rating: 5.0, sold: 47 },
  { id: "12", name: "Stetoskop Dual Head GEA Medical", price: 165000, category: "Alat Diagnostik", stock: 26, art: "stethoscope", brand: "GEA Medical", rating: 4.5, sold: 73 },
];

export const SHOP_CATEGORIES = ["Alat Diagnostik", "Alat Terapi", "Alat Bantu Jalan", "APD"];
export const SHOP_BRANDS = ["Omron", "Yuwell", "Sella", "OneMed", "GEA Medical", "Littmann"];

/** Kartu carousel "Produk Unggulan" di landing. `art` = kunci PRODUCT_ART. */
export type FeaturedProduct = {
  name: string;
  price: string;
  original?: string;
  category: string;
  art: string;
  badge?: string;
};

export const FEATURED_PRODUCTS: FeaturedProduct[] = [
  { name: "Tensimeter Digital Omron HEM-7120", price: "Rp 540.000", original: "Rp 620.000", category: "Alat Diagnostik", art: "tensimeter", badge: "Terlaris" },
  { name: "Kursi Roda Standar Rumah Sakit", price: "Rp 1.250.000", category: "Alat Bantu Jalan", art: "wheelchair" },
  { name: "Termometer Tembak Infrared", price: "Rp 150.000", original: "Rp 195.000", category: "Alat Diagnostik", art: "thermometer", badge: "Promo" },
  { name: "Masker Medis 3-Ply (Box isi 50)", price: "Rp 25.000", category: "Bahan Habis Pakai", art: "mask" },
  { name: "Nebulizer Kompresor NE-C28", price: "Rp 620.000", category: "Alat Terapi", art: "nebulizer", badge: "Original" },
  { name: "Pulse Oximeter Fingertip", price: "Rp 175.000", category: "Alat Diagnostik", art: "oximeter" },
  { name: "Stetoskop Littmann Classic III", price: "Rp 1.850.000", category: "Alat Diagnostik", art: "stethoscope" },
];

/** Detail produk demo untuk /shop/[id] (prototipe: semua id menampilkan produk ini). */
export const DEMO_PRODUCT_DETAIL = {
  id: "1",
  name: "Tensimeter Digital Omron HEM-7120",
  description:
    "OMRON HEM-7120 adalah tensimeter digital lengan atas dengan teknologi IntelliSense yang memberikan pembacaan cepat, nyaman, dan akurat. Dirancang khusus untuk pemantauan tekanan darah harian di rumah.",
  brand: "Omron",
  category: "Alat Diagnostik",
  art: "tensimeter",
  rating: 4.9,
  reviews: 124,
  sold: 324,
  variants: [
    { id: "v1", name: "Standar (Tanpa Adaptor)", price: 540000, originalPrice: 620000, stock: 15 },
    { id: "v2", name: "Paket + Adaptor", price: 650000, originalPrice: 700000, stock: 8 },
  ],
  specs: [
    { label: "Metode Pengukuran", value: "Oscillometric" },
    { label: "Rentang Pengukuran", value: "Tekanan 0–299 mmHg · Nadi 40–180/menit" },
    { label: "Akurasi", value: "Tekanan ±3 mmHg · Nadi ±5%" },
    { label: "Baterai", value: "4× AA" },
    { label: "Garansi", value: "5 Tahun Resmi Omron" },
  ],
  features: [
    "Lampu indikator pemakaian manset",
    "Indikator tingkat tekanan darah",
    "Deteksi detak jantung tidak beraturan",
    "Memori pengukuran terakhir",
  ],
};

/* ─── Alur belanja: keranjang → checkout → sukses → riwayat ─────── */

export const DEMO_CART_ITEMS: CartItem[] = [
  {
    id: "c1",
    productId: "1",
    name: "Tensi Darah Digital Omron HEM-7120",
    variantId: "v1",
    variantName: "Standar (Tanpa Adaptor)",
    price: 540000,
    quantity: 1,
    imageColor: "bg-blue-100",
  },
  {
    id: "c2",
    productId: "4",
    name: "Masker Medis 3-Ply (Box isi 50)",
    variantId: "v4",
    variantName: "Biru",
    price: 25000,
    quantity: 3,
    imageColor: "bg-amber-100",
  },
];

export const CHECKOUT_ITEMS = [
  { id: "c1", name: "Tensi Darah Digital Omron HEM-7120", variantName: "Standar", price: 540000, quantity: 1, imageColor: "bg-blue-100" },
  { id: "c2", name: "Masker Medis 3-Ply (Box isi 50)", variantName: "Biru", price: 25000, quantity: 3, imageColor: "bg-amber-100" },
];

/** Kode promo demo — coba SEHAT10 / ALKES5 di halaman checkout. */
export const PROMO_CODES: Record<string, { pct: number; label: string }> = {
  SEHAT10: { pct: 10, label: "Diskon 10%" },
  ALKES5: { pct: 5, label: "Diskon 5%" },
};

export const ORDER_SUCCESS_ITEMS = [
  { name: "Tensi Darah Digital Omron HEM-7120", variant: "Standar (Tanpa Adaptor)", qty: 1, price: 540000 },
  { name: "Masker Medis 3-Ply (Box isi 50)", variant: "Biru", qty: 3, price: 25000 },
];

export const DEMO_ORDERS = [
  {
    id: "INV/20231015/0001",
    date: "15 Okt 2023",
    status: "Dikirim",
    statusColor: "bg-blue-500",
    total: "Rp 614.500",
    items: [{ name: "Tensi Darah Digital Omron HEM-7120", qty: 1, imageColor: "bg-blue-100" }],
    resi: "JNE - 1234567890123",
  },
  {
    id: "INV/20230902/0045",
    date: "02 Sep 2023",
    status: "Selesai",
    statusColor: "bg-emerald-500",
    total: "Rp 100.000",
    items: [{ name: "Masker Medis 3-Ply (Box isi 50)", qty: 4, imageColor: "bg-amber-100" }],
    resi: "Sicepat - 000987654321",
  },
];

/* ─── Back-office: POS & inventori ──────────────────────────────── */

export const POS_CATALOG = [
  { id: "v1", name: "Tensi Darah Digital Omron HEM-7120", sku: "ALK-TEN-001", barcode: "8991234500017", price: 540000, hpp: 420000, stock: 15, category: "Alat Diagnostik" },
  { id: "v2", name: "Termometer Tembak Infrared OneMed",  sku: "ALK-TER-001", barcode: "8991234500024", price: 150000, hpp: 105000, stock: 50, category: "Alat Diagnostik" },
  { id: "v3", name: "Masker Medis 3-Ply (Box isi 50)",    sku: "BHP-MSK-001", barcode: "8991234500031", price: 25000,  hpp: 18000,  stock: 100, category: "Bahan Habis Pakai" },
  { id: "v4", name: "Sarung Tangan Medis Latex (Box 100)",sku: "BHP-STG-001", barcode: "8991234500048", price: 45000,  hpp: 32000,  stock: 80,  category: "Bahan Habis Pakai" },
  { id: "v5", name: "Stetoskop Littmann Classic III",     sku: "ALK-STE-001", barcode: "8991234500055", price: 1850000,hpp: 1450000, stock: 3,   category: "Alat Diagnostik" },
  { id: "v6", name: "Kasa Steril 16x16 (Box isi 10)",    sku: "BHP-KAS-001", barcode: "8991234500062", price: 12000,  hpp: 8000,   stock: 200, category: "Bahan Habis Pakai" },
  { id: "v7", name: "Oxymeter Fingertip Pulse",           sku: "ALK-OXY-001", barcode: "8991234500079", price: 75000,  hpp: 52000,  stock: 30,  category: "Alat Diagnostik" },
  { id: "v8", name: "Tongkat Jalan Lipat Aluminium",      sku: "ALK-TGK-001", barcode: "8991234500086", price: 85000,  hpp: 60000,  stock: 20,  category: "Alat Bantu Jalan" },
];

export const INBOUND_PRODUCT_OPTIONS = [
  { id: "v1", name: "Tensi Darah Digital Omron HEM-7120", sku: "ALK-TEN-001", hargaJual: 540000, edFlag: false },
  { id: "v2", name: "Termometer Tembak Infrared OneMed", sku: "ALK-TER-001", hargaJual: 150000, edFlag: false },
  { id: "v3", name: "Masker Medis 3-Ply (Box isi 50)", sku: "BHP-MSK-001", hargaJual: 25000, edFlag: true },
  { id: "v4", name: "Sarung Tangan Medis Latex (Box 100)", sku: "BHP-STG-001", hargaJual: 45000, edFlag: true },
  { id: "v5", name: "Betadine Antiseptik 300ml", sku: "BTD-ANT-300", hargaJual: 42000, edFlag: true },
];

export const INBOUND_RECENT_BATCHES = [
  { batch: "B2026-051", produk: "Tensi Darah Digital Omron HEM-7120", qtyAwal: 20, sisa: 15, hpp: 420000, jual: 540000, ed: "-", supplier: "PT Omron Health", mode: "fifo" },
  { batch: "B2026-048", produk: "Masker Medis 3-Ply (Box isi 50)", qtyAwal: 100, sisa: 64, hpp: 18000, jual: 25000, ed: "2026-12-31", supplier: "CV Sehat Medika", mode: "fefo" },
  { batch: "B2026-045", produk: "Betadine Antiseptik 300ml", qtyAwal: 60, sisa: 12, hpp: 30000, jual: 42000, ed: "2026-08-15", supplier: "Mundipharma Dist.", mode: "fefo" },
  { batch: "B2026-039", produk: "Sarung Tangan Medis Latex (Box 100)", qtyAwal: 80, sisa: 5, hpp: 32000, jual: 45000, ed: "2026-06-30", supplier: "CV Sehat Medika", mode: "fefo" },
];
