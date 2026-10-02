import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createGradeSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("classes.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { phase: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [grades, total] = await Promise.all([
    db.grade.findMany({
      where,
      include: { _count: { select: { classes: true, enrolments: true } } },
      orderBy: { sortOrder: "asc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.grade.count({ where }),
  ]);

  return NextResponse.json({ grades, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createGradeSchema.parse(body);

    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school configured" }, { status: 400 });
    }

    const grade = await db.grade.create({
      data: {
        schoolId: school.id,
        name: data.name,
        phase: data.phase,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await auditLog({
      userId: user.id,
      action: "grade.created",
      resource: "grade",
      resourceId: grade.id,
      metadata: { name: grade.name },
    });

    return NextResponse.json(grade, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create grade" }, { status: 500 });
  }
}
