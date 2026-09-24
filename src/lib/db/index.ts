import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// TiDB Cloud Serverless MEWAJIBKAN TLS. XAMPP MariaDB lokal tidak support SSL.
// Deteksi environment dan set SSL sesuai (undefined untuk lokal dev, config object untuk prod).
const isLocalXampp = (process.env.DATABASE_URL ?? "").includes("3307");
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  ...(isLocalXampp ? {} : { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }),
});

export const db = drizzle(pool, { schema, mode: "default" });
