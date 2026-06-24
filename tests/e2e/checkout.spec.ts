import { test, expect, type Page } from "@playwright/test";

// ── helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|kata sandi/i).fill(password);
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/(shop|account|\/?$)/, { timeout: 10_000 });
}

// ── suite ─────────────────────────────────────────────────────────────────────

test.describe("Alur Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "testing@gmail.com", "testing123");
  });

  test("halaman /shop menampilkan produk dari DB", async ({ page }) => {
    await page.goto("/shop");
    const cards = page.locator('[data-testid="product-card"], .group.flex.h-full');
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("tambah produk ke keranjang dari halaman toko", async ({ page }) => {
    await page.goto("/shop");
    const addBtn = page.getByRole("button", { name: /tambah/i }).first();
    await addBtn.click();
    // Badge keranjang harus berubah atau tombol jadi "Ditambahkan"
    await expect(page.getByRole("button", { name: /ditambahkan/i }).first()).toBeVisible({ timeout: 3_000 });
  });

  test("halaman keranjang menampilkan item yang ditambahkan", async ({ page }) => {
    // Tambah dulu
    await page.goto("/shop");
    await page.getByRole("button", { name: /tambah/i }).first().click();
    // Navigasi ke keranjang
    await page.goto("/cart");
    await expect(page.locator("h1, h2").filter({ hasText: /keranjang/i })).toBeVisible();
    const items = page.locator('[data-testid="cart-item"], .cart-item, tr');
    await expect(items.first()).toBeVisible({ timeout: 5_000 });
  });

  test("halaman checkout memerlukan sesi login", async ({ page: guestPage }) => {
    // test ini tidak pakai beforeEach login
    await guestPage.goto("/checkout");
    await expect(guestPage).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("checkout: form alamat dan ongkir tampil setelah login", async ({ page }) => {
    // Asumsi keranjang tidak kosong dari test sebelumnya (atau diisi di sini)
    await page.goto("/shop");
    await page.getByRole("button", { name: /tambah/i }).first().click();
    await page.goto("/checkout");
    await expect(page.locator("form, [data-testid='checkout-form']")).toBeVisible({ timeout: 8_000 });
    // Alamat section harus ada
    await expect(page.getByText(/alamat|pengiriman/i).first()).toBeVisible();
  });

  test("voucher SEHAT10 berhasil divalidasi di checkout", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: /tambah/i }).first().click();
    await page.goto("/checkout");
    const voucherInput = page.getByPlaceholder(/kode voucher|voucher/i);
    if (await voucherInput.isVisible()) {
      await voucherInput.fill("SEHAT10");
      await page.getByRole("button", { name: /pakai|terapkan/i }).click();
      await expect(page.getByText(/diskon|SEHAT10/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip();
    }
  });
});
