import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { requireAdmin } from "@/lib/server-auth";
import { calculateCost, getOriginId, resolveDestinationId } from "@/lib/komerce";

// Admin-only endpoint — GET /api/shipping/test
// Menguji konektivitas Redis dan API Komerce. Sengaja memakai `redis` langsung
// (bukan lib/cache) karena tugasnya melaporkan kegagalan, bukan menelannya.

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

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(process.env.KOMERCE_API_KEY),
    storeOrigin: process.env.KOMERCE_STORE_ORIGIN_ID
      ? `ID ${process.env.KOMERCE_STORE_ORIGIN_ID}`
      : process.env.KOMERCE_STORE_ORIGIN ?? "(default JAKARTA SELATAN)",
  };

  // 1. Redis
  try {
    const ping = await redis.set("__shipping_test__", "ok", { ex: 10 });
    const val = await redis.get("__shipping_test__");
    report.redis = { ok: ping === "OK" && val === "ok" };
  } catch (e) {
    report.redis = { ok: false, error: e instanceof Error ? `${e.message} (${String(e.cause ?? "")})` : String(e) };
  }

  if (!process.env.KOMERCE_API_KEY) {
    report.komerce = { ok: false, error: "KOMERCE_API_KEY tidak dikonfigurasi" };
    return NextResponse.json(report);
  }

  // 2. Asal toko → ID
  const originId = await getOriginId();
  report.originId = originId;
  if (!originId) {
    report.komerce = { ok: false, error: "Asal toko tidak bisa di-resolve ke ID Komerce" };
    return NextResponse.json(report);
  }

  // 3. Satu perhitungan ongkir (JNE ke Bandung)
  try {
    const t0 = Date.now();
    const destId = await resolveDestinationId("BANDUNG");
    if (!destId) throw new Error("tujuan BANDUNG tidak ditemukan");
    const options = await calculateCost(originId, destId, 1000, "jne");
    report.komerce = { ok: options.length > 0, latencyMs: Date.now() - t0, serviceCount: options.length };
  } catch (e) {
    report.komerce = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 4. Cakupan wilayah
  const coverage = await Promise.allSettled(
    TEST_DESTINATIONS.map(async (dest) => {
      const destId = await resolveDestinationId(dest);
      if (!destId) return { destination: dest, ok: false, serviceCount: 0 };
      const options = await calculateCost(originId, destId, 1000, "jne");
      return { destination: dest, ok: options.length > 0, serviceCount: options.length };
    }),
  );

  report.coverage = coverage.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { destination: TEST_DESTINATIONS[i], ok: false, error: r.reason instanceof Error ? r.reason.message : String(r.reason) },
  );
  const covered = (report.coverage as { ok: boolean }[]).filter((c) => c.ok).length;
  report.coverageSummary = `${covered}/${TEST_DESTINATIONS.length} kota tercakup`;

  return NextResponse.json(report);
}
