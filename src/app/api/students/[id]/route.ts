import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { linkGuardianSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      guardianLinks: {
        include: { guardian: true },
      },
      enrolments: {
        include: {
          grade: { select: { name: true } },
          class: { select: { name: true } },
          academicYear: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await db.student.update({ where: { id }, data: body });
    await auditLog({ userId: user.id, action: "student.updated", resource: "student", resourceId: id, metadata: body });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.student.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "student.deleted", resource: "student", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// Link guardian to student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const data = linkGuardianSchema.parse(body);

    const link = await db.studentGuardian.create({
      data: {
        studentId: id,
        guardianId: data.guardianId,
        isPrimary: data.isPrimary ?? false,
      },
      include: { guardian: true },
    });

    await auditLog({
      userId: user.id,
      action: "guardian.linked",
      resource: "student",
      resourceId: id,
      metadata: { guardianId: data.guardianId },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Guardian already linked to this student" }, { status: 409 });
    }
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to link guardian" }, { status: 500 });
  }
}

// Unlink guardian from student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  const { id } = await params;

  try {
    const { guardianId } = await request.json();
    await db.studentGuardian.deleteMany({ where: { studentId: id, guardianId } });
    await auditLog({ userId: user.id, action: "guardian.unlinked", resource: "student", resourceId: id, metadata: { guardianId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to unlink guardian" }, { status: 500 });
  }
}
