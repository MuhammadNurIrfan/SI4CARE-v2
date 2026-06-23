import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { requireAdmin } from "@/lib/server-auth";

// Admin-only endpoint — GET /api/shipping/test
// Menguji konektivitas Komerce API dan Redis cache

const KOMERCE_BASE = "https://merchant-api.komerce.id/api/v1";
const STORE_ORIGIN = (process.env.KOMERCE_STORE_ORIGIN ?? "JAKARTA SELATAN").toUpperCase();

const TEST_DESTINATIONS = [
  "BANDUNG",
  "SURABAYA",
  "MEDAN",
  "MAKASSAR",
  "DENPASAR",
  "YOGYAKARTA",
  "SEMARANG",
];

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const apiKey = process.env.KOMERCE_API_KEY;
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    storeOrigin: STORE_ORIGIN,
    apiKeyConfigured: !!apiKey,
  };

  // 1. Cek Redis
  try {
    const ping = await redis.set("__shipping_test__", "ok", { ex: 10 });
    const val = await redis.get("__shipping_test__");
    report.redis = { ok: ping === "OK" && val === "ok" };
  } catch (e) {
    report.redis = { ok: false, error: String(e) };
  }

  if (!apiKey) {
    report.komerce = { ok: false, error: "KOMERCE_API_KEY tidak dikonfigurasi" };
    return NextResponse.json(report);
  }

  // 2. Cek satu call Komerce API (JNE ke Bandung)
  try {
    const t0 = Date.now();
    const resp = await fetch(`${KOMERCE_BASE}/cost/domestic`, {
      method: "POST",
      headers: { key: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: STORE_ORIGIN,
        destination: "BANDUNG",
        weight: 1000,
        courier: "jne",
      }),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
    });
    const latencyMs = Date.now() - t0;
    const json = (await resp.json()) as { meta?: { code?: number }; code?: number; data?: unknown };
    const httpStatus = resp.status;
    const apiCode = json.meta?.code ?? json.code;
    report.komerce = {
      ok: resp.ok && apiCode === 200,
      httpStatus,
      apiCode,
      latencyMs,
      hasData: Array.isArray(json.data) ? (json.data as unknown[]).length > 0 : false,
    };
  } catch (e) {
    report.komerce = { ok: false, error: String(e) };
  }

  // 3. Cek cakupan wilayah — uji beberapa kota serentak
  const coverageResults = await Promise.allSettled(
    TEST_DESTINATIONS.map(async (dest) => {
      const resp = await fetch(`${KOMERCE_BASE}/cost/domestic`, {
        method: "POST",
        headers: { key: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ origin: STORE_ORIGIN, destination: dest, weight: 1000, courier: "jne" }),
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 0 },
      });
      const json = (await resp.json()) as { meta?: { code?: number }; code?: number; data?: unknown[] };
      const apiCode = json.meta?.code ?? json.code;
      return {
        destination: dest,
        ok: resp.ok && apiCode === 200 && Array.isArray(json.data) && json.data.length > 0,
        httpStatus: resp.status,
        serviceCount: Array.isArray(json.data) ? json.data.length : 0,
      };
    }),
  );

  report.coverage = coverageResults.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { destination: TEST_DESTINATIONS[i], ok: false, error: r.reason },
  );

  const coveredCount = (report.coverage as { ok: boolean }[]).filter((c) => c.ok).length;
  report.coverageSummary = `${coveredCount}/${TEST_DESTINATIONS.length} kota tercakup`;

  return NextResponse.json(report);
}
