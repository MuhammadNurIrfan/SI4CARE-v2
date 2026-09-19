import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// TiDB Cloud Serverless mewajibkan TLS. XAMPP MariaDB lokal tidak support SSL.
// Parse url dan cek environment: lokal dev = skip SSL, production = require SSL
const rawUrl = process.env.DATABASE_URL ?? "";
const isLocalXampp = rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1:3307");
const dbUrl =
  rawUrl && !isLocalXampp && !/[?&]ssl=/.test(rawUrl)
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
