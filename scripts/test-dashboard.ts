/**
 * Uji angka dashboard `/admin` (getDashboardData) terhadap perhitungan SQL mentah yang independen.
 * Tidak butuh dev server.   Jalankan: npm run test:dashboard
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getDashboardData } from "@/lib/dashboard-query";
import { periodRange, type DashboardPeriod } from "@/lib/dashboard-range";

const num = (v: unknown) => Number(v ?? 0);
const near = (a: number, b: number) => Math.abs(a - b) <= 0.01;
const rows = async (q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as Array<Record<string, unknown>>;

const checks: Array<[string, boolean, string]> = [];
const check = (n: string, ok: boolean, d = "") => checks.push([n, ok, d]);

async function verifyPeriod(period: DashboardPeriod) {
  const { from, to } = periodRange(period);
  const d = await getDashboardData(period);
  const tag = `[${period}]`;

  const [led] = await rows(sql`
    select count(*)::int as n, coalesce(sum(total_sales),0) as sales, coalesce(sum(total_hpp),0) as hpp, coalesce(sum(gross_margin),0) as margin
    from ledger_entries where entry_date between ${from}::date and ${to}::date`);

  const trx = d.channels.reduce((s, c) => s + c.trx, 0);
  const omzet = d.channels.reduce((s, c) => s + c.omzet, 0);
  const hpp = d.channels.reduce((s, c) => s + c.hpp, 0);
  const mdr = d.channels.reduce((s, c) => s + c.mdr, 0);
  const biaya = d.channels.reduce((s, c) => s + c.biaya, 0);
  const labaBersih = omzet - hpp - mdr - biaya;

  check(`${tag} jumlah transaksi = jumlah baris ledger (${num(led.n)})`, trx === num(led.n), `${trx} vs ${num(led.n)}`);
  check(`${tag} HPP = Σ ledger.total_hpp`, near(hpp, num(led.hpp)), `${hpp} vs ${num(led.hpp)}`);
  check(`${tag} omzet − MDR − biaya = Σ ledger.total_sales (MDR tidak terpotong dua kali)`, near(omzet - mdr - biaya, num(led.sales)), `${omzet - mdr - biaya} vs ${num(led.sales)}`);
  check(`${tag} laba bersih = Σ ledger.gross_margin`, near(labaBersih, num(led.margin)), `${labaBersih} vs ${num(led.margin)}`);

  // Rincian: tiap kanal harus cocok dengan SQL per kanal
  for (const ch of d.channels) {
    const [r] = await rows(sql`select count(*)::int as n, coalesce(sum(total_sales),0) as sales from ledger_entries
      where channel = ${ch.key}::ledger_channel and entry_date between ${from}::date and ${to}::date`);
    check(`${tag} kanal ${ch.key}: trx & penjualan bersih cocok`, ch.trx === num(r.n) && near(ch.omzet - ch.mdr - ch.biaya, num(r.sales)), `${ch.trx}/${ch.omzet - ch.mdr - ch.biaya} vs ${num(r.n)}/${num(r.sales)}`);
    check(`${tag} kanal ${ch.key}: tak ada nilai negatif/NaN`, [ch.omzet, ch.hpp, ch.mdr, ch.biaya, ch.pending].every((v) => Number.isFinite(v) && v >= 0));
  }

  // Dana tertahan tidak bergantung periode
  const [pend] = await rows(sql`select coalesce(sum(net_amount),0) as p from outbound_transactions where channel='marketplace' and status='pending_settlement'`);
  const mp = d.channels.find((c) => c.key === "marketplace")!;
  check(`${tag} dana tertahan marketplace = Σ net_amount pending (${num(pend.p)})`, near(mp.pending, num(pend.p)), `${mp.pending} vs ${num(pend.p)}`);

  check(`${tag} 7 titik tren`, d.trend.length === 7);
  check(`${tag} transaksi terkini ≤ 8 dan terisi bila ada ledger`, d.recent.length <= 8 && (num(led.n) === 0 || d.recent.length > 0), `${d.recent.length}`);
  return d;
}

async function main() {
  const d = await verifyPeriod("tahun");
  await verifyPeriod("bulan_ini");
  await verifyPeriod("hari_ini");

  // Stok — independen dari kode dashboard
  const [prod] = await rows(sql`select count(*)::int as n from products where is_active`);
  const [val] = await rows(sql`select coalesce(sum(remaining*hpp),0) as v from batches where remaining > 0`);
  const stockRows = await rows(sql`
    select coalesce(sum(b.remaining),0)::int as stok, v.min_stock as min
    from variants v join products p on p.id = v.product_id and p.is_active
    left join batches b on b.variant_id = v.id where v.is_active group by v.id`);
  const habis = stockRows.filter((r) => num(r.stok) === 0).length;
  const rendah = stockRows.filter((r) => num(r.stok) > 0 && num(r.stok) <= num(r.min)).length;
  const [ed] = await rows(sql`select count(*)::int as n from batches where remaining > 0 and expired_date >= current_date and expired_date <= current_date + interval '30 days'`);

  check(`stok: total produk aktif = ${num(prod.n)}`, d.stock.totalProduk === num(prod.n), String(d.stock.totalProduk));
  check(`stok: nilai persediaan = Σ remaining × hpp (${num(val.v)})`, near(d.stock.nilaiPersediaan, num(val.v)), String(d.stock.nilaiPersediaan));
  check(`stok: habis = ${habis}`, d.stock.stokHabis === habis, String(d.stock.stokHabis));
  check(`stok: rendah = ${rendah}`, d.stock.stokRendah === rendah, String(d.stock.stokRendah));
  check(`stok: mendekati ED (≤30 hari) = ${num(ed.n)}`, d.stock.mendekatiEd === num(ed.n), String(d.stock.mendekatiEd));
  check("stok: daftar 'perlu perhatian' hanya yang ≤ batas minimum, terurut naik", d.lowStock.every((s) => s.stok <= s.min) && d.lowStock.every((s, i, a) => i === 0 || a[i - 1].stok <= s.stok));

  console.log("🧪 Uji angka dashboard /admin\n");
  let failed = 0;
  for (const [n, ok, det] of checks) {
    console.log(`   ${ok ? "✓" : "✗"} ${n}${ok ? "" : "  → " + det}`);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `\n🎉 Semua ${checks.length} cek LULUS` : `\n❌ ${failed}/${checks.length} cek GAGAL`);

  console.log("\n— ringkasan 'tahun ini' (untuk dibaca manusia) —");
  for (const c of d.channels) console.log(`   ${c.label.padEnd(14)} trx ${String(c.trx).padStart(2)} · omzet ${Math.round(c.omzet).toLocaleString("id-ID").padStart(11)} · HPP ${Math.round(c.hpp).toLocaleString("id-ID").padStart(10)} · MDR ${Math.round(c.mdr).toLocaleString("id-ID").padStart(7)} · biaya ${Math.round(c.biaya).toLocaleString("id-ID").padStart(9)} · pending ${Math.round(c.pending).toLocaleString("id-ID")}`);
  console.log(`   stok: ${d.stock.totalProduk} produk · rendah ${d.stock.stokRendah} · habis ${d.stock.stokHabis} · ED ≤30hr ${d.stock.mendekatiEd} · nilai Rp${Math.round(d.stock.nilaiPersediaan).toLocaleString("id-ID")}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error("❌ Error:", e); process.exit(1); });
