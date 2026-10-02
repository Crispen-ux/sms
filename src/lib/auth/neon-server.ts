let _neonAuth: any = null;
let _initFailed = false;

export function getNeonAuth(): any {
  if (_initFailed) return null;
  if (_neonAuth) return _neonAuth;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl || !baseUrl.startsWith("http")) {
    console.warn("NEON_AUTH_BASE_URL not configured or invalid — social login disabled");
    _initFailed = true;
    return null;
  }

  try {
    // Dynamic require to avoid module-level crash if env var is wrong
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createNeonAuth } = require("@neondatabase/auth/next/server");
    _neonAuth = createNeonAuth({
      baseUrl,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET || "fallback-secret-change-in-production",
      },
    });
    return _neonAuth;
  } catch (e: any) {
    console.warn("Neon Auth init failed:", e.message);
    _initFailed = true;
    return null;
  }
}
