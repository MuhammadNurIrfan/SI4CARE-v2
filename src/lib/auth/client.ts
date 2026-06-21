"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./index";

// Tanpa baseURL — request otomatis ke origin saat ini (/api/auth/*), cocok karena
// auth server & client app berjalan di aplikasi Next.js yang sama.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
