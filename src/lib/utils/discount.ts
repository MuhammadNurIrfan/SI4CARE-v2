export type AppliedVoucher = {
  voucherId: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
};

/** Hitung nominal diskon (Rupiah) dari voucher yang sudah divalidasi. */
export function calcDiscount(voucher: AppliedVoucher, subtotal: number): number {
  if (voucher.type === "fixed") return Math.min(voucher.value, subtotal);
  const raw = Math.round((subtotal * voucher.value) / 100);
  return voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
}
