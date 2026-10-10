import { redis } from "@/lib/redis";

/**
 * Cache Redis yang TIDAK PERNAH melempar error.
 *
 * Cache hanya optimasi — kalau Redis mati, lambat, atau belum dikonfigurasi,
 * jalur transaksi (ongkir, checkout) harus tetap jalan dengan menganggap cache
 * kosong. Sebelumnya `redis.get()` dipanggil tanpa try/catch di route ongkir,
 * sehingga database Upstash yang sudah dihapus (ENOTFOUND) membuat checkout
 * HTTP 500 — padahal tabel ongkir cadangan sudah ada dan tidak pernah tercapai.
 *
 * Kode yang butuh Redis sebagai FITUR (bukan optimasi), mis. rate-limit login,
 * boleh memakai `redis` langsung dan memutuskan sendiri kebijakan gagalnya.
 */

const OP_TIMEOUT_MS = 1500;
const WARN_EVERY_MS = 60_000;

let lastWarnAt = 0;

/**
 * Circuit breaker: setelah satu kegagalan Redis, lewati Redis selama BREAKER_MS. Tanpa ini setiap request
 * menunggu timeout 1,5 detik LAGI sebelum jatuh ke fallback — Redis yang mati di production membuat tiap
 * login/ongkir 1,5 detik lebih lambat dan membanjiri log.
 */
const BREAKER_MS = 30_000;
let downUntil = 0;

export function isCacheConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** Dikonfigurasi DAN belum dinyatakan mati oleh breaker. */
export function isRedisUsable(): boolean {
  return isCacheConfigured() && Date.now() >= downUntil;
}

/** Catat kegagalan Redis: buka breaker + log (dibatasi 1x/menit). */
export function reportRedisFailure(op: string, err: unknown) {
  downUntil = Date.now() + BREAKER_MS;
  warn(op, err);
}

function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause instanceof Error ? ` (${err.cause.message})` : "";
  return `${err.message}${cause}`;
}

/** Log dibatasi 1x/menit agar Redis yang mati tidak membanjiri log tiap request. */
function warn(op: string, err: unknown) {
  const now = Date.now();
  if (now - lastWarnAt < WARN_EVERY_MS) return;
  lastWarnAt = now;
  console.warn(`[cache] Redis ${op} gagal — lanjut tanpa cache: ${describe(err)}`);
}

/** Batasi operasi Redis agar Redis yang menggantung tidak ikut menggantungkan request. */
export function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout ${OP_TIMEOUT_MS}ms`)), OP_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisUsable()) return null;
  try {
    return await withTimeout(redis.get<T>(key));
  } catch (err) {
    reportRedisFailure("get", err);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!isRedisUsable()) return;
  try {
    await withTimeout(redis.set(key, value, { ex: ttlSeconds }));
  } catch (err) {
    reportRedisFailure("set", err);
  }
}
