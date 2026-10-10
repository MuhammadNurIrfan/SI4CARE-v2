/**
 * Dijalankan sekali saat server Next.js start, sebelum menerima request.
 * Dipakai untuk memvalidasi environment (lihat `lib/env.ts`).
 */
export async function register() {
  // Edge runtime tidak memuat env server; build juga tidak perlu divalidasi di sini.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { assertEnv } = await import("./lib/env");
  assertEnv();
}
