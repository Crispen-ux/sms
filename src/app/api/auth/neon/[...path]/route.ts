import { NextResponse } from "next/server";
import { getNeonAuth } from "@/lib/auth/neon-server";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const neonAuth = getNeonAuth();
  if (!neonAuth) {
    return NextResponse.json({ error: "Social login not configured" }, { status: 503 });
  }
  const { GET } = neonAuth.handler();
  return GET(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const neonAuth = getNeonAuth();
  if (!neonAuth) {
    return NextResponse.json({ error: "Social login not configured" }, { status: 503 });
  }
  const { POST } = neonAuth.handler();
  return POST(request, context);
}
