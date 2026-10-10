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
  if (/totalSales|totalHpp|"hero"/.test(body)) return "DATA";
  if (body.includes('"digest"') || body.includes("Akses ditolak") || body.includes("Tidak ada sesi")) return "DITOLAK";
  if (body.includes('"ok":true')) return "DIJALANKAN";
  return "lain";
}

const ATTACKS: Array<[route: string, action: string, args: unknown[], risk: string]> = [
  ["/admin/stock-opname", "closeSession", ["fake-session"], "KRITIS ubah stok"],
  ["/admin/stock-opname", "startSoSession", ["attacker"], "KRITIS buat sesi opname"],
  ["/admin/stock-opname", "saveOpnameProgress", [[{ id: "x", physicalStock: 0, notes: "" }]], "KRITIS ubah hitungan"],
  ["/admin/content", "updateContentSection", ["landing", { hero: { title: "HACKED" } }], "TINGGI ubah halaman depan"],
  ["/admin/reports", "getReportData", ["2026-01-01", "2026-12-31", "semua"], "TINGGI bocor omzet/HPP"],
  ["/admin/marketplace", "validateSettlement", ["x", 1, "selesai"], "TINGGI ubah ledger"],
  ["/admin/orders", "adminUpdateOrderStatus", ["x", "paid"], "TINGGI ubah pesanan"],
];

async function snapshot() {
  const r = (await db.execute(sql`select
    (select count(*) from stock_opname_sessions) as sessions,
    (select md5(data::text) from content_sections where key = 'landing') as content,
    (select coalesce(sum(remaining), 0) from batches) as stock,
    (select count(*) from audit_logs) as audit,
    (select count(*) from ledger_entries) as ledger`)) as unknown as Array<Record<string, unknown>>;
  return JSON.stringify(r[0]);
}

async function main() {
  const need = (k: string) => process.env[k] ?? (() => { throw new Error(`${k} belum diisi`); })();
  const customer = await login("budi@example.com", need("SEED_CUSTOMER_PASSWORD"));
  const admin = await login("admin@si4care.com", need("SEED_ADMIN_PASSWORD"));
  const actors: Array<[string, string]> = [
    ["anonim + cookie palsu", "better-auth.session_token=forged.value"],
    ["pelanggan asli", customer],
  ];

  const before = await snapshot();
  let bad = 0;
  console.log("🧪 Serangan ke server action (build production)\n");
  for (const [route, action, args, risk] of ATTACKS) {
    const cells: string[] = [];
    for (const [, cookie] of actors) {
      const v = await attack(route, action, args, cookie);
      if (v !== "DITOLAK") bad++;
      cells.push(`${v === "DITOLAK" ? "✓" : "✗"} ${v}`);
    }
    console.log(`   ${action.padEnd(24)} ${risk.padEnd(26)} ${actors.map(([n], i) => `${n}: ${cells[i]}`).join("   ")}`);
  }

  const control = await attack("/admin/reports", "getReportData", ["2026-01-01", "2026-12-31", "semua"], admin);
  const controlOk = control === "DATA";
  console.log(`\n   kontrol positif (admin membaca laporan): ${control} ${controlOk ? "✓" : "✗ alat uji tidak bisa dipercaya"}`);

  const after = await snapshot();
  const untouched = before === after;
  console.log(`   DB tak berubah: ${untouched ? "✓" : "✗ " + before + " → " + after}`);

  const failed = bad > 0 || !controlOk || !untouched;
  console.log(failed ? `\n❌ GAGAL (${bad} serangan lolos)` : `\n🎉 Semua ${ATTACKS.length * actors.length} serangan ditolak, DB utuh`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
