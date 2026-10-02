"use client";

import { createAuthClient } from "@neondatabase/auth/next";

let authClient: ReturnType<typeof createAuthClient> | null = null;

try {
  authClient = createAuthClient();
} catch {
  // Neon Auth not configured — social login disabled
}

export { authClient };
export const useSession = authClient?.useSession ?? (() => ({ data: null }));
