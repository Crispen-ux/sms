import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createAssessmentSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("academics.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { subject: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const subjectId = searchParams.get("subjectId");
  if (subjectId) where.subjectId = subjectId;

  const academicYearId = searchParams.get("academicYearId");
  if (academicYearId) where.academicYearId = academicYearId;

  const type = searchParams.get("type");
  if (type && type !== "ALL") where.type = type;

  const studentId = searchParams.get("studentId");
  if (studentId) {
    where.results = { some: { studentId } };
  }

  const [assessments, total] = await Promise.all([
    db.assessment.findMany({
      where,
      include: {
        subject: { select: { name: true, code: true } },
        academicYear: { select: { name: true, active: true } },
        _count: { select: { results: true } },
      },
      orderBy: { date: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.assessment.count({ where }),
  ]);

  return NextResponse.json({ assessments, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createAssessmentSchema.parse(body);

    const assessment = await db.assessment.create({
      data: {
        academicYearId: data.academicYearId,
        subjectId: data.subjectId,
        title: data.title,
        type: data.type || "TEST",
        totalMarks: data.totalMarks,
        date: data.date ? new Date(data.date) : null,
      },
      include: {
        subject: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
    });

    await auditLog({
      userId: user.id,
      action: "assessment.created",
      resource: "assessment",
      resourceId: assessment.id,
      metadata: { title: data.title, subjectId: data.subjectId },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
