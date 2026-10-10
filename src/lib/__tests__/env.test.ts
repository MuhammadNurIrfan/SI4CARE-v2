import { describe, it, expect, vi } from "vitest";
import { validateEnv, assertEnv } from "../env";

/** Konfigurasi lengkap & sehat — tiap test mengubah satu hal saja dari sini. */
const GOOD = {
  DATABASE_URL: "postgresql://user:pw@host:5432/postgres",
  BETTER_AUTH_SECRET: "a".repeat(64),
  BETTER_AUTH_URL: "https://si4care.example.com",
  MIDTRANS_SERVER_KEY: "SB-Mid-server-xxxx",
  MIDTRANS_CLIENT_KEY: "SB-Mid-client-xxxx",
  MIDTRANS_IS_PRODUCTION: "false",
  UPSTASH_REDIS_REST_URL: "https://x.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  KOMERCE_API_KEY: "key",
  R2_ENDPOINT: "https://acc.r2.cloudflarestorage.com",
  R2_ACCESS_KEY: "ak",
  R2_SECRET_KEY: "sk",
  R2_BUCKET_NAME: "bucket",
  R2_PUBLIC_URL: "https://cdn.example.com",
};

const names = (items: { name: string }[]) => items.map((i) => i.name);

describe("validateEnv", () => {
  it("konfigurasi lengkap → tanpa error", () => {
    const r = validateEnv(GOOD, "production");
    expect(r.errors).toEqual([]);
  });

  it("kredensial Midtrans kosong → error (kasus nyata yang dulu lolos diam-diam)", () => {
    const r = validateEnv({ ...GOOD, MIDTRANS_SERVER_KEY: "", MIDTRANS_CLIENT_KEY: undefined });
    expect(names(r.errors)).toEqual(expect.arrayContaining(["MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY"]));
  });

  it("nilai hanya spasi dianggap kosong", () => {
    const r = validateEnv({ ...GOOD, DATABASE_URL: "   " });
    expect(names(r.errors)).toContain("DATABASE_URL");
  });

  it("DATABASE_URL bukan PostgreSQL (mis. sisa MySQL) → error", () => {
    const r = validateEnv({ ...GOOD, DATABASE_URL: "mysql://root@localhost:3307/db" });
    expect(names(r.errors)).toContain("DATABASE_URL");
  });

  it("BETTER_AUTH_SECRET terlalu pendek → error", () => {
    const r = validateEnv({ ...GOOD, BETTER_AUTH_SECRET: "pendek" });
    expect(names(r.errors)).toContain("BETTER_AUTH_SECRET");
  });

  it("BETTER_AUTH_URL localhost: error di production, boleh di development", () => {
    const env = { ...GOOD, BETTER_AUTH_URL: "http://localhost:3000" };
    expect(names(validateEnv(env, "production").errors)).toContain("BETTER_AUTH_URL");
    expect(names(validateEnv(env, "development").errors)).not.toContain("BETTER_AUTH_URL");
  });

  it("kunci Sandbox tapi mode production → error", () => {
    const r = validateEnv({ ...GOOD, MIDTRANS_IS_PRODUCTION: "true" });
    expect(names(r.errors)).toEqual(expect.arrayContaining(["MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY"]));
  });

  it("kunci Production tapi mode sandbox → error", () => {
    const r = validateEnv({ ...GOOD, MIDTRANS_SERVER_KEY: "Mid-server-xxxx", MIDTRANS_CLIENT_KEY: "Mid-client-xxxx" });
    expect(names(r.errors)).toEqual(expect.arrayContaining(["MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY"]));
  });

  it("production dengan Midtrans Sandbox → hanya peringatan, bukan error", () => {
    const r = validateEnv(GOOD, "production");
    expect(names(r.warnings)).toContain("MIDTRANS_IS_PRODUCTION");
    expect(r.errors).toEqual([]);
  });

  it("Redis kosong → peringatan (aplikasi tetap jalan), bukan error", () => {
    const r = validateEnv({ ...GOOD, UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" });
    expect(r.errors).toEqual([]);
    expect(names(r.warnings)).toContain("UPSTASH_REDIS_REST_URL");
  });

  it("Redis terisi separuh → error", () => {
    const r = validateEnv({ ...GOOD, UPSTASH_REDIS_REST_TOKEN: "" });
    expect(names(r.errors)).toContain("UPSTASH_REDIS_REST_TOKEN");
  });

  it("production + pooler Supabase mode session (5432) → peringatan; port 6543 → bersih", () => {
    const session = { ...GOOD, DATABASE_URL: "postgresql://u:p@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" };
    const tx = { ...GOOD, DATABASE_URL: "postgresql://u:p@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" };
    expect(names(validateEnv(session, "production").warnings)).toContain("DATABASE_URL");
    expect(names(validateEnv(tx, "production").warnings)).not.toContain("DATABASE_URL");
    expect(names(validateEnv(session, "development").warnings)).not.toContain("DATABASE_URL");
  });

  it("NEXT_PUBLIC_SITE_URL kosong → peringatan di production saja; tidak valid → error", () => {
    expect(names(validateEnv(GOOD, "production").warnings)).toContain("NEXT_PUBLIC_SITE_URL");
    expect(names(validateEnv(GOOD, "development").warnings)).not.toContain("NEXT_PUBLIC_SITE_URL");
    expect(names(validateEnv({ ...GOOD, NEXT_PUBLIC_SITE_URL: "bukan-url" }).errors)).toContain("NEXT_PUBLIC_SITE_URL");
    expect(validateEnv({ ...GOOD, NEXT_PUBLIC_SITE_URL: "https://toko.example.com" }, "production").warnings.map((w) => w.name)).not.toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("KOMERCE_API_KEY kosong → peringatan", () => {
    const r = validateEnv({ ...GOOD, KOMERCE_API_KEY: "" });
    expect(r.errors).toEqual([]);
    expect(names(r.warnings)).toContain("KOMERCE_API_KEY");
  });

  it("KOMERCE_STORE_ORIGIN_ID bukan angka → error", () => {
    const r = validateEnv({ ...GOOD, KOMERCE_STORE_ORIGIN_ID: "jakarta" });
    expect(names(r.errors)).toContain("KOMERCE_STORE_ORIGIN_ID");
  });

  it("R2 terisi separuh → error (lebih berbahaya daripada kosong)", () => {
    const r = validateEnv({ ...GOOD, R2_PUBLIC_URL: "" });
    expect(r.errors[0]?.message).toContain("R2_PUBLIC_URL");
  });

  it("hanya R2_BUCKET_NAME terisi (sisa template) → bukan konfigurasi separuh", () => {
    const r = validateEnv({ ...GOOD, R2_ENDPOINT: "", R2_ACCESS_KEY: "", R2_SECRET_KEY: "", R2_PUBLIC_URL: "" }, "production");
    expect(r.errors).toEqual([]);
    expect(names(r.warnings)).toContain("R2_ENDPOINT");
  });

  it("R2 kosong total: peringatan di production, diam di development", () => {
    const noR2 = { ...GOOD, R2_ENDPOINT: "", R2_ACCESS_KEY: "", R2_SECRET_KEY: "", R2_BUCKET_NAME: "", R2_PUBLIC_URL: "" };
    expect(names(validateEnv(noR2, "production").warnings)).toContain("R2_ENDPOINT");
    expect(names(validateEnv(noR2, "development").warnings)).not.toContain("R2_ENDPOINT");
  });
});

describe("assertEnv", () => {
  it("production + error → melempar dengan nama variabel di pesan", () => {
    const env = { ...GOOD, NODE_ENV: "production", MIDTRANS_SERVER_KEY: "" };
    expect(() => assertEnv(env)).toThrow(/MIDTRANS_SERVER_KEY/);
  });

  it("development + error → tidak melempar, hanya mencetak peringatan", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const env = { ...GOOD, NODE_ENV: "development", MIDTRANS_SERVER_KEY: "" };
    expect(() => assertEnv(env)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("production + hanya peringatan → tidak melempar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const env = { ...GOOD, NODE_ENV: "production", KOMERCE_API_KEY: "" };
    expect(() => assertEnv(env)).not.toThrow();
    warn.mockRestore();
  });
});
