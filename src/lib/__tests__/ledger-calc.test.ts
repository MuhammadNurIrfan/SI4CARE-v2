import { describe, it, expect } from "vitest";
import { computeMarketplaceLedger, computeWebLedger, sumAllocationHpp } from "../ledger-calc";

describe("sumAllocationHpp", () => {
  it("menjumlah qty × hpp seluruh alokasi dari semua item", () => {
    const items = [
      { batchAllocations: [{ batchId: "b1", qty: 2, hpp: 420000 }] },
      { batchAllocations: [{ batchId: "b2", qty: 3, hpp: 10000 }, { batchId: "b3", qty: 1, hpp: 12000 }] },
    ];
    expect(sumAllocationHpp(items)).toBe(2 * 420000 + 3 * 10000 + 12000);
  });

  it("item tanpa alokasi (null/undefined) dianggap 0, tidak error", () => {
    expect(sumAllocationHpp([{ batchAllocations: null }, { batchAllocations: undefined }])).toBe(0);
    expect(sumAllocationHpp([])).toBe(0);
  });

  it("dibulatkan 2 desimal", () => {
    expect(sumAllocationHpp([{ batchAllocations: [{ batchId: "b", qty: 3, hpp: 0.335 }] }])).toBe(1.01);
  });
});

describe("computeWebLedger", () => {
  const items = [{ batchAllocations: [{ batchId: "b1", qty: 1, hpp: 420000 }] }];

  it("penjualan = subtotal − diskon (tanpa ongkir/service fee), margin = penjualan − HPP", () => {
    const r = computeWebLedger({ subtotal: "540000.00", discountAmount: "50000.00" }, items);
    expect(r).toEqual({ totalSales: 490000, totalHpp: 420000, grossMargin: 70000 });
  });

  it("tanpa diskon", () => {
    const r = computeWebLedger({ subtotal: 620000, discountAmount: 0 }, [{ batchAllocations: [{ batchId: "b", qty: 1, hpp: 470000 }] }]);
    expect(r.grossMargin).toBe(150000);
  });

  it("margin boleh negatif bila HPP melebihi penjualan", () => {
    const r = computeWebLedger({ subtotal: 100000, discountAmount: 0 }, [{ batchAllocations: [{ batchId: "b", qty: 1, hpp: 130000 }] }]);
    expect(r.grossMargin).toBe(-30000);
  });
});

describe("computeMarketplaceLedger", () => {
  it("penjualan = netAmount (setelah biaya platform), bukan totalAmount", () => {
    const r = computeMarketplaceLedger({ netAmount: "1040000.00", totalHpp: "820000.00" });
    expect(r).toEqual({ totalSales: 1040000, totalHpp: 820000, grossMargin: 220000 });
  });
});
