import { describe, it, expect } from "vitest";
import { calcDiscount, type AppliedVoucher } from "../discount";

const pct = (value: number, maxDiscount: number | null = null): AppliedVoucher => ({
  voucherId: "v1",
  type: "percent",
  value,
  maxDiscount,
});

const fixed = (value: number): AppliedVoucher => ({
  voucherId: "v1",
  type: "fixed",
  value,
  maxDiscount: null,
});

describe("calcDiscount — fixed", () => {
  it("diskon tetap Rp10.000 dari subtotal Rp100.000", () => {
    expect(calcDiscount(fixed(10_000), 100_000)).toBe(10_000);
  });

  it("diskon tidak boleh melebihi subtotal", () => {
    expect(calcDiscount(fixed(200_000), 50_000)).toBe(50_000);
  });

  it("diskon tepat sama dengan subtotal", () => {
    expect(calcDiscount(fixed(75_000), 75_000)).toBe(75_000);
  });

  it("subtotal 0 → diskon 0", () => {
    expect(calcDiscount(fixed(50_000), 0)).toBe(0);
  });
});

describe("calcDiscount — percent", () => {
  it("10% dari Rp200.000 = Rp20.000", () => {
    expect(calcDiscount(pct(10), 200_000)).toBe(20_000);
  });

  it("dibulatkan ke rupiah terdekat", () => {
    // 10% dari 99.999 = 9999.9 → round → 10000
    expect(calcDiscount(pct(10), 99_999)).toBe(10_000);
  });

  it("dengan maxDiscount: 20% dari 200.000 = 40.000, max 25.000 → 25.000", () => {
    expect(calcDiscount(pct(20, 25_000), 200_000)).toBe(25_000);
  });

  it("tanpa maxDiscount: 20% dari 200.000 = 40.000", () => {
    expect(calcDiscount(pct(20), 200_000)).toBe(40_000);
  });

  it("maxDiscount tidak berlaku jika raw lebih kecil", () => {
    // 10% dari 100.000 = 10.000; maxDiscount 50.000 → tetap 10.000
    expect(calcDiscount(pct(10, 50_000), 100_000)).toBe(10_000);
  });

  it("0% → 0", () => {
    expect(calcDiscount(pct(0), 100_000)).toBe(0);
  });

  it("100% dari subtotal", () => {
    expect(calcDiscount(pct(100), 50_000)).toBe(50_000);
  });

  it("subtotal 0 → 0", () => {
    expect(calcDiscount(pct(20), 0)).toBe(0);
  });
});
