import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// TiDB Cloud Serverless (dan umumnya MySQL terkelola) MEWAJIBKAN koneksi TLS.
// Aktifkan SSL secara eksplisit agar tidak tergantung query-param di DATABASE_URL.
// rejectUnauthorized: true → verifikasi sertifikat server (TiDB pakai CA publik).
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

export const db = drizzle(pool, { schema, mode: "default" });
