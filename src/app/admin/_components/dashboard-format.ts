export const rp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export const rpShort = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1)}M`
  : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}jt`
  : n >= 1e3 ? `Rp ${(n / 1e3).toFixed(0)}rb`
  : `Rp ${n}`;
