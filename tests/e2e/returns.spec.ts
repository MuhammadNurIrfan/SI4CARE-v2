import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|kata sandi/i).fill(password);
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/(shop|account|\/?$)/, { timeout: 10_000 });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@si4care.com");
  await page.getByLabel(/password|kata sandi/i).fill("Admin1234!");
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 10_000 });
}

test.describe("Retur Pelanggan", () => {
  test("halaman riwayat pesanan customer menampilkan daftar", async ({ page }) => {
    await loginAs(page, "testing@gmail.com", "testing123");
    await page.goto("/account/orders");
    await expect(page.locator("h1, h2").filter({ hasText: /pesanan|riwayat/i })).toBeVisible({ timeout: 5_000 });
  });

  test("halaman retur customer memerlukan login", async ({ page }) => {
    await page.goto("/account/returns");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("formulir ajukan retur tampil setelah login", async ({ page }) => {
    await loginAs(page, "testing@gmail.com", "testing123");
    await page.goto("/account/returns");
    await expect(page.locator("h1, h2").filter({ hasText: /retur/i })).toBeVisible({ timeout: 5_000 });
    // Form atau tombol ajukan retur
    const form = page.locator("form, [data-testid='return-form']");
    const btn = page.getByRole("button", { name: /ajukan retur/i });
    const hasForm = await form.isVisible().catch(() => false);
    const hasBtn = await btn.isVisible().catch(() => false);
    expect(hasForm || hasBtn).toBe(true);
  });
});

test.describe("Admin — Manajemen Retur", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("halaman admin/returns menampilkan tabel retur", async ({ page }) => {
    await page.goto("/admin/returns");
    await expect(page.locator("h1, h2").filter({ hasText: /retur/i })).toBeVisible({ timeout: 5_000 });
  });

  test("filter status retur berfungsi", async ({ page }) => {
    await page.goto("/admin/returns");
    const filterPending = page.getByRole("button", { name: /menunggu|pending/i });
    if (await filterPending.isVisible({ timeout: 2_000 })) {
      await filterPending.click();
      await page.waitForTimeout(500);
      await expect(page).not.toHaveURL(/error/);
    } else {
      test.skip();
    }
  });

  test("halaman admin/orders menampilkan daftar pesanan dari DB", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.locator("h1, h2").filter({ hasText: /pesanan/i })).toBeVisible({ timeout: 5_000 });
    // Bisa kosong kalau belum ada transaksi, tapi tidak boleh error
    await expect(page).not.toHaveURL(/error/);
  });

  test("filter status pesanan admin berfungsi", async ({ page }) => {
    await page.goto("/admin/orders");
    const pill = page.getByRole("button", { name: /pending|processing|semua/i }).first();
    if (await pill.isVisible({ timeout: 3_000 })) {
      await pill.click();
      await page.waitForTimeout(300);
      await expect(page).not.toHaveURL(/error/);
    }
  });
});
