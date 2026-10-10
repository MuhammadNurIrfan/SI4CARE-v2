import { describe, it, expect } from "vitest";
import type { Sql } from "postgres";
import { limitConcurrency } from "../db/limit-concurrency";

/** Klien palsu: mencatat berapa query yang aktif bersamaan. */
function fakeClient(delayMs = 5) {
  const stats = { active: 0, peak: 0, calls: 0 };
  const exec = async (v: unknown) => {
    stats.active++; stats.peak = Math.max(stats.peak, stats.active); stats.calls++;
    await new Promise((r) => setTimeout(r, delayMs));
    stats.active--;
    return v;
  };
  const client = {
    // Lazy seperti query postgres-js asli: baru dieksekusi saat di-await atau .values() dipanggil.
    unsafe: (q: string) => ({
      then: (ok: (v: unknown) => unknown, err?: (e: unknown) => unknown) => exec([q]).then(ok, err),
      values: () => exec([[q]]),
    }),
    begin: async (cb: (tx: unknown) => Promise<unknown>) => { stats.active++; stats.peak = Math.max(stats.peak, stats.active); stats.calls++; try { return await cb({}); } finally { stats.active--; } },
    other: "dipertahankan",
  };
  return { client: client as unknown as Sql, stats };
}

describe("limitConcurrency", () => {
  it("tidak pernah melebihi batas walau 30 query dilepas serentak", async () => {
    const { client, stats } = fakeClient();
    const limited = limitConcurrency(client, 3);
    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => limited.unsafe(`q${i}`)));
    expect(results).toHaveLength(30);
    expect(stats.calls).toBe(30);
    expect(stats.peak).toBeLessThanOrEqual(3);
  });

  it("jalur .values() ikut dibatasi dan mengembalikan nilai", async () => {
    const { client, stats } = fakeClient();
    const limited = limitConcurrency(client, 2);
    const out = await Promise.all(Array.from({ length: 10 }, (_, i) => limited.unsafe(`q${i}`).values()));
    expect(out[3]).toEqual([["q3"]]);
    expect(stats.peak).toBeLessThanOrEqual(2);
  });

  it("transaksi (begin) menghitung satu slot", async () => {
    const { client, stats } = fakeClient(10);
    const limited = limitConcurrency(client, 2);
    await Promise.all([
      limited.begin(async () => { await new Promise((r) => setTimeout(r, 30)); return 1; }),
      ...Array.from({ length: 6 }, (_, i) => limited.unsafe(`q${i}`)),
    ]);
    expect(stats.peak).toBeLessThanOrEqual(2);
  });

  it("slot dilepas saat query gagal — tidak ada deadlock", async () => {
    let n = 0;
    const client = { unsafe: () => ({ then: (ok: (v: unknown) => void, err: (e: unknown) => void) => (++n <= 2 ? err(new Error("boom")) : ok(["ok"])) , values: () => Promise.resolve([]) }) } as unknown as Sql;
    const limited = limitConcurrency(client, 1);
    const settled = await Promise.allSettled([limited.unsafe("a"), limited.unsafe("b"), limited.unsafe("c")]);
    expect(settled.map((s) => s.status)).toEqual(["rejected", "rejected", "fulfilled"]);
  });

  it("query tidak dieksekusi sebelum di-await (lazy, seperti postgres-js)", async () => {
    const { client, stats } = fakeClient();
    const limited = limitConcurrency(client, 2);
    limited.unsafe("tidak-di-await");
    await new Promise((r) => setTimeout(r, 20));
    expect(stats.calls).toBe(0);
  });

  it("properti lain klien tetap bisa diakses", () => {
    const { client } = fakeClient();
    expect((limitConcurrency(client, 2) as unknown as { other: string }).other).toBe("dipertahankan");
  });
});
