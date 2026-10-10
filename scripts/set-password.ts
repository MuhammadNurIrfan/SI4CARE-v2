/**
 * Ganti password akun email/password yang SUDAH ADA, lalu cabut semua sesi login-nya.
 *
 * `db:seed` melewati akun yang sudah ada, jadi tidak ada cara lain untuk mengganti password akun seed
 * (rotasi wajib setelah password lama ikut ter-push ke git — checklist A3a).
 *
 * Password dibaca dari env NEW_PASSWORD, BUKAN argumen, agar tidak tersimpan di riwayat shell:
 *
 *   NEW_PASSWORD='password-baru-yang-kuat' npm run db:set-password -- admin@si4care.com
 *
 * Lalu perbarui SEED_* yang sesuai di .env.local supaya test E2E tetap bisa login.
 * Untuk database produksi, jalankan dengan DATABASE_URL produksi (port 5432 session pooler cukup untuk skrip ini).
 */
import { and, eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/lib/db";
import { account, session, user } from "@/lib/db/auth-schema";

async function main() {
  const email = process.argv[2];
  const password = process.env.NEW_PASSWORD;
  if (!email) throw new Error("Pemakaian: NEW_PASSWORD='...' npm run db:set-password -- <email>");
  if (!password) throw new Error("NEW_PASSWORD belum diisi (sengaja lewat env, bukan argumen, agar tak masuk riwayat shell)");
  if (password.length < 12) throw new Error("Password minimal 12 karakter");

  const [u] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`Tidak ada pengguna dengan email ${email}`);

  const hashed = await hashPassword(password);
  const updated = await db
    .update(account)
    .set({ password: hashed, updatedAt: new Date() })
    .where(and(eq(account.userId, u.id), eq(account.providerId, "credential")))
    .returning({ id: account.id });
  if (updated.length === 0) {
    throw new Error(`${email} tidak punya akun email/password (mungkin hanya login Google) — tidak ada yang diubah`);
  }

  const revoked = await db.delete(session).where(eq(session.userId, u.id)).returning({ id: session.id });
  console.log(`✓ Password ${email} (role: ${u.role}) diganti. ${revoked.length} sesi login lama dicabut.`);
  process.exit(0);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
