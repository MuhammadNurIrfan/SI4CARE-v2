import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const KOMERCE_API = "https://merchant-api.komerce.id/api/v1/cost/domestic";
const STORE_ORIGIN = "JAKARTA SELATAN"; // kota asal toko — update sesuai lokasi toko
const CACHE_TTL = 60 * 60 * 24; // 24 jam

export type ShippingOption = {
  courier: string;        // "jne" | "jnt" | "sicepat"
  courierName: string;
  service: string;
  description: string;
  price: number;
  etd: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const destination = searchParams.get("destination")?.trim().toUpperCase();
  const weight = Number(searchParams.get("weight") ?? "1000");

  if (!destination) {
    return NextResponse.json({ error: "Parameter destination wajib diisi" }, { status: 400 });
  }

  const cacheKey = `ongkir:${STORE_ORIGIN}:${destination}:${weight}`;

  // Coba cache Redis dulu
  const cached = await redis.get<ShippingOption[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ options: cached, fromCache: true });
  }

  const couriers = ["jne", "jnt", "sicepat"];
  const results: ShippingOption[] = [];

  await Promise.allSettled(
    couriers.map(async (courier) => {
      try {
        const resp = await fetch(KOMERCE_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.KOMERCE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: STORE_ORIGIN,
            destination,
            weight,
            courier,
          }),
          next: { revalidate: 0 },
        });

        if (!resp.ok) return;

        const json = (await resp.json()) as {
          code: number;
          data?: {
            courier_name: string;
            service_name: string;
            description: string;
            price: number;
            etd: string;
          }[];
        };

        if (json.code === 200 && Array.isArray(json.data)) {
          for (const svc of json.data) {
            results.push({
              courier,
              courierName: svc.courier_name,
              service: svc.service_name,
              description: svc.description,
              price: svc.price,
              etd: svc.etd,
            });
          }
        }
      } catch {
        // Lewati kurir yang gagal — fallback ke yang lain
      }
    }),
  );

  // Fallback: jika semua kurir gagal (Sandbox Komerce mungkin tidak mengembalikan data)
  if (results.length === 0) {
    const fallback: ShippingOption[] = [
      { courier: "jne", courierName: "JNE", service: "REG", description: "Reguler", price: 15000, etd: "2-3 hari" },
      { courier: "jne", courierName: "JNE", service: "YES", description: "Yakin Esok Sampai", price: 40000, etd: "1 hari" },
      { courier: "sicepat", courierName: "SiCepat", service: "BEST", description: "Terbaik", price: 18000, etd: "2-3 hari" },
    ];
    // Cache fallback lebih pendek (1 jam) agar segera retry saat API aktif
    await redis.set(cacheKey, fallback, { ex: 3600 });
    return NextResponse.json({ options: fallback, fromCache: false, fallback: true });
  }

  // Urutkan berdasarkan harga
  results.sort((a, b) => a.price - b.price);
  await redis.set(cacheKey, results, { ex: CACHE_TTL });

  return NextResponse.json({ options: results, fromCache: false });
}
