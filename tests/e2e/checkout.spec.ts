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

// Akun ini dibuat oleh `npm run db:seed:demo` (lengkap dengan alamat kirim),
// jadi suite ini bisa dijalankan ulang tanpa membuat akun manual.
const CUSTOMER = { email: "budi@example.com", password: cred("SEED_CUSTOMER_PASSWORD") };

// ── helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|kata sandi/i).fill(password);
  // Scope ke <form>: navbar juga punya tombol "Masuk" → selector global ambigu.
  await page.locator("form").getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL(/\/(shop|account|\/?$)/, { timeout: 10_000 });
}

/**
 * Tambah satu produk ke keranjang. `query` menyaring lewat kotak cari /shop
 * supaya produk yang terpilih deterministik — penting untuk uji voucher yang
 * punya minimum belanja (SEHAT10: min Rp100.000).
 */
async function addProductToCart(page: Page, query?: string) {
  await page.goto("/shop");
  if (query) {
    await page.getByPlaceholder(/cari produk/i).fill(query);
  }
  const addBtn = page.getByRole("button", { name: /^tambah$/i }).first();
  await expect(addBtn).toBeVisible({ timeout: 8_000 });
  await addBtn.click();
  // Tunggu konfirmasi: CartContext menulis ke localStorage lewat useEffect, jadi
  // pindah halaman terlalu cepat bisa kehilangan item.
  await expect(page.getByRole("button", { name: /ditambahkan/i }).first()).toBeVisible({ timeout: 5_000 });
}

// ── Kontrol akses ─────────────────────────────────────────────────────────────
// Harus di describe sendiri tanpa beforeEach: kalau tidak, sesi sudah terpasang
// dan redirect ke /login tidak akan pernah terjadi.
test.describe("Checkout — kontrol akses", () => {
  test("halaman checkout menolak pengunjung tanpa sesi", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});

// ── Alur belanja ──────────────────────────────────────────────────────────────

test.describe("Alur Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, CUSTOMER.email, CUSTOMER.password);
  });

  test("halaman /shop menampilkan produk dari DB", async ({ page }) => {
    await page.goto("/shop");
    const cards = page.locator('[data-testid="product-card"], .group.flex.h-full');
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("tambah produk ke keranjang dari halaman toko", async ({ page }) => {
    await addProductToCart(page);
  });

  test("halaman keranjang menampilkan item yang ditambahkan", async ({ page }) => {
    await addProductToCart(page);
    await page.goto("/cart");
    // "Keranjang Belanja" hanya dirender saat keranjang TIDAK kosong — kalau
    // kosong judulnya "Keranjang Anda Kosong", jadi ini asersi yang bermakna.
    await expect(page.getByRole("heading", { name: /keranjang belanja/i })).toBeVisible({ timeout: 8_000 });
    // Tiap baris item memuat nama produk dalam <h3>.
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 5_000 });
  });

  test("checkout menampilkan alamat pengiriman & opsi kirim", async ({ page }) => {
    await addProductToCart(page);
    await page.goto("/checkout");
    // Halaman checkout tidak memakai elemen <form> — pakai judul section.
    await expect(page.getByRole("heading", { name: /^checkout$/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/alamat pengiriman/i).first()).toBeVisible();
    await expect(page.getByText(/pilih pengiriman/i).first()).toBeVisible();
  });

  test("voucher SEHAT10 berhasil divalidasi di checkout", async ({ page }) => {
    // Nebulizer (Rp620.000) melewati minimum belanja SEHAT10 (Rp100.000).
    await addProductToCart(page, "Nebulizer");
    await page.goto("/checkout");
    const voucherInput = page.getByPlaceholder(/kode promo/i);
    await expect(voucherInput).toBeVisible({ timeout: 8_000 });
    await voucherInput.fill("SEHAT10");
    await page.getByRole("button", { name: /^pakai$/i }).click();
    // Sukses → "✓ SEHAT10 — hemat Rp…" dan tombol berubah jadi "Hapus".
    await expect(page.getByText(/SEHAT10/).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/hemat/i).first()).toBeVisible();
  });
});
