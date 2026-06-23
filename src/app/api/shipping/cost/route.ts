import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const KOMERCE_BASE = "https://merchant-api.komerce.id/api/v1";
const STORE_ORIGIN = (process.env.KOMERCE_STORE_ORIGIN ?? "JAKARTA SELATAN").toUpperCase();
const CACHE_TTL = 60 * 60 * 24; // 24 jam
const FALLBACK_CACHE_TTL = 60 * 60; // 1 jam — retry lebih cepat

export type ShippingOption = {
  courier: string;
  courierName: string;
  service: string;
  description: string;
  price: number;
  etd: string;
};

type KomerceService = {
  courier_name?: string;
  service_name?: string;
  service?: string;
  description?: string;
  price?: number;
  cost?: { value?: number }[];
  etd?: string;
};

type KomerceResponse = {
  meta?: { code?: number; message?: string };
  code?: number;
  data?: KomerceService[] | { cost?: KomerceService[] };
};

function parseKomerceResponse(json: KomerceResponse, courier: string): ShippingOption[] {
  const code = json.meta?.code ?? json.code;
  if (code !== 200) return [];

  // Format A: data adalah array langsung
  const list: KomerceService[] = Array.isArray(json.data)
    ? json.data
    : // Format B: data.cost adalah array
      Array.isArray((json.data as { cost?: KomerceService[] })?.cost)
      ? ((json.data as { cost?: KomerceService[] }).cost ?? [])
      : [];

  return list.map((svc) => ({
    courier,
    courierName: svc.courier_name ?? courier.toUpperCase(),
    service: svc.service_name ?? svc.service ?? "-",
    description: svc.description ?? "-",
    price: svc.price ?? svc.cost?.[0]?.value ?? 0,
    etd: svc.etd ?? "-",
  }));
}

async function fetchCourier(
  courier: string,
  destination: string,
  weight: number,
): Promise<ShippingOption[]> {
  const key = process.env.KOMERCE_API_KEY;
  if (!key) return [];

  const resp = await fetch(`${KOMERCE_BASE}/cost/domestic`, {
    method: "POST",
    headers: {
      key,
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

  if (!resp.ok) return [];
  const json = (await resp.json()) as KomerceResponse;
  return parseKomerceResponse(json, courier);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const destination = searchParams.get("destination")?.trim().toUpperCase();
  const weight = Math.max(1, Number(searchParams.get("weight") ?? "1000"));

  if (!destination) {
    return NextResponse.json({ error: "Parameter destination wajib diisi" }, { status: 400 });
  }

  const cacheKey = `ongkir:v2:${STORE_ORIGIN}:${destination}:${weight}`;

  const cached = await redis.get<ShippingOption[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ options: cached, fromCache: true });
  }

  const couriers = ["jne", "jnt", "sicepat", "pos"];
  const settled = await Promise.allSettled(
    couriers.map((c) => fetchCourier(c, destination, weight)),
  );

  const results: ShippingOption[] = settled.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );

  if (results.length === 0) {
    const fallback: ShippingOption[] = [
      { courier: "jne",     courierName: "JNE",     service: "REG",  description: "Reguler",          price: 15000, etd: "2-3 hari" },
      { courier: "jne",     courierName: "JNE",     service: "YES",  description: "Yakin Esok Sampai", price: 40000, etd: "1 hari"   },
      { courier: "sicepat", courierName: "SiCepat", service: "BEST", description: "Terbaik",           price: 18000, etd: "2-3 hari" },
      { courier: "jnt",     courierName: "J&T",     service: "EZ",   description: "Reguler",           price: 14000, etd: "2-4 hari" },
    ];
    await redis.set(cacheKey, fallback, { ex: FALLBACK_CACHE_TTL });
    return NextResponse.json({ options: fallback, fromCache: false, fallback: true });
  }

  results.sort((a, b) => a.price - b.price);
  await redis.set(cacheKey, results, { ex: CACHE_TTL });
  return NextResponse.json({ options: results, fromCache: false, fallback: false });
}
