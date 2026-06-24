import { describe, it, expect } from "vitest";
import {
  calcLineDiscount,
  calcCartTotals,
  calcMarketplaceNet,
  MDR_RATES,
  type PosCartItem,
  type MpItem,
  type CustomFee,
} from "../pos-calc";

const item = (overrides: Partial<PosCartItem> = {}): PosCartItem => ({
  id: "v1",
  name: "Produk A",
  sku: "SKU-001",
  price: 100_000,
  hpp: 70_000,
  qty: 1,
  disc: 0,
  discType: "pct",
  ...overrides,
});

describe("calcLineDiscount", () => {
  it("persen: 10% dari 100.000 × 2 = 20.000", () => {
    expect(calcLineDiscount(item({ qty: 2, disc: 10, discType: "pct" }))).toBe(20_000);
  });

  it("rupiah: Rp5.000 dari item Rp100.000", () => {
    expect(calcLineDiscount(item({ disc: 5_000, discType: "rp" }))).toBe(5_000);
  });

  it("diskon 0 → 0", () => {
    expect(calcLineDiscount(item({ disc: 0 }))).toBe(0);
  });

  it("diskon rupiah lebih besar dari gross → capped ke gross", () => {
    expect(calcLineDiscount(item({ price: 10_000, qty: 1, disc: 50_000, discType: "rp" }))).toBe(10_000);
  });

  it("diskon persen 100% → capped ke gross", () => {
    expect(calcLineDiscount(item({ disc: 100, discType: "pct" }))).toBe(100_000);
  });

  it("diskon persen negatif → 0", () => {
    expect(calcLineDiscount(item({ disc: -10, discType: "pct" }))).toBe(0);
  });
});

describe("calcCartTotals", () => {
  it("satu item tanpa diskon, bayar tunai (MDR 0)", () => {
    const cart = [item({ price: 100_000, qty: 1, hpp: 70_000 })];
    const t = calcCartTotals(cart, 0, "pct", "tunai");
    expect(t.gross).toBe(100_000);
    expect(t.itemDiscTotal).toBe(0);
    expect(t.cartDiscValue).toBe(0);
    expect(t.dpp).toBe(100_000);
    expect(t.ppn).toBeCloseTo(12_000);
    expect(t.total).toBeCloseTo(112_000);
    expect(t.mdrAmount).toBe(0);
    expect(t.netAmount).toBeCloseTo(112_000);
    expect(t.totalHpp).toBe(70_000);
  });

  it("diskon item 10% + diskon cart 5%", () => {
    const cart = [item({ price: 100_000, qty: 2, disc: 10, discType: "pct" })];
    const t = calcCartTotals(cart, 5, "pct", "tunai");
    // gross = 200.000; itemDisc = 20.000; afterItemDisc = 180.000
    // cartDisc = 5% × 180.000 = 9.000; dpp = 171.000
    expect(t.gross).toBe(200_000);
    expect(t.itemDiscTotal).toBe(20_000);
    expect(t.afterItemDisc).toBe(180_000);
    expect(t.cartDiscValue).toBe(9_000);
    expect(t.dpp).toBe(171_000);
  });

  it("diskon cart rupiah", () => {
    const cart = [item({ price: 100_000, qty: 1 })];
    const t = calcCartTotals(cart, 20_000, "rp", "tunai");
    expect(t.cartDiscValue).toBe(20_000);
    expect(t.dpp).toBe(80_000);
  });

  it("diskon cart rupiah melebihi afterItemDisc → capped", () => {
    const cart = [item({ price: 50_000, qty: 1 })];
    const t = calcCartTotals(cart, 999_000, "rp", "tunai");
    expect(t.cartDiscValue).toBe(50_000);
    expect(t.dpp).toBe(0);
  });

  it("QRIS MDR 0.7% dipotong dari total", () => {
    const cart = [item({ price: 100_000, qty: 1, hpp: 70_000 })];
    const t = calcCartTotals(cart, 0, "pct", "qris");
    expect(t.mdrAmount).toBeCloseTo(112_000 * 0.007);
    expect(t.netAmount).toBeCloseTo(112_000 - 112_000 * 0.007);
  });

  it("kartu kredit MDR 2.5%", () => {
    const cart = [item({ price: 100_000, qty: 1 })];
    const t = calcCartTotals(cart, 0, "pct", "kartu_kredit");
    expect(MDR_RATES["kartu_kredit"]).toBe(2.5);
    expect(t.mdrAmount).toBeCloseTo(112_000 * 0.025);
  });

  it("metode tidak dikenal → MDR 0", () => {
    const cart = [item()];
    const t = calcCartTotals(cart, 0, "pct", "unknown_method");
    expect(t.mdrAmount).toBe(0);
  });

  it("PPN 12% dihitung dari dpp", () => {
    const cart = [item({ price: 100_000, qty: 1 })];
    const t = calcCartTotals(cart, 0, "pct", "tunai");
    expect(t.ppn).toBeCloseTo(t.dpp * 0.12);
  });

  it("margin dan marginPct dihitung dari netAmount - totalHpp", () => {
    const cart = [item({ price: 100_000, qty: 1, hpp: 70_000 })];
    const t = calcCartTotals(cart, 0, "pct", "tunai");
    expect(t.grossMargin).toBeCloseTo(t.netAmount - t.totalHpp);
    expect(t.marginPct).toBeCloseTo((t.grossMargin / t.dpp) * 100);
  });

  it("cart kosong → semua nilai 0, marginPct = 0 (bukan NaN)", () => {
    const t = calcCartTotals([], 0, "pct", "tunai");
    expect(t.gross).toBe(0);
    expect(t.total).toBe(0);
    expect(t.marginPct).toBe(0);
  });
});

describe("calcMarketplaceNet", () => {
  const items: MpItem[] = [
    { id: "v1", name: "Produk A", sku: "SKU-001", qty: 2, price: 100_000, hpp: 60_000 },
  ];
  const defaultParams = {
    komisiPlatform: 1.8,
    mdrPersen: 0,
    biayaLayanan: 0,
    ongkirDiterima: 0,
    subsidiOngkir: 0,
    ongkirKurir: 0,
    voucherPlatform: 0,
    customFees: [] as CustomFee[],
  };

  it("nilaiBarang = sum(price × qty)", () => {
    const r = calcMarketplaceNet(items, defaultParams);
    expect(r.nilaiBarang).toBe(200_000);
  });

  it("komisi 1.8% Tokopedia", () => {
    const r = calcMarketplaceNet(items, defaultParams);
    expect(r.komisiNominal).toBeCloseTo(200_000 * 0.018);
  });

  it("netDiterima dikurangi komisi dari nilaiBarang", () => {
    const r = calcMarketplaceNet(items, defaultParams);
    expect(r.netDiterima).toBeCloseTo(200_000 - r.komisiNominal);
  });

  it("margin kotor = netDiterima - nilaiHpp", () => {
    const r = calcMarketplaceNet(items, defaultParams);
    expect(r.marginKotor).toBeCloseTo(r.netDiterima - r.nilaiHpp);
  });

  it("ongkir subsidi + diterima - kurir = netOngkir", () => {
    const r = calcMarketplaceNet(items, {
      ...defaultParams,
      ongkirDiterima: 20_000,
      subsidiOngkir: 5_000,
      ongkirKurir: 18_000,
    });
    expect(r.netOngkir).toBe(7_000);
  });

  it("custom fee persen plus menambah netDiterima", () => {
    const fees: CustomFee[] = [{ id: "f1", name: "Voucher platform", kind: "pct", value: 5, sign: "plus" }];
    const r = calcMarketplaceNet(items, { ...defaultParams, customFees: fees });
    expect(r.customFeeRows[0].nominal).toBeCloseTo(200_000 * 0.05);
    expect(r.customFeeRows[0].signed).toBeGreaterThan(0);
  });

  it("custom fee rp minus mengurangi netDiterima", () => {
    const fees: CustomFee[] = [{ id: "f2", name: "Biaya tambahan", kind: "rp", value: 10_000, sign: "minus" }];
    const r = calcMarketplaceNet(items, { ...defaultParams, customFees: fees });
    expect(r.customFeeRows[0].signed).toBe(-10_000);
    expect(r.customFeesTotal).toBe(-10_000);
  });

  it("isMinus = true jika marginKotor negatif", () => {
    const expensive: MpItem[] = [{ id: "v1", name: "X", sku: "X", qty: 1, price: 10_000, hpp: 200_000 }];
    const r = calcMarketplaceNet(expensive, defaultParams);
    expect(r.isMinus).toBe(true);
    expect(r.isTipis).toBe(false);
  });

  it("isTipis = true jika margin 0%–9.99%", () => {
    const tight: MpItem[] = [{ id: "v1", name: "X", sku: "X", qty: 1, price: 100_000, hpp: 95_000 }];
    const r = calcMarketplaceNet(tight, { ...defaultParams, komisiPlatform: 0 });
    expect(r.marginKotor).toBeGreaterThanOrEqual(0);
    expect(r.marginPct).toBeLessThan(10);
    expect(r.isTipis).toBe(true);
    expect(r.isMinus).toBe(false);
  });

  it("marginPct = 0 (bukan NaN) jika nilaiBarang = 0", () => {
    const r = calcMarketplaceNet([], defaultParams);
    expect(r.marginPct).toBe(0);
  });
});
