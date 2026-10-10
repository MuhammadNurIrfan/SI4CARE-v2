import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import {
  calculateCost,
  getOriginId,
  resolveDestinationId,
  type ShippingOption,
} from "@/lib/komerce";

// Checkout mengimpor tipe ini dari sini.
export type { ShippingOption } from "@/lib/komerce";

const CACHE_TTL = 60 * 60 * 24; // 24 jam
const FALLBACK_CACHE_TTL = 60 * 60; // 1 jam — retry lebih cepat
// Tidak semua kurir tersedia di semua rute/paket — yang tak tersedia dijawab 404 (murah, diabaikan).
const COURIERS = ["jne", "jnt", "sicepat", "pos", "sap"];

/** Flag `fallback` ikut di-cache: tanpa itu tarif cadangan yang dibaca dari cache tampak seperti tarif nyata. */
type CachedQuote = { options: ShippingOption[]; fallback: boolean };

/** Tarif perkiraan saat API Komerce tak terjangkau, supaya checkout tetap bisa jalan. */
const FALLBACK_OPTIONS: ShippingOption[] = [
  { courier: "jne",     courierName: "JNE",     service: "REG",  description: "Reguler",           price: 15000, etd: "2-3 hari" },
  { courier: "jne",     courierName: "JNE",     service: "YES",  description: "Yakin Esok Sampai", price: 40000, etd: "1 hari"   },
  { courier: "sicepat", courierName: "SiCepat", service: "BEST", description: "Terbaik",           price: 18000, etd: "2-3 hari" },
  { courier: "jnt",     courierName: "J&T",     service: "EZ",   description: "Reguler",           price: 14000, etd: "2-4 hari" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const destination = searchParams.get("destination")?.trim().toUpperCase();
  const rawWeight = Number(searchParams.get("weight") ?? "1000");
  const weight = Number.isFinite(rawWeight) ? Math.max(1, Math.round(rawWeight)) : 1000;

  if (!destination) {
    return NextResponse.json({ error: "Parameter destination wajib diisi" }, { status: 400 });
  }

  // Semua kegagalan di bawah ini (Redis mati, Komerce mati, kota tak ditemukan)
  // berujung ke tarif cadangan — checkout tidak boleh ikut jatuh.
  const [originId, destinationId] = await Promise.all([
    getOriginId(),
    resolveDestinationId(destination),
  ]);

  const cacheKey = originId && destinationId ? `ongkir:v3:${originId}:${destinationId}:${weight}` : null;

  if (cacheKey) {
    const cached = await cacheGet<CachedQuote>(cacheKey);
    if (cached) {
      return NextResponse.json({ options: cached.options, fromCache: true, fallback: cached.fallback });
    }
  }

  let results: ShippingOption[] = [];
  if (originId && destinationId) {
    const settled = await Promise.allSettled(
      COURIERS.map((c) => calculateCost(originId, destinationId, weight, c)),
    );
    results = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  }

  if (results.length === 0) {
    if (cacheKey) await cacheSet(cacheKey, { options: FALLBACK_OPTIONS, fallback: true } satisfies CachedQuote, FALLBACK_CACHE_TTL);
    return NextResponse.json({ options: FALLBACK_OPTIONS, fromCache: false, fallback: true });
  }

  results.sort((a, b) => a.price - b.price);
  if (cacheKey) await cacheSet(cacheKey, { options: results, fallback: false } satisfies CachedQuote, CACHE_TTL);
  return NextResponse.json({ options: results, fromCache: false, fallback: false });
}
