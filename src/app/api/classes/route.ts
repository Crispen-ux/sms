import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createClassSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("classes.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }

  const [classes, total] = await Promise.all([
    db.class.findMany({
      where,
      include: {
        grade: { select: { name: true } },
        academicYear: { select: { name: true } },
        _count: { select: { enrolments: true, teacherClasses: true } },
      },
      orderBy: { name: "asc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.class.count({ where }),
  ]);

  return NextResponse.json({ classes, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createClassSchema.parse(body);

    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school configured" }, { status: 400 });
    }

    const cls = await db.class.create({
      data: {
        schoolId: school.id,
        name: data.name,
        gradeId: data.gradeId,
        academicYearId: data.academicYearId,
        capacity: data.capacity ?? 40,
      },
      include: { grade: { select: { name: true } }, academicYear: { select: { name: true } } },
    });

    await auditLog({
      userId: user.id,
      action: "class.created",
      resource: "class",
      resourceId: cls.id,
      metadata: { name: cls.name },
    });

    return NextResponse.json(cls, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}
