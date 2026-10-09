import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke test halaman back-office yang server action-nya baru diberi
 * `requireAdmin()` (reports, alarms, stock-opname). Tujuannya memastikan
 * gerbang auth tidak malah mematahkan halaman saat sesi admin ADA — guard yang
 * salah pasang akan tampak sebagai halaman kosong/error, bukan sebagai redirect.
 */

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@si4care.com");
  await page.getByLabel(/password|kata sandi/i).fill("Admin1234!");
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
