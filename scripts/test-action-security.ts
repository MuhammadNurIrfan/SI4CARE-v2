/**
 * Uji keamanan server action pada build PRODUCTION: menyerang action sensitif seperti penyerang sungguhan.
 *
 * Kenapa perlu: server action adalah endpoint POST. `proxy.ts` hanya mengecek ADANYA cookie sesi, dan
 * `admin/layout.tsx` hanya menjaga render halaman — keduanya tidak melindungi pemanggilan action. Satu-satunya
 * perlindungan nyata adalah guard di dalam action. Empat file pernah lolos tanpa guard (checklist §7f).
 *
 * Cara kerja: action hanya bisa dijalankan lewat rute yang membundelnya, jadi tiap serangan di-POST ke rute itu,
 * dengan header Next-Action dari manifest build, sebagai (1) anonim + cookie sesi PALSU dan (2) pelanggan asli
 * (bukan admin). Kontrol positif: admin asli harus bisa membaca laporan — membuktikan alat ini bisa mendeteksi data.
 * Setelahnya DB dibandingkan: tak boleh ada perubahan.
 *
 * Prasyarat: `npm run build` lalu server production berjalan, mis.
 *   BETTER_AUTH_URL=http://si4care.localtest.me:3100 npx next start -p 3100
 * Jalankan:
 *   SECURITY_TEST_BASE=http://localhost:3100 SECURITY_TEST_ORIGIN=http://si4care.localtest.me:3100 npm run test:security
 */
import { readFileSync } from "fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

const BASE = process.env.SECURITY_TEST_BASE ?? "http://localhost:3100";
const ORIGIN = process.env.SECURITY_TEST_ORIGIN ?? BASE;

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
  node: Record<string, { exportedName: string }>;
};
const idOf = (name: string) => {
  const hit = Object.entries(manifest.node).find(([, m]) => m.exportedName === name);
  if (!hit) throw new Error(`action "${name}" tidak ada di manifest build — sudah `+"`npm run build`?");
  return hit[0];
};

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login ${email} gagal: HTTP ${res.status}`);
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

type Verdict = "DITOLAK" | "DATA" | "DIJALANKAN" | "tidak-sampai" | "lain";
async function attack(route: string, action: string, args: unknown[], cookie: string): Promise<Verdict> {
  const res = await fetch(`${BASE}${route}`, {
    method: "POST",
    headers: { "Next-Action": idOf(action), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", Cookie: cookie },
    body: JSON.stringify(args),
  });
  const body = (await res.text()).trim();
  if (body === "" || body === "{}") return "tidak-sampai"; // action tidak ada di rute ini
  if (/totalSales|totalHpp|"hero"|"orderCount"/.test(body)) return "DATA";
  if (body.includes('"digest"') || body.includes("Akses ditolak") || body.includes("Tidak ada sesi")) return "DITOLAK";
  if (body.includes('"ok":true')) return "DIJALANKAN";
  return "lain";
}

// Elemen ke-5 true = hanya Super Admin yang boleh; admin biasa ikut jadi penyerang.
const ATTACKS: Array<[route: string, action: string, args: unknown[], risk: string, superOnly?: boolean]> = [
  ["/admin/stock-opname", "closeSession", ["fake-session"], "KRITIS ubah stok"],
  ["/admin/stock-opname", "startSoSession", ["attacker"], "KRITIS buat sesi opname"],
  ["/admin/stock-opname", "saveOpnameProgress", [[{ id: "x", physicalStock: 0, notes: "" }]], "KRITIS ubah hitungan"],
  ["/admin/content", "updateContentSection", ["landing", { hero: { title: "HACKED" } }], "TINGGI ubah halaman depan"],
  ["/admin/reports", "getReportData", ["2026-01-01", "2026-12-31", "semua"], "TINGGI bocor omzet/HPP"],
  ["/admin/marketplace", "validateSettlement", ["x", 1, "selesai"], "TINGGI ubah ledger"],
  ["/admin/orders", "adminUpdateOrderStatus", ["x", "paid"], "TINGGI ubah pesanan"],
  ["/admin/accounts", "listAccounts", [], "TINGGI bocor daftar akun", true],
  ["/admin/accounts", "createAccount", [{ name: "Hacker", email: "hacker.uji@example.com", phone: "", role: "super_admin", password: "hacker-pass-123" }], "KRITIS buat Super Admin", true],
  ["/admin/accounts", "updateAccount", [{ id: "x", name: "x", email: "x@example.com", phone: "", role: "super_admin", password: "hacker-pass-123" }], "KRITIS ambil alih akun", true],
  ["/admin/accounts", "deleteAccount", ["x"], "KRITIS hapus akun", true],
];

async function snapshot() {
  const r = (await db.execute(sql`select
    (select count(*) from stock_opname_sessions) as sessions,
    (select md5(data::text) from content_sections where key = 'landing') as content,
    (select coalesce(sum(remaining), 0) from batches) as stock,
    (select count(*) from audit_logs) as audit,
    (select count(*) from ledger_entries) as ledger,
    (select count(*) from "user") as users,
    (select md5(string_agg(id || coalesce(role, '') || email, ',' order by id)) from "user") as user_state,
    (select md5(string_agg(user_id || coalesce(password, ''), ',' order by id)) from account) as credentials`)) as unknown as Array<Record<string, unknown>>;
  return JSON.stringify(r[0]);
}

async function main() {
  const need = (k: string) => process.env[k] ?? (() => { throw new Error(`${k} belum diisi`); })();
  const customer = await login("budi@example.com", need("SEED_CUSTOMER_PASSWORD"));
  const admin = await login("admin@si4care.com", need("SEED_ADMIN_PASSWORD"));
  const superAdmin = await login("superadmin@si4care.com", need("SEED_SUPERADMIN_PASSWORD"));
  const actors: Array<[string, string]> = [
    ["anonim + cookie palsu", "better-auth.session_token=forged.value"],
    ["pelanggan asli", customer],
  ];
  const adminActor: [string, string] = ["admin biasa", admin];

  const before = await snapshot();
  let bad = 0;
  console.log("🧪 Serangan ke server action (build production)\n");
  let total = 0;
  for (const [route, action, args, risk, superOnly] of ATTACKS) {
    const who = superOnly ? [...actors, adminActor] : actors;
    const cells: string[] = [];
    for (const [, cookie] of who) {
      const v = await attack(route, action, args, cookie);
      total++;
      if (v !== "DITOLAK") bad++;
      cells.push(`${v === "DITOLAK" ? "✓" : "✗"} ${v}`);
    }
    console.log(`   ${action.padEnd(24)} ${risk.padEnd(26)} ${who.map(([n], i) => `${n}: ${cells[i]}`).join("   ")}`);
  }

  const control = await attack("/admin/reports", "getReportData", ["2026-01-01", "2026-12-31", "semua"], admin);
  const control2 = await attack("/admin/accounts", "listAccounts", [], superAdmin);
  const controlOk = control === "DATA" && control2 === "DATA";
  console.log(`\n   kontrol positif (admin membaca laporan): ${control} ${control === "DATA" ? "✓" : "✗ alat uji tidak bisa dipercaya"}`);
  console.log(`   kontrol positif (Super Admin membaca daftar akun): ${control2} ${control2 === "DATA" ? "✓" : "✗ alat uji tidak bisa dipercaya"}`);

  const after = await snapshot();
  const untouched = before === after;
  console.log(`   DB tak berubah: ${untouched ? "✓" : "✗ " + before + " → " + after}`);

  const failed = bad > 0 || !controlOk || !untouched;
  console.log(failed ? `\n❌ GAGAL (${bad} serangan lolos)` : `\n🎉 Semua ${total} serangan ditolak, DB utuh`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
