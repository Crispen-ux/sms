"use client";

import {
  createAuthClient,
  type NeonAuthPublicApi,
} from "@neondatabase/auth";
import {
  BetterAuthReactAdapter,
  type BetterAuthReactAdapterInstance,
} from "@neondatabase/auth/react/adapters";

const NEON_AUTH_BASE_PATH = "/api/auth/neon";

type NeonAuthClient = NeonAuthPublicApi<BetterAuthReactAdapterInstance>;

let authClient: NeonAuthClient | null = null;

try {
  authClient = createAuthClient<BetterAuthReactAdapterInstance>("", {
    adapter: BetterAuthReactAdapter({ basePath: NEON_AUTH_BASE_PATH }),
  });
} catch {
  // Neon Auth not configured — social login disabled
}

export { authClient };
export const useSession = authClient?.useSession ?? (() => ({ data: null }));
