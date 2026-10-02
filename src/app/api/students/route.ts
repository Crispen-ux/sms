import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createStudentSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const params = paginationSchema.parse(Object.fromEntries(searchParams));

    const where: any = {};
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { studentNumber: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          guardianLinks: {
            include: { guardian: { select: { id: true, firstName: true, lastName: true, phone: true, relationship: true } } },
          },
          enrolments: {
            include: {
              grade: { select: { name: true } },
              class: { select: { name: true } },
              academicYear: { select: { name: true, active: true } },
            },
            orderBy: { enrolledAt: "desc" },
          },
        },
        orderBy: { firstName: "asc" },
        take: params.limit,
        skip: (params.page - 1) * params.limit,
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({ students, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
  } catch (e: any) {
    console.error("Error fetching students:", e);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createStudentSchema.parse(body);

    const student = await db.student.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        nationality: data.nationality,
        idNumber: data.idNumber,
        studentNumber: data.studentNumber,
      },
    });

    await auditLog({
      userId: user.id,
      action: "student.created",
      resource: "student",
      resourceId: student.id,
      metadata: { name: `${data.firstName} ${data.lastName}` },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    console.error("Error creating student:", e);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
