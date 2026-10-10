import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { limitConcurrency } from "./limit-concurrency";

/**
 * Klien PostgreSQL (Supabase).
 *
 * Batas koneksi penting di sini. Pooler Supabase mode SESSION (port 5432) hanya mengizinkan 15
 * klien untuk seluruh proyek; tanpa `max`, postgres-js membuka 10 koneksi per proses sehingga satu
 * dev server + satu skrip uji sudah menghabiskannya (`EMAXCONNSESSION`). Di Vercel setiap instance
 * serverless membawa koneksinya sendiri, jadi kuota itu habis dengan sedikit trafik. Untuk production
 * pakai pooler mode TRANSAKSI (port 6543) — lihat .env.example — dan koneksi per instance dibuat kecil.
 *
 * `prepare: false` wajib untuk pooler mode transaksi (tidak mendukung prepared statement).
 */

const isProd = process.env.NODE_ENV === "production";
const poolMax = Number(process.env.DATABASE_POOL_MAX) || (isProd ? 3 : 5);

function createClient() {
  const raw = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    ssl: "require", // Supabase mewajibkan SSL
    max: poolMax,
    idle_timeout: 20, // detik — lepas koneksi menganggur agar tidak menahan kuota pooler
    connect_timeout: 10,
  });
  // Jumlah query aktif dibatasi = jumlah koneksi → tak ada pipelining. Pooler mode transaksi (port 6543)
  // menggantung bila satu koneksi diberi banyak query berbeda sekaligus; lihat limit-concurrency.ts.
  return limitConcurrency(raw, poolMax);
}

// Di development modul ini dievaluasi ulang tiap hot-reload; tanpa cache global, setiap reload
// membuat klien baru dan klien lama tak pernah ditutup → koneksi bocor sampai kuota habis.
const globalForDb = globalThis as unknown as { __si4careSql?: ReturnType<typeof postgres> };
const client = globalForDb.__si4careSql ?? createClient();
if (!isProd) globalForDb.__si4careSql = client;

export const db = drizzle(client, { schema });
