/**
 * Rentang tanggal untuk filter periode dashboard — fungsi murni, diuji unit.
 *
 * Tanggal dalam UTC dan berformat YYYY-MM-DD, sama dengan `entryDate` yang ditulis ledger
 * (`ledgerDate()`), sehingga rentang dan data dibandingkan dengan basis yang sama.
 */

export const PERIODS = ["hari_ini", "minggu_ini", "bulan_ini", "kuartal", "tahun"] as const;
export type DashboardPeriod = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  hari_ini: "Hari Ini",
  minggu_ini: "Minggu Ini",
  bulan_ini: "Bulan Ini",
  kuartal: "Kuartal Ini",
  tahun: "Tahun Ini",
};

export function parsePeriod(value: string | undefined | null): DashboardPeriod {
  return (PERIODS as readonly string[]).includes(value ?? "") ? (value as DashboardPeriod) : "bulan_ini";
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Dari awal periode sampai hari ini (inklusif). Minggu dimulai hari Senin. */
export function periodRange(period: DashboardPeriod, now: Date = new Date()): { from: string; to: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const to = fmt(y, m, d);

  switch (period) {
    case "hari_ini":
      return { from: to, to };
    case "minggu_ini": {
      const dow = now.getUTCDay(); // 0 = Minggu
      const sinceMonday = (dow + 6) % 7;
      const start = new Date(Date.UTC(y, m, d - sinceMonday));
      return { from: fmt(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()), to };
    }
    case "bulan_ini":
      return { from: fmt(y, m, 1), to };
    case "kuartal":
      return { from: fmt(y, Math.floor(m / 3) * 3, 1), to };
    case "tahun":
      return { from: fmt(y, 0, 1), to };
  }
}
