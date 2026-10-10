import type { Sql } from "postgres";

/**
 * Batasi jumlah query yang berjalan bersamaan ke jumlah koneksi — sehingga setiap koneksi hanya
 * mengerjakan SATU query pada satu waktu dan `postgres-js` tak pernah mem-pipeline.
 *
 * Kenapa perlu: pooler Supabase mode TRANSAKSI (Supavisor, port 6543) — mode yang dibutuhkan serverless —
 * menggantung selamanya bila sebuah koneksi diberi beberapa query berbeda sekaligus. Direproduksi dengan klien
 * `postgres` mentah (tanpa Drizzle): 15 query bersamaan dengan `max: 1` atau `max: 5` → timeout, sedangkan
 * `await` berurutan lolos; muncul mulai ±11 query, kadang lebih sedikit. `max_pipeline: 1` TIDAK menolong:
 * kodenya `sent.length < max_pipeline` dievaluasi setelah query pertama aktif, jadi minimal 2 query tetap
 * terbang. Dashboard & laporan memakai `Promise.all` belasan query, jadi di Vercel akan menggantung.
 *
 * Yang dibungkus hanya `unsafe` (dipakai Drizzle untuk semua query) dan `begin` (transaksi mengikat satu koneksi
 * selama berlangsung, jadi menghitung satu slot). Query DI DALAM transaksi berjalan berurutan pada koneksi itu.
 */
export function limitConcurrency<T extends Sql>(client: T, max: number): T {
  let active = 0;
  const waiters: Array<() => void> = [];

  const acquire = (): Promise<void> => {
    if (active < max) {
      active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => waiters.push(() => { active++; resolve(); }));
  };
  const release = () => {
    active--;
    waiters.shift()?.();
  };
  const gate = async <R,>(fn: () => PromiseLike<R>): Promise<R> => {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  };

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "unsafe") {
        return (...args: Parameters<Sql["unsafe"]>) => {
          const run = (mode: "rows" | "values") =>
            gate(() => {
              const q = target.unsafe(...args);
              return mode === "values" ? q.values() : q;
            });
          // Drizzle hanya memakai `await` dan `.values()`; eksekusi ditunda sampai salah satunya dipanggil
          // (sama seperti query postgres-js yang lazy).
          let rows: Promise<unknown> | undefined;
          const asRows = () => (rows ??= run("rows"));
          return {
            then: (onOk: never, onErr: never) => asRows().then(onOk, onErr),
            catch: (onErr: never) => asRows().catch(onErr),
            finally: (fn: never) => asRows().finally(fn),
            values: () => run("values"),
          };
        };
      }
      if (prop === "begin") {
        return (...args: unknown[]) =>
          gate(() => (target.begin as (...a: unknown[]) => PromiseLike<unknown>)(...args));
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
