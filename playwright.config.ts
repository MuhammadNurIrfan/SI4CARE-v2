import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Dev server (Turbopack) mengompilasi rute saat pertama dibuka dan melayani 2 worker sekaligus;
  // 30 detik sempat terlampaui pada tes checkout yang sebenarnya sehat.
  timeout: 60_000,
  retries: 0,
  // 1 worker: dev server tunggal + banyak tes yang login berulang. Dengan 2 worker tes yang sehat
  // sesekali melewati batas waktu saat mesin sedang sibuk (bukan bug aplikasi) — andal lebih penting dari cepat.
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  // Dev server harus sudah berjalan (npm run dev) sebelum menjalankan e2e
  // webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
