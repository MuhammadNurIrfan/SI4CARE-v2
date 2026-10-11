import { describe, it, expect } from "vitest";
import {
  checkDelete,
  checkRoleChange,
  createAccountSchema,
  normalizeRole,
  updateAccountSchema,
} from "../accounts-rules";

const VALID = { name: "Budi Santoso", email: "Budi@Example.com ", phone: "", role: "customer", password: "rahasia123" };

describe("createAccountSchema", () => {
  it("menormalkan email (huruf kecil, tanpa spasi) dan telepon kosong jadi null", () => {
    const r = createAccountSchema.safeParse(VALID);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("budi@example.com");
      expect(r.data.phone).toBeNull();
    }
  });

  it.each([
    ["nama terlalu pendek", { name: "A" }, "Nama minimal 2 karakter"],
    ["email tidak valid", { email: "bukan-email" }, "Format email tidak valid"],
    ["password pendek", { password: "1234567" }, "Password minimal 8 karakter"],
    ["peran tidak dikenal", { role: "owner" }, "Peran tidak valid"],
    ["telepon berisi huruf", { phone: "08abc" }, "Nomor telepon hanya boleh"],
  ])("menolak: %s", (_label, override, message) => {
    const r = createAccountSchema.safeParse({ ...VALID, ...override });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain(message);
  });
});

describe("updateAccountSchema", () => {
  const base = { id: "u1", name: "Budi", email: "budi@example.com", phone: "0812-3456", role: "admin" };

  it("password kosong = tidak ganti (null)", () => {
    const r = updateAccountSchema.safeParse({ ...base, password: "" });
    expect(r.success && r.data.password).toBeNull();
  });

  it("password terisi tetap wajib minimal 8 karakter", () => {
    expect(updateAccountSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(updateAccountSchema.safeParse({ ...base, password: "panjang-cukup" }).success).toBe(true);
  });
});

describe("checkRoleChange", () => {
  const g = { actorId: "a", targetId: "b", targetRole: "admin" as const, superAdminCount: 2 };

  it("tanpa perubahan peran selalu boleh, termasuk akun sendiri", () => {
    expect(checkRoleChange({ ...g, targetId: "a", nextRole: "admin" })).toBeNull();
  });
  it("menolak mengubah peran akun sendiri", () => {
    expect(checkRoleChange({ ...g, targetId: "a", targetRole: "super_admin", nextRole: "admin" })).toMatch(/sendiri/);
  });
  it("menolak menurunkan Super Admin terakhir", () => {
    expect(checkRoleChange({ ...g, targetRole: "super_admin", superAdminCount: 1, nextRole: "admin" })).toMatch(/minimal satu Super Admin/);
  });
  it("boleh menurunkan Super Admin bila masih ada yang lain", () => {
    expect(checkRoleChange({ ...g, targetRole: "super_admin", superAdminCount: 2, nextRole: "admin" })).toBeNull();
  });
  it("boleh menaikkan pelanggan menjadi admin", () => {
    expect(checkRoleChange({ ...g, targetRole: "customer", nextRole: "admin" })).toBeNull();
  });
});

describe("checkDelete", () => {
  const g = { actorId: "a", targetId: "b", targetRole: "customer" as const, superAdminCount: 1 };

  it("menolak menghapus akun sendiri", () => {
    expect(checkDelete({ ...g, targetId: "a" })).toMatch(/sendiri/);
  });
  it("menolak menghapus Super Admin terakhir", () => {
    expect(checkDelete({ ...g, targetRole: "super_admin", superAdminCount: 1 })).toMatch(/minimal satu Super Admin/);
  });
  it("boleh menghapus Super Admin lain bila masih ada sisa", () => {
    expect(checkDelete({ ...g, targetRole: "super_admin", superAdminCount: 2 })).toBeNull();
  });
  it("boleh menghapus pelanggan", () => {
    expect(checkDelete(g)).toBeNull();
  });
});

describe("normalizeRole", () => {
  it("nilai tak dikenal atau kosong jatuh ke customer", () => {
    expect(normalizeRole(null)).toBe("customer");
    expect(normalizeRole("hacker")).toBe("customer");
    expect(normalizeRole("super_admin")).toBe("super_admin");
  });
});
