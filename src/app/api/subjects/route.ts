import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createSubjectSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("classes.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [subjects, total] = await Promise.all([
    db.subject.findMany({
      where,
      include: { _count: { select: { teacherSubjects: true, assessments: true } } },
      orderBy: { name: "asc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.subject.count({ where }),
  ]);

  return NextResponse.json({ subjects, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createSubjectSchema.parse(body);

    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school configured" }, { status: 400 });
    }

    const subject = await db.subject.create({
      data: {
        schoolId: school.id,
        name: data.name,
        code: data.code,
      },
    });

    await auditLog({
      userId: user.id,
      action: "subject.created",
      resource: "subject",
      resourceId: subject.id,
      metadata: { name: subject.name },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
