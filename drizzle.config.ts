import { defineConfig } from "drizzle-kit";

// TiDB Cloud Serverless mewajibkan TLS. Sisipkan param ssl ke connection string
// bila belum ada — mysql2 (dipakai drizzle-kit) mem-parse `?ssl={...}` dari URL.
const rawUrl = process.env.DATABASE_URL ?? "";
const dbUrl =
  rawUrl && !/[?&]ssl=/.test(rawUrl)
    ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}ssl={"rejectUnauthorized":true}`
    : rawUrl;

export default defineConfig({
  dialect: "mysql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbUrl,
  },
});
