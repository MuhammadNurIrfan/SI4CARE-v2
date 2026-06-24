import { describe, it, expect } from "vitest";
import { allocateStock, type BatchInput } from "../stockAllocation";

const d = (daysFromNow: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  return dt.toISOString().slice(0, 10);
};

const received = (daysAgo: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt;
};

const batch = (id: string, remaining: number, hpp: number, receivedDaysAgo: number, expiredDaysFromNow: number | null = null): BatchInput => ({
  id,
  remaining,
  hpp,
  receivedAt: received(receivedDaysAgo),
  expiredDate: expiredDaysFromNow !== null ? d(expiredDaysFromNow) : null,
});

describe("allocateStock — FIFO", () => {
  it("ambil dari batch paling lama dulu", () => {
    const batches = [
      batch("B2", 10, 8000, 1),
      batch("B1", 10, 9000, 5),
    ];
    const result = allocateStock(batches, 6, "fifo");
    expect(result.fulfilled).toBe(true);
    expect(result.allocations[0].batchId).toBe("B1"); // lebih lama
    expect(result.allocations[0].quantity).toBe(6);
    expect(result.totalCogs).toBe(6 * 9000);
    expect(result.shortfall).toBe(0);
  });

  it("span ke batch berikutnya jika satu tidak cukup", () => {
    const batches = [
      batch("B2", 3, 8000, 1),
      batch("B1", 5, 9000, 5),
    ];
    const result = allocateStock(batches, 7, "fifo");
    expect(result.fulfilled).toBe(true);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0]).toMatchObject({ batchId: "B1", quantity: 5 });
    expect(result.allocations[1]).toMatchObject({ batchId: "B2", quantity: 2 });
    expect(result.totalCogs).toBe(5 * 9000 + 2 * 8000);
  });

  it("shortfall jika stok total tidak cukup", () => {
    const batches = [batch("B1", 4, 10000, 3)];
    const result = allocateStock(batches, 10, "fifo");
    expect(result.fulfilled).toBe(false);
    expect(result.shortfall).toBe(6);
    expect(result.allocations[0].quantity).toBe(4);
  });

  it("kembalikan array kosong jika tidak ada batch", () => {
    const result = allocateStock([], 5, "fifo");
    expect(result.fulfilled).toBe(false);
    expect(result.shortfall).toBe(5);
    expect(result.allocations).toHaveLength(0);
    expect(result.totalCogs).toBe(0);
  });

  it("abaikan batch dengan remaining = 0", () => {
    const batches = [
      batch("B1", 0, 9000, 5),
      batch("B2", 10, 8000, 1),
    ];
    const result = allocateStock(batches, 3, "fifo");
    expect(result.allocations[0].batchId).toBe("B2");
    expect(result.fulfilled).toBe(true);
  });

  it("fulfilled jika requestedQty = 0", () => {
    const result = allocateStock([batch("B1", 10, 9000, 1)], 0, "fifo");
    expect(result.fulfilled).toBe(true);
    expect(result.shortfall).toBe(0);
    expect(result.allocations).toHaveLength(0);
    expect(result.totalCogs).toBe(0);
  });
});

describe("allocateStock — FEFO", () => {
  it("ambil batch dengan ED paling dekat duluan", () => {
    const batches = [
      batch("B_far", 10, 8000, 5, 60),
      batch("B_near", 10, 9000, 3, 10),
    ];
    const result = allocateStock(batches, 5, "fefo");
    expect(result.allocations[0].batchId).toBe("B_near");
    expect(result.totalCogs).toBe(5 * 9000);
  });

  it("batch tanpa ED → prioritas paling akhir", () => {
    const batches = [
      batch("B_no_ed", 10, 7000, 1, null),
      batch("B_ed", 10, 9000, 1, 30),
    ];
    const result = allocateStock(batches, 5, "fefo");
    expect(result.allocations[0].batchId).toBe("B_ed");
  });

  it("lewati batch yang sudah kadaluarsa (ED hari ini = kadaluarsa)", () => {
    const batches = [
      batch("B_expired", 10, 5000, 10, 0),
      batch("B_valid", 10, 9000, 5, 30),
    ];
    const result = allocateStock(batches, 5, "fefo");
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].batchId).toBe("B_valid");
  });

  it("lewati batch dengan ED kemarin", () => {
    const batches = [
      batch("B_stale", 10, 5000, 15, -1),
      batch("B_ok", 5, 8000, 2, 7),
    ];
    const result = allocateStock(batches, 3, "fefo");
    expect(result.allocations[0].batchId).toBe("B_ok");
    expect(result.fulfilled).toBe(true);
  });

  it("FIFO sebagai tie-breaker saat ED sama", () => {
    const batches = [
      batch("B_newer", 10, 8000, 1, 30),
      batch("B_older", 10, 9000, 5, 30),
    ];
    const result = allocateStock(batches, 5, "fefo");
    expect(result.allocations[0].batchId).toBe("B_older"); // lebih lama diterima
  });
});

describe("allocateStock — edge cases", () => {
  it("ambil tepat semua stok dari satu batch", () => {
    const result = allocateStock([batch("B1", 7, 12000, 2)], 7, "fifo");
    expect(result.fulfilled).toBe(true);
    expect(result.shortfall).toBe(0);
    expect(result.totalCogs).toBe(7 * 12000);
  });

  it("snapshot hpp per batch tersimpan di allocations", () => {
    const batches = [
      batch("B1", 3, 10000, 5),
      batch("B2", 3, 15000, 1),
    ];
    const result = allocateStock(batches, 6, "fifo");
    expect(result.allocations.find((a) => a.batchId === "B1")?.hpp).toBe(10000);
    expect(result.allocations.find((a) => a.batchId === "B2")?.hpp).toBe(15000);
  });
});
