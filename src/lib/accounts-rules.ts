import { z } from "zod";

export const ROLES = ["customer", "admin", "super_admin"] as const;
export type AccountRole = (typeof ROLES)[number];

export const ROLE_LABEL: Record<AccountRole, string> = {
  customer: "Pelanggan",
  admin: "Admin",
  super_admin: "Super Admin",
};

const name = z.string().trim().min(2, "Nama minimal 2 karakter").max(255, "Nama terlalu panjang");
const email = z.string().trim().toLowerCase().pipe(z.email("Format email tidak valid")).pipe(z.string().max(255, "Email terlalu panjang"));
const phone = z
  .string()
  .trim()
  .max(32, "Nomor telepon terlalu panjang")
  .regex(/^[0-9+\-\s()]*$/, "Nomor telepon hanya boleh angka, spasi, +, -, ( )")
  .transform((v) => (v === "" ? null : v));
const role = z.enum(ROLES, { error: "Peran tidak valid" });
const password = z.string().min(8, "Password minimal 8 karakter").max(128, "Password maksimal 128 karakter");

export const createAccountSchema = z.object({ name, email, phone, role, password });
export type CreateAccountInput = z.input<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  id: z.string().min(1),
  name,
  email,
  phone,
  role,
  // Kosong = tidak mengganti password.
  password: z.union([z.literal(""), password]).transform((v) => (v === "" ? null : v)),
});
export type UpdateAccountInput = z.input<typeof updateAccountSchema>;

type Guard = { actorId: string; targetId: string; targetRole: AccountRole; superAdminCount: number };

export function checkRoleChange(g: Guard & { nextRole: AccountRole }): string | null {
  if (g.nextRole === g.targetRole) return null;
  if (g.actorId === g.targetId) return "Anda tidak dapat mengubah peran akun Anda sendiri.";
  if (g.targetRole === "super_admin" && g.superAdminCount <= 1) return "Harus tersisa minimal satu Super Admin.";
  return null;
}

export function checkDelete(g: Guard): string | null {
  if (g.actorId === g.targetId) return "Anda tidak dapat menghapus akun Anda sendiri.";
  if (g.targetRole === "super_admin" && g.superAdminCount <= 1) return "Harus tersisa minimal satu Super Admin.";
  return null;
}

export function normalizeRole(value: string | null | undefined): AccountRole {
  return (ROLES as readonly string[]).includes(value ?? "") ? (value as AccountRole) : "customer";
}
