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
 * Judul halaman admin diduplikasi untuk layout desktop & mobile (satu versi
 * tersembunyi per viewport), jadi selector tanpa filter visibilitas memicu
 * strict mode violation — bukan karena halamannya salah.
 */
const heading = (page: Page, re: RegExp) =>
  page.locator("h1, h2").filter({ hasText: re }).filter({ visible: true }).first();

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|kata sandi/i).fill(password);
  await page.locator("form").getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/(shop|account|\/?$)/, { timeout: 10_000 });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@si4care.com");
  await page.getByLabel(/password|kata sandi/i).fill(cred("SEED_ADMIN_PASSWORD"));
  await page.locator("form").getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 10_000 });
}

test.describe("Retur Pelanggan", () => {
  test("halaman riwayat pesanan customer menampilkan daftar", async ({ page }) => {
    await loginAs(page, "budi@example.com", cred("SEED_CUSTOMER_PASSWORD"));
    await page.goto("/account/orders");
    await expect(heading(page, /pesanan|riwayat/i)).toBeVisible({ timeout: 5_000 });
  });

  test("halaman retur customer memerlukan login", async ({ page }) => {
    await page.goto("/account/returns");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("formulir ajukan retur tampil setelah login", async ({ page }) => {
    await loginAs(page, "budi@example.com", cred("SEED_CUSTOMER_PASSWORD"));
    await page.goto("/account/returns");
    await expect(heading(page, /retur/i)).toBeVisible({ timeout: 5_000 });
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
    await expect(heading(page, /retur/i)).toBeVisible({ timeout: 5_000 });
  });

  test("filter status retur berfungsi", async ({ page }) => {
    await page.goto("/admin/returns");
    // Jangan pakai `if (await x.isVisible()) ... else test.skip()`: isVisible() tidak menunggu dan
    // mengabaikan opsi timeout, jadi bila halaman belum selesai dirender tes diam-diam di-skip.
    const filterPending = page.getByRole("button", { name: /pending/i });
    await expect(filterPending).toBeVisible({ timeout: 10_000 });
    await filterPending.click();
    // Kartu filter aktif ditandai border primary.
    await expect(filterPending).toHaveClass(/border-primary/);
    await expect(page).not.toHaveURL(/error/);
  });

  test("halaman admin/orders menampilkan daftar pesanan dari DB", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(heading(page, /pesanan/i)).toBeVisible({ timeout: 5_000 });
    // Bisa kosong kalau belum ada transaksi, tapi tidak boleh error
    await expect(page).not.toHaveURL(/error/);
  });

  test("filter status pesanan admin berfungsi", async ({ page }) => {
    await page.goto("/admin/orders");
    const pill = page.getByRole("button", { name: /menunggu bayar/i }).first();
    await expect(pill).toBeVisible({ timeout: 10_000 });
    await pill.click();
    await expect(page).not.toHaveURL(/error/);
    // Data demo memuat satu pesanan "Menunggu Bayar" — harus tetap terlihat setelah difilter.
    await expect(page.getByText(/menunggu bayar/i).first()).toBeVisible();
  });
});
