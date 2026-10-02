import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || undefined;
  const action = searchParams.get("action") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");

  const where: any = {};
  if (resource) where.resource = resource;
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
      { resourceId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.auditLog.count({ where }),
  ]);

  // Get distinct resources for filter dropdown
  const resources = await db.auditLog.findMany({
    select: { resource: true },
    distinct: ["resource"],
    orderBy: { resource: "asc" },
  });

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    resources: resources.map((r) => r.resource),
  });
}
