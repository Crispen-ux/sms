import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createAcademicYearSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("classes.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }

  const [years, total] = await Promise.all([
    db.academicYear.findMany({
      where,
      include: { _count: { select: { enrolments: true, classes: true } } },
      orderBy: { startYear: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.academicYear.count({ where }),
  ]);

  return NextResponse.json({ years, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createAcademicYearSchema.parse(body);

    // Get school (first school for now)
    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school configured" }, { status: 400 });
    }

    // If setting as active, deactivate others
    if (data.active) {
      await db.academicYear.updateMany({
        where: { schoolId: school.id, active: true },
        data: { active: false },
      });
    }

    const year = await db.academicYear.create({
      data: {
        schoolId: school.id,
        name: data.name,
        startYear: data.startYear,
        endYear: data.endYear,
        active: data.active ?? false,
      },
    });

    await auditLog({
      userId: user.id,
      action: "academic_year.created",
      resource: "academicYear",
      resourceId: year.id,
      metadata: { name: year.name },
    });

    return NextResponse.json(year, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create academic year" }, { status: 500 });
  }
}
