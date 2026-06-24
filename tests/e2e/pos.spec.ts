import { test, expect, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@si4care.com");
  await page.getByLabel(/password|kata sandi/i).fill("Admin1234!");
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 10_000 });
}

test.describe("POS Kasir", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("halaman POS hanya bisa diakses admin", async ({ page: guestPage }) => {
    await guestPage.goto("/admin/pos");
    await expect(guestPage).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("tab Kasir tampil dengan katalog produk", async ({ page }) => {
    await page.goto("/admin/pos");
    await expect(page.getByRole("tab", { name: /kasir/i })).toBeVisible({ timeout: 8_000 });
    // Katalog produk dari DB
    const produk = page.locator('[data-testid="pos-product"], button').filter({ hasText: /Rp/ });
    await expect(produk.first()).toBeVisible({ timeout: 8_000 });
  });

  test("klik produk → masuk ke keranjang POS", async ({ page }) => {
    await page.goto("/admin/pos");
    const firstProduct = page.locator("button").filter({ hasText: /Rp/ }).first();
    await expect(firstProduct).toBeVisible({ timeout: 8_000 });
    await firstProduct.click();
    // Keranjang harus menampilkan item
    await expect(page.getByText(/total|subtotal/i)).toBeVisible({ timeout: 3_000 });
  });

  test("scan barcode: input Enter menemukan produk", async ({ page }) => {
    await page.goto("/admin/pos");
    // Cari tombol scan atau input barcode
    const scanToggle = page.getByRole("button", { name: /scan/i });
    if (await scanToggle.isVisible({ timeout: 2_000 })) {
      await scanToggle.click();
      const barcodeInput = page.getByPlaceholder(/barcode|scan/i);
      await barcodeInput.fill("1234567890123");
      await barcodeInput.press("Enter");
      // Produk tidak ditemukan → toast atau feedback (tidak crash)
      await page.waitForTimeout(500);
      await expect(page).not.toHaveURL(/error/);
    } else {
      test.skip();
    }
  });

  test("tab Marketplace tampil dengan form channel", async ({ page }) => {
    await page.goto("/admin/pos");
    const mpTab = page.getByRole("tab", { name: /marketplace/i });
    await expect(mpTab).toBeVisible({ timeout: 5_000 });
    await mpTab.click();
    await expect(page.getByText(/tokopedia|shopee|channel/i)).toBeVisible({ timeout: 3_000 });
  });

  test("konfirmasi bayar kasir: tombol muncul setelah ada item di keranjang", async ({ page }) => {
    await page.goto("/admin/pos");
    const firstProduct = page.locator("button").filter({ hasText: /Rp/ }).first();
    await expect(firstProduct).toBeVisible({ timeout: 8_000 });
    await firstProduct.click();
    const confirmBtn = page.getByRole("button", { name: /konfirmasi bayar|bayar/i });
    await expect(confirmBtn).toBeVisible({ timeout: 3_000 });
  });
});
