import { z } from "zod";

/**
 * Validasi environment saat server start (dipanggil dari `src/instrumentation.ts`).
 *
 * Latar belakang: 5 kredensial pernah kosong di `.env.local` dan tidak ada yang
 * mengeluh — `midtrans.ts` fallback ke `?? ""` dan `redis.ts` memakai `!`, jadi
 * kerusakan baru muncul di tengah checkout. Modul ini membuat masalah itu terlihat
 * di awal, dengan pesan yang menunjuk variabel mana dan kenapa penting.
 *
 * Tiga tingkat:
 *  - error   : aplikasi tidak bisa berfungsi benar. Di production → server menolak start.
 *  - warning : fitur tertentu turun kualitas / nonaktif, tapi aplikasi tetap jalan.
 *  - (diam)  : sehat.
 *
 * Fungsi inti `validateEnv` murni (menerima objek env) supaya bisa diuji unit.
 * Tidak mengimpor apa pun selain zod — tidak ada alias `@/`.
 */

export type EnvIssue = { name: string; message: string };
export type EnvReport = { errors: EnvIssue[]; warnings: EnvIssue[] };
type EnvLike = Record<string, string | undefined>;

const blank = (v: string | undefined) => v === undefined || v.trim() === "";

const postgresUrl = z.string().regex(/^postgres(ql)?:\/\//, "harus berupa connection string PostgreSQL (diawali postgresql://)");
const authSecret = z.string().min(32, "minimal 32 karakter — generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
const httpUrl = z.url({ protocol: /^https?$/, error: "harus URL lengkap (https://...)" });

export function validateEnv(env: EnvLike, nodeEnv: string = env.NODE_ENV ?? "development"): EnvReport {
  const errors: EnvIssue[] = [];
  const warnings: EnvIssue[] = [];
  const isProd = nodeEnv === "production";

  const error = (name: string, message: string) => errors.push({ name, message });
  const warn = (name: string, message: string) => warnings.push({ name, message });

  /** Wajib ada DAN lolos skema. */
  const required = (name: string, schema: z.ZodType<string>, why: string) => {
    if (blank(env[name])) return error(name, `kosong — ${why}`);
    const r = schema.safeParse(env[name]);
    if (!r.success) error(name, r.error.issues[0]?.message ?? "tidak valid");
  };

  // ── Selalu wajib ────────────────────────────────────────────────────────────
  required("DATABASE_URL", postgresUrl, "tanpa database seluruh aplikasi tidak jalan");
  // Pooler Supabase mode SESSION (port 5432) hanya mengizinkan 15 klien untuk seluruh proyek; di serverless
  // (tiap instance membawa koneksinya sendiri) kuota itu habis dan situs error. Production butuh mode transaksi (6543).
  if (isProd && /pooler\.supabase\.com:5432\b/.test(env.DATABASE_URL ?? "")) {
    warn("DATABASE_URL", "memakai pooler mode SESSION (port 5432) — di production/serverless gunakan mode TRANSAKSI (port 6543) agar tidak kehabisan koneksi (EMAXCONNSESSION).");
  }

  required("BETTER_AUTH_SECRET", authSecret, "dipakai menandatangani sesi login");
  required("BETTER_AUTH_URL", httpUrl, "dipakai untuk redirect & cookie auth");

  if (!blank(env.BETTER_AUTH_URL) && isProd && /\/\/(localhost|127\.0\.0\.1)/.test(env.BETTER_AUTH_URL!)) {
    error("BETTER_AUTH_URL", "masih mengarah ke localhost di production — redirect login akan rusak. Isi dengan domain publik.");
  }

  // ── Pembayaran: tanpa ini checkout mati ─────────────────────────────────────
  required("MIDTRANS_SERVER_KEY", z.string(), "tanpa ini checkout tidak bisa membuat transaksi");
  required("MIDTRANS_CLIENT_KEY", z.string(), "tanpa ini widget pembayaran tidak termuat");

  // Kunci sandbox ("SB-Mid-...") dan production ("Mid-...") tidak saling kompatibel.
  const midtransProd = env.MIDTRANS_IS_PRODUCTION === "true";
  for (const name of ["MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY"]) {
    const v = env[name];
    if (blank(v)) continue;
    const isSandboxKey = v!.startsWith("SB-");
    if (midtransProd && isSandboxKey) error(name, "kunci Sandbox (SB-...) tapi MIDTRANS_IS_PRODUCTION=true — Midtrans akan menolak (401).");
    if (!midtransProd && !isSandboxKey) error(name, "kunci Production tapi MIDTRANS_IS_PRODUCTION bukan 'true' — Midtrans akan menolak (401).");
  }
  if (isProd && !midtransProd) {
    warn("MIDTRANS_IS_PRODUCTION", "production berjalan dengan Midtrans Sandbox — pembayaran tidak nyata (wajar untuk demo).");
  }

  // ── URL publik situs: dipakai untuk canonical, OpenGraph, dan JSON-LD artikel ──
  // Kode punya fallback hardcoded ke domain lain; tanpa variabel ini SEO menunjuk ke situs yang salah.
  if (blank(env.NEXT_PUBLIC_SITE_URL)) {
    if (isProd) warn("NEXT_PUBLIC_SITE_URL", "kosong — URL kanonik & OpenGraph artikel memakai domain bawaan di kode, bukan domain situs ini.");
  } else if (!httpUrl.safeParse(env.NEXT_PUBLIC_SITE_URL).success) {
    error("NEXT_PUBLIC_SITE_URL", "harus URL lengkap (https://...)");
  }

  // ── Redis (cache + rate-limit): aplikasi tetap jalan tanpanya ───────────────
  const hasRedisUrl = !blank(env.UPSTASH_REDIS_REST_URL);
  const hasRedisToken = !blank(env.UPSTASH_REDIS_REST_TOKEN);
  if (hasRedisUrl !== hasRedisToken) {
    error(hasRedisUrl ? "UPSTASH_REDIS_REST_TOKEN" : "UPSTASH_REDIS_REST_URL", "URL dan token Upstash harus diisi berpasangan.");
  } else if (!hasRedisUrl) {
    warn("UPSTASH_REDIS_REST_URL", "kosong — cache ongkir dan rate-limit login nonaktif (aplikasi tetap jalan).");
  } else if (!httpUrl.safeParse(env.UPSTASH_REDIS_REST_URL).success) {
    error("UPSTASH_REDIS_REST_URL", "harus URL lengkap (https://...upstash.io)");
  }

  // ── Ongkir ──────────────────────────────────────────────────────────────────
  if (blank(env.KOMERCE_API_KEY)) {
    warn("KOMERCE_API_KEY", "kosong — ongkir memakai tarif cadangan, bukan tarif kurir nyata.");
  }
  if (!blank(env.KOMERCE_STORE_ORIGIN_ID) && !/^\d+$/.test(env.KOMERCE_STORE_ORIGIN_ID!.trim())) {
    error("KOMERCE_STORE_ORIGIN_ID", "harus angka (ID wilayah dari pencarian Komerce).");
  }

  // ── Penyimpanan foto (R2): konfigurasi separuh lebih berbahaya daripada kosong ─
  // Yang menandakan R2 "sedang dikonfigurasi" hanya kredensialnya. R2_BUCKET_NAME saja
  // tidak dihitung: nilainya sudah terisi di template, dan menganggapnya konfigurasi
  // akan membuat deploy menolak start hanya karena .env.local ditempel utuh ke Vercel.
  const r2Keys = ["R2_ENDPOINT", "R2_ACCESS_KEY", "R2_SECRET_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"] as const;
  const r2Credentials = ["R2_ENDPOINT", "R2_ACCESS_KEY", "R2_SECRET_KEY"] as const;
  const r2Started = r2Credentials.some((k) => !blank(env[k]));
  if (r2Started) {
    const missing = r2Keys.filter((k) => blank(env[k]));
    if (missing.length > 0) {
      error(missing[0], `konfigurasi R2 separuh — masih kosong: ${missing.join(", ")}. Upload foto akan gagal.`);
    }
  } else if (isProd) {
    warn("R2_ENDPOINT", "R2 belum dikonfigurasi — upload foto dinonaktifkan di production (disk Vercel tidak bisa ditulis).");
  }

  return { errors, warnings };
}

function formatReport(report: EnvReport): string {
  const line = (i: EnvIssue) => `   • ${i.name}: ${i.message}`;
  return [
    report.errors.length ? `ERROR (${report.errors.length}):\n${report.errors.map(line).join("\n")}` : "",
    report.warnings.length ? `PERINGATAN (${report.warnings.length}):\n${report.warnings.map(line).join("\n")}` : "",
  ].filter(Boolean).join("\n");
}

/**
 * Dipanggil sekali saat server start. Production + ada error → melempar, sehingga
 * deploy yang salah konfigurasi gagal dengan pesan jelas, bukan rusak diam-diam di
 * tengah checkout. Di development hanya dicetak, supaya bisa kerja tanpa semua layanan.
 */
export function assertEnv(env: EnvLike = process.env): EnvReport {
  const report = validateEnv(env);
  if (report.errors.length === 0 && report.warnings.length === 0) return report;

  const body = formatReport(report);
  if (report.errors.length > 0 && (env.NODE_ENV ?? "development") === "production") {
    throw new Error(`Konfigurasi environment tidak valid — server menolak start.\n${body}\nLihat .env.example.`);
  }
  console.warn(`\n[env] Konfigurasi environment bermasalah:\n${body}\n`);
  return report;
}
