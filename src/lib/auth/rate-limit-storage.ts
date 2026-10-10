import type { BetterAuthOptions } from "better-auth";
import { redis } from "@/lib/redis";
import { isRedisUsable, reportRedisFailure, withTimeout } from "@/lib/cache";

/**
 * Storage rate-limit Better Auth di Redis (Upstash).
 *
 * Memori proses saja tidak cukup di serverless: tiap instance punya hitungan
 * sendiri dan hilang saat instance berhenti, jadi pelaku bisa menyebar percobaan
 * ke banyak instance. Redis membuat hitungan bersama.
 *
 * Kebijakan saat Redis tidak tersedia: jatuh ke penghitung di memori, BUKAN
 * fail-open penuh (brute-force lolos) dan BUKAN fail-closed (semua orang
 * terkunci). Proteksinya turun jadi per-instance, tapi tidak hilang.
 */

type Storage = NonNullable<NonNullable<BetterAuthOptions["rateLimit"]>["customStorage"]>;
type Rule = { window: number; max: number };
type Decision = { allowed: boolean; retryAfter: number | null };
type RateLimitRecord = NonNullable<Awaited<ReturnType<Storage["get"]>>>;

const PREFIX = "rl:";
const memory = new Map<string, { count: number; resetAt: number }>();
const legacy = new Map<string, RateLimitRecord>();

function consumeInMemory(key: string, { window, max }: Rule): Decision {
  const now = Date.now();
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
  }
  const cur = memory.get(key);
  if (!cur || cur.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + window * 1000 });
    return { allowed: true, retryAfter: null };
  }
  cur.count += 1;
  if (cur.count > max) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfter: null };
}

async function consumeInRedis(key: string, { window, max }: Rule): Promise<Decision> {
  const k = PREFIX + key;
  const count = await withTimeout(redis.incr(k));
  // Jendela dibuka oleh request pertama. Kalau proses mati di antara INCR dan EXPIRE,
  // key tak punya TTL dan pengguna terkunci selamanya — dicek ulang di jalur blokir.
  if (count === 1) await withTimeout(redis.expire(k, window));
  if (count <= max) return { allowed: true, retryAfter: null };

  let ttl = await withTimeout(redis.ttl(k));
  if (ttl < 0) {
    await withTimeout(redis.expire(k, window));
    ttl = window;
  }
  return { allowed: false, retryAfter: ttl };
}

export function createRateLimitStorage(): Storage {
  return {
    async consume(key, rule) {
      // Breaker terbuka / Redis belum dikonfigurasi → langsung penghitung memori, tanpa menunggu timeout.
      if (!isRedisUsable()) return consumeInMemory(key, rule);
      try {
        return await consumeInRedis(key, rule);
      } catch (err) {
        reportRedisFailure("rate-limit (memakai penghitung memori)", err);
        return consumeInMemory(key, rule);
      }
    },
    // Jalur lama non-atomik; tidak dipakai Better Auth karena `consume` tersedia.
    // Tetap diisi karena tipe `customStorage` mewajibkannya.
    async get(key) {
      return legacy.get(key) ?? null;
    },
    async set(key, value) {
      legacy.set(key, value);
    },
  };
}
