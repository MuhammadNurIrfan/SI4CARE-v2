import { test, expect, type Page } from "@playwright/test";

/**
 * Etalase publik. Regresi untuk halaman yang dulu tampak benar tapi tidak membaca DB:
 *  - /shop/[id] mengabaikan ID dan selalu menampilkan satu produk demo
 *  - landing menampilkan produk & artikel karangan
 * Tanpa login — semua halaman ini publik.
 */



/** Kotak cari /shop. Di mobile ada dua kotak (panel filter di-mount lewat portal) — ambil yang terlihat,
 *  kalau tidak locator kena strict-mode violation pada saat portal sudah terpasang. */
const searchBox = (page: Page) => page.getByPlaceholder(/cari produk/i).filter({ visible: true }).first();
test.describe("Detail produk", () => {
  test("menampilkan produk yang diklik, bukan produk demo", async ({ page }) => {
    await page.goto("/shop");
    await searchBox(page).fill("Nebulizer");
    const card = page.locator('a[href^="/shop/"]').filter({ hasText: /Nebulizer/i }).first();
    await expect(card).toBeVisible({ timeout: 8_000 });
    await card.click();

    await expect(page).toHaveURL(/\/shop\/[0-9a-f-]{36}/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Nebulizer/i);
    // Harga dari DB (Rp620.000) — bukan harga produk demo lama (Rp540.000 / Rp650.000).
    await expect(page.getByText(/620\.000/).first()).toBeVisible();
  });

  test("produk bervarian menampilkan pemilih varian", async ({ page }) => {
    await page.goto("/shop");
    await searchBox(page).fill("Tensimeter");
    await page.locator('a[href^="/shop/"]').filter({ hasText: /Tensimeter/i }).first().click();
    await expect(page.getByText(/pilih varian/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("button", { pressed: true })).toHaveCount(1);
  });

  test("tidak menampilkan rating/ulasan karangan", async ({ page }) => {
    await page.goto("/shop");
    await searchBox(page).fill("Masker");
    await page.locator('a[href^="/shop/"]').filter({ hasText: /Masker/i }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/ulasan|terjual/i)).toHaveCount(0);
  });

  test("tambah ke keranjang dari halaman detail → muncul di keranjang", async ({ page }) => {
    await page.goto("/shop");
    await searchBox(page).fill("Nebulizer");
    await page.locator('a[href^="/shop/"]').filter({ hasText: /Nebulizer/i }).first().click();
    await page.getByRole("button", { name: /^keranjang$/i }).click();
    await expect(page.getByText(/ditambahkan/i).first()).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /keranjang belanja/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("h3").filter({ hasText: /Nebulizer/i }).first()).toBeVisible();
  });

  test("ID produk tidak dikenal → halaman tidak ditemukan", async ({ page }) => {
    // Status HTTP 404 tidak diasersi di sini: di `next dev` respons di-stream sehingga status
    // sudah 200 sebelum notFound() sempat dipanggil. Status sebenarnya diverifikasi di build production.
    await page.goto("/shop/id-yang-tidak-ada");
    // Heading, bukan getByText: teks "tidak ditemukan" juga cocok ke <title> yang tersembunyi.
    await expect(page.getByRole("heading", { name: /halaman tidak ditemukan/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /keranjang/i })).toHaveCount(0);
  });
});

test.describe("Klaim angka", () => {
  test("kartu produk tidak menampilkan rating / jumlah terjual karangan", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator('a[href^="/shop/"]').first()).toBeAttached({ timeout: 10_000 });
    // Dulu setiap kartu menampilkan nilai bawaan "★ 4.8 · 0 terjual" walau belum ada fitur ulasan.
    await expect(page.getByText(/terjual/i)).toHaveCount(0);
  });

  test("landing tidak memuat statistik ulasan karangan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/2\.847/)).toHaveCount(0);
  });
});

test.describe("Landing page", () => {
  test("produk unggulan berasal dari DB, bukan data contoh", async ({ page }) => {
    await page.goto("/");
    // Produk unggulan dirender sebagai kartu bertaut ke /shop/{id}.
    await expect(page.locator('a[href^="/shop/"]').first()).toBeAttached({ timeout: 10_000 });
    // "Stetoskop Littmann Classic III" hanya ada di data contoh lama; tidak ada produk itu di toko.
    // (Kata "Littmann" sendiri tetap muncul di daftar merek, jadi cocokkan nama produk lengkapnya.)
    await expect(page.getByText(/littmann classic/i)).toHaveCount(0);
  });

  test("artikel menaut ke halaman blog sungguhan", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href^="/blog/"]').first();
    await expect(link).toBeAttached({ timeout: 10_000 });
    const href = await link.getAttribute("href");
    expect(href).not.toBe("/blog"); // dulu semua kartu artikel menaut ke /blog polos

    const res = await page.goto(href!);
    expect(res?.status()).toBe(200);
  });
});
