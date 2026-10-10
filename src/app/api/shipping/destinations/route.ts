import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { searchDestinations } from "@/lib/komerce";

const CACHE_TTL = 60 * 60 * 24 * 7; // 7 hari — data wilayah jarang berubah

export type DestinationResult = {
  id: string;
  label: string; // "BATUNUNGGAL, BANDUNG KIDUL, BANDUNG, JAWA BARAT, 40266"
  city: string;
  province: string;
  postalCode?: string;
};

// Pencarian wilayah untuk autocomplete alamat. Saat ini belum ada pemanggilnya
// di UI; checkout me-resolve nama kota dari alamat langsung lewat `lib/komerce`.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `dest:v2:${q.toUpperCase()}`;
  const cached = await cacheGet<DestinationResult[]>(cacheKey);
  if (cached) return NextResponse.json({ results: cached, fromCache: true });

  try {
    const found = await searchDestinations(q, 15);
    const results: DestinationResult[] = found.map((d) => ({
      id: String(d.id),
      label: d.label,
      city: d.city,
      province: d.province,
      postalCode: d.zipCode || undefined,
    }));
    if (results.length > 0) await cacheSet(cacheKey, results, CACHE_TTL);
    return NextResponse.json({ results, fromCache: false });
  } catch (err) {
    // API tak terjangkau → daftar kosong. Daftar kota statis lama dibuang karena
    // ID palsunya ("jkt-pst", "bdg") tidak valid di API Komerce yang baru.
    console.warn("[shipping/destinations] pencarian gagal:", err instanceof Error ? err.message : err);
    return NextResponse.json({ results: [], fromCache: false, fallback: true });
  }
}
