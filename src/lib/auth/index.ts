import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { createRateLimitStorage } from "./rate-limit-storage";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  rateLimit: {
    // Hanya di production: suite E2E login berulang dari IP yang sama dan akan
    // terkena batas. Sebelumnya `enabled: false` permanen, sehingga production
    // berjalan tanpa proteksi brute-force.
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    customStorage: createRateLimitStorage(),
    customRules: {
      // Batas jangka panjang untuk tebak-password. Bawaan Better Auth (3 per 10 detik)
      // tidak menahan brute-force yang melambat: ±21.000 percobaan/hari lolos.
      "/sign-in/email": { window: 15 * 60, max: 10 },
      "/sign-up/email": { window: 60 * 60, max: 10 },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "customer",
      },
      phone: {
        type: "string",
        input: true,
        required: false,
      },
    },
  },
});
