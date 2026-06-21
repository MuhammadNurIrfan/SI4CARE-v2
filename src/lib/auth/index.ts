import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { redis } from "@/lib/redis";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema,
  }),
  rateLimit: {
    enabled: true,
    window: 900, // 15 menit
    max: 5,      // maks 5 percobaan login per window
    storage: "secondary-storage",
    customStorage: {
      get: async (key: string) => {
        const val = await redis.get<{ key: string; count: number; lastRequest: number }>(key);
        return val ?? undefined;
      },
      set: async (key: string, value: { key: string; count: number; lastRequest: number }) => {
        await redis.set(key, value, { ex: 900 });
      },
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
