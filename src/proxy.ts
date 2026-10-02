import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route protection model (Next.js 16 "proxy" — formerly middleware):
 *
 *  - Public marketing/auth pages  → accessible without a session
 *  - Portal pages (/admin, /teacher, /parent, /student) → session + role required
 *  - API routes → pass through here; every API route enforces its own
 *    authentication and permissions (apiAuth / requireAuth), so API calls
 *    are never redirected to the login page (they return 401/403 JSON).
 *
 * Module availability is enforced separately in the portal layouts — see
 * src/lib/modules.ts and src/components/ModuleDisabled.tsx.
 */

const PORTAL_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"] },
  {
    prefix: "/teacher",
    roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"],
  },
  { prefix: "/parent", roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "PARENT"] },
  { prefix: "/student", roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "STUDENT"] },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and framework assets
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // API routes handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const portal = PORTAL_ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(route.prefix + "/")
  );

  // Everything outside the portals (marketing site, contact, admissions,
  // login/signup/password reset) is public.
  if (!portal) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https"),
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  if (!portal.roles.includes(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
