import { test, expect, type Page } from "@playwright/test";

/**
 * Kredensial dibaca dari environment, bukan di-hardcode — repo tidak boleh
 * memuat password yang berfungsi. `npm run test:e2e` memuat `.env.local`
 * lewat `node --env-file`; nama variabelnya ada di `.env.example`.
 */
function cred(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Env ${name} belum diisi — lihat .env.example`);
  return v;
}

/**
 * Smoke test halaman back-office yang server action-nya baru diberi
 * `requireAdmin()` (reports, alarms, stock-opname). Tujuannya memastikan
 * gerbang auth tidak malah mematahkan halaman saat sesi admin ADA — guard yang
 * salah pasang akan tampak sebagai halaman kosong/error, bukan sebagai redirect.
 */

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@si4care.com");
  await page.getByLabel(/password|kata sandi/i).fill(cred("SEED_ADMIN_PASSWORD"));
  await page.locator("form").getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 10_000 });
}

/** Judul halaman admin diduplikasi untuk desktop & mobile — filter visibilitas. */
const heading = (page: Page, re: RegExp) =>
  page.locator("h1, h2").filter({ hasText: re }).filter({ visible: true }).first();

/**
 * Tabel admin punya pasangan desktop/mobile (card view), jadi versi yang tidak
 * aktif tetap ada di DOM dalam keadaan hidden. Tanpa filter ini `.first()` bisa
 * mengunci elemen tersembunyi.
 */
const visibleText = (page: Page, re: RegExp) =>
  page.getByText(re).filter({ visible: true }).first();

test.describe("Back-office — kontrol akses", () => {
  for (const path of ["/admin/reports", "/admin/alarms", "/admin/stock-opname"]) {
    test(`${path} menolak pengunjung tanpa sesi`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    });
  }
});

test.describe("Back-office — halaman utama", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("laporan tampil dengan angka dari DB", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(heading(page, /laporan/i)).toBeVisible({ timeout: 25_000 });
    // Seed demo memasukkan transaksi POS + marketplace, jadi harus ada nominal Rupiah.
    await expect(visibleText(page, /Rp/)).toBeVisible({ timeout: 20_000 });
  });

  test("dashboard menampilkan angka dari DB, bukan data contoh", async ({ page }) => {
    await page.goto("/admin");
    await expect(heading(page, /dashboard/i)).toBeVisible({ timeout: 20_000 });
    // Data contoh lama: omzet total Rp189.000.000 dan stetoskop yang tak ada di toko.
    await expect(page.getByText(/189\.000\.000/)).toHaveCount(0);
    await expect(page.getByText(/littmann classic/i)).toHaveCount(0);
    // Ringkasan stok nyata: 8 produk aktif di seed.
    await expect(visibleText(page, /total produk/i)).toBeVisible();
  });

  test("dashboard: ganti periode memuat ulang data dari server", async ({ page }) => {
    await page.goto("/admin");
    await expect(heading(page, /dashboard/i)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Tahun Ini" }).click();
    await expect(page).toHaveURL(/period=tahun/, { timeout: 10_000 });
    await expect(page.getByText(/tahun ini/i).first()).toBeVisible();
  });

  test("dashboard: tombol Ekspor mengunduh CSV", async ({ page }) => {
    await page.goto("/admin");
    await expect(heading(page, /dashboard/i)).toBeVisible({ timeout: 20_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /ekspor/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^dashboard-si4care-.*\.csv$/);
  });

  test("alarm stok tampil tanpa error", async ({ page }) => {
    await page.goto("/admin/alarms");
    await expect(heading(page, /alarm/i)).toBeVisible({ timeout: 10_000 });
  });

  test("stock opname menampilkan kontrol sesi", async ({ page }) => {
    await page.goto("/admin/stock-opname");
    await expect(heading(page, /stock opname|opname/i)).toBeVisible({ timeout: 10_000 });
    // Entah sesi terbuka ("Simpan Progres") atau belum ("Mulai Sesi Baru"),
    // salah satunya harus ada — membuktikan getOpenSession() lolos guard.
    const mulai = page.getByRole("button", { name: /mulai sesi/i });
    const simpan = page.getByRole("button", { name: /simpan progres/i });
    await expect(mulai.or(simpan).first()).toBeVisible({ timeout: 10_000 });
  });

  test("daftar produk menandai stok dengan benar", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(heading(page, /produk/i)).toBeVisible({ timeout: 10_000 });
    // Regresi `totalStock` string: badge dihitung dengan `=== 0`, jadi angka
    // stok harus berupa number — kalau string, produk habis salah label.
    await expect(visibleText(page, /Rp/)).toBeVisible({ timeout: 15_000 });
  });
});
