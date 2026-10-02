import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createEnrolmentSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { student: { firstName: { contains: params.search, mode: "insensitive" } } },
      { student: { lastName: { contains: params.search, mode: "insensitive" } } },
      { student: { studentNumber: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [enrolments, total] = await Promise.all([
    db.enrolment.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        grade: { select: { name: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true, active: true } },
      },
      orderBy: { enrolledAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.enrolment.count({ where }),
  ]);

  return NextResponse.json({ enrolments, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createEnrolmentSchema.parse(body);

    const createData: any = {
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      gradeId: data.gradeId,
      status: data.status || "ACTIVE",
    };
    if (data.classId) createData.classId = data.classId;

    const enrolment = await db.enrolment.create({
      data: createData,
      include: {
        student: { select: { firstName: true, lastName: true } },
        grade: { select: { name: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
    });

    await auditLog({
      userId: user.id,
      action: "enrolment.created",
      resource: "enrolment",
      resourceId: enrolment.id,
      metadata: { studentId: data.studentId, gradeId: data.gradeId },
    });

    return NextResponse.json(enrolment, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Student is already enrolled for this academic year" }, { status: 409 });
    }
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create enrolment" }, { status: 500 });
  }
}
