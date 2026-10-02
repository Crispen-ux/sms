import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const ROLE_DASHBOARDS: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  SCHOOL_ADMIN: "/admin",
  PRINCIPAL: "/admin",
  TEACHER: "/teacher",
  ACCOUNTANT: "/admin/finance",
  ADMISSIONS_OFFICER: "/admin/admissions",
  PARENT: "/parent",
  STUDENT: "/student",
};

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = (session.user as any).role as string;
  const dashboard = ROLE_DASHBOARDS[role] || "/";

  // If there's a callbackUrl, use that instead
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl");

  if (callbackUrl && callbackUrl.startsWith("/")) {
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  return NextResponse.redirect(new URL(dashboard, request.url));
}
