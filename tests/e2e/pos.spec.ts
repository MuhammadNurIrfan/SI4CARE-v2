import { test, expect, type Page, type Locator } from "@playwright/test";

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

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@si4care.com");
  await page.getByLabel(/password|kata sandi/i).fill(cred("SEED_ADMIN_PASSWORD"));
  // Scope ke <form>: navbar juga punya tombol "Masuk" → selector global ambigu.
  await page.locator("form").getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 10_000 });
}

/**
 * Tab switcher POS bukan ARIA tabs — `pos-client.tsx` memakai <button> biasa
 * (label "Kasir Toko" / "Transaksi Marketplace"), jadi getByRole("tab") tidak cocok.
 */
const posTab = (page: Page, name: RegExp) => page.getByRole("button", { name });

/**
 * Panel keranjang desktop (`hidden lg:flex`) tetap ada di DOM saat viewport mobile,
 * jadi `.first()` tanpa filter bisa memilih elemen tersembunyi dan gagal "visible".
 */
const visibleText = (page: Page, re: RegExp): Locator =>
  page.getByText(re).filter({ visible: true }).first();
const visibleBtn = (page: Page, re: RegExp): Locator =>
  page.getByRole("button", { name: re }).filter({ visible: true }).first();

/** Tombol produk di katalog; kecualikan bar keranjang mobile yang juga memuat "Rp". */
const productButtons = (page: Page) =>
  page.locator("button").filter({ hasText: /Rp/ }).filter({ hasNotText: /keranjang/i });

/**
 * Keranjang POS: desktop = panel kanan, mobile = bottom sheet yang harus dibuka
 * lewat tombol "Keranjang". Tanpa ini test mobile gagal walau aplikasinya benar.
 */
async function openCart(page: Page) {
  const trigger = page.getByRole("button", { name: /^keranjang/i });
  if (await trigger.isVisible().catch(() => false)) await trigger.click();
}

// Akses tanpa login — harus di describe sendiri tanpa beforeEach, kalau tidak
// sesi admin sudah terpasang dan redirect ke /login tidak akan pernah terjadi.
test.describe("POS — kontrol akses", () => {
  test("halaman POS menolak pengunjung tanpa sesi", async ({ page }) => {
    await page.goto("/admin/pos");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});

test.describe("POS Kasir", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("tab Kasir tampil dengan katalog produk", async ({ page }) => {
    await page.goto("/admin/pos");
    await expect(posTab(page, /kasir/i)).toBeVisible({ timeout: 8_000 });
    await expect(productButtons(page).first()).toBeVisible({ timeout: 8_000 });
  });

  test("klik produk → masuk ke keranjang POS", async ({ page }) => {
    await page.goto("/admin/pos");
    const firstProduct = productButtons(page).first();
    await expect(firstProduct).toBeVisible({ timeout: 8_000 });
    await firstProduct.click();
    await openCart(page);
    await expect(visibleText(page, /subtotal/i)).toBeVisible({ timeout: 3_000 });
  });

  test("scan barcode: barcode tak dikenal memberi umpan balik, bukan crash", async ({ page }) => {
    await page.goto("/admin/pos");
    // Label teksnya `hidden sm:inline`, jadi tombol ini mengandalkan aria-label
    // agar punya nama aksesibel di viewport mobile.
    const scanToggle = page.getByRole("button", { name: /scan barcode/i });
    await expect(scanToggle).toBeVisible({ timeout: 5_000 });
    await scanToggle.click();
    // Placeholder pencarian juga memuat kata "barcode" → pakai penanda unik input scan.
    const barcodeInput = page.getByPlaceholder(/tekan enter/i);
    await barcodeInput.fill("1234567890123");
    await barcodeInput.press("Enter");
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible({ timeout: 3_000 });
  });

  test("tab Marketplace tampil dengan form channel", async ({ page }) => {
    await page.goto("/admin/pos");
    const mpTab = posTab(page, /marketplace/i);
    await expect(mpTab).toBeVisible({ timeout: 5_000 });
    await mpTab.click();
    await expect(visibleText(page, /tokopedia|shopee|channel/i)).toBeVisible({ timeout: 3_000 });
  });

  test("alur bayar: Proses Pembayaran membuka dialog dengan Konfirmasi Bayar", async ({ page }) => {
    await page.goto("/admin/pos");
    const firstProduct = productButtons(page).first();
    await expect(firstProduct).toBeVisible({ timeout: 8_000 });
    await firstProduct.click();
    await openCart(page);
    // "Konfirmasi Bayar" ada di dalam Dialog pembayaran — harus dibuka dulu
    // lewat "Proses Pembayaran" (disabled selama keranjang kosong).
    await visibleBtn(page, /proses pembayaran/i).click();
    await expect(page.getByRole("button", { name: /konfirmasi bayar/i })).toBeVisible({ timeout: 5_000 });
  });
});
