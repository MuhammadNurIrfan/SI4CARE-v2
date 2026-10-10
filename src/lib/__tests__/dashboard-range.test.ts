import { describe, it, expect } from "vitest";
import { parsePeriod, periodRange } from "../dashboard-range";

// Rabu, 14 Oktober 2026 (UTC)
const WED = new Date(Date.UTC(2026, 9, 14, 3, 0, 0));

describe("periodRange", () => {
  it("hari ini = hari ini saja", () => {
    expect(periodRange("hari_ini", WED)).toEqual({ from: "2026-10-14", to: "2026-10-14" });
  });
  it("minggu ini dimulai Senin", () => {
    expect(periodRange("minggu_ini", WED)).toEqual({ from: "2026-10-12", to: "2026-10-14" });
  });
  it("minggu ini saat hari Senin = hari itu sendiri", () => {
    expect(periodRange("minggu_ini", new Date(Date.UTC(2026, 9, 12)))).toEqual({ from: "2026-10-12", to: "2026-10-12" });
  });
  it("minggu ini saat hari Minggu mundur ke Senin sebelumnya (bukan Senin depan)", () => {
    expect(periodRange("minggu_ini", new Date(Date.UTC(2026, 9, 18)))).toEqual({ from: "2026-10-12", to: "2026-10-18" });
  });
  it("minggu ini melintasi batas bulan", () => {
    // Kamis 1 Okt 2026 → Senin-nya 28 Sep
    expect(periodRange("minggu_ini", new Date(Date.UTC(2026, 9, 1)))).toEqual({ from: "2026-09-28", to: "2026-10-01" });
  });
  it("bulan ini", () => {
    expect(periodRange("bulan_ini", WED)).toEqual({ from: "2026-10-01", to: "2026-10-14" });
  });
  it("kuartal: Q4 mulai Oktober, Q1 mulai Januari, Q3 mulai Juli", () => {
    expect(periodRange("kuartal", WED).from).toBe("2026-10-01");
    expect(periodRange("kuartal", new Date(Date.UTC(2026, 1, 20))).from).toBe("2026-01-01");
    expect(periodRange("kuartal", new Date(Date.UTC(2026, 8, 30))).from).toBe("2026-07-01");
  });
  it("tahun", () => {
    expect(periodRange("tahun", WED)).toEqual({ from: "2026-01-01", to: "2026-10-14" });
  });
});

describe("parsePeriod", () => {
  it("nilai sah dipertahankan", () => {
    expect(parsePeriod("tahun")).toBe("tahun");
  });
  it("nilai tak dikenal / kosong → bulan_ini (input dari URL tidak dipercaya)", () => {
    expect(parsePeriod("'; drop table")).toBe("bulan_ini");
    expect(parsePeriod(undefined)).toBe("bulan_ini");
    expect(parsePeriod("")).toBe("bulan_ini");
  });
});
