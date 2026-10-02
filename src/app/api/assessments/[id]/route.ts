import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("academics.read");
  if (error) return error;

  const { id } = await params;

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true, code: true } },
      academicYear: { select: { name: true } },
      results: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        },
        orderBy: { student: { firstName: "asc" } },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  return NextResponse.json(assessment);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await db.assessment.update({ where: { id }, data: body });
    await auditLog({ userId: user.id, action: "assessment.updated", resource: "assessment", resourceId: id, metadata: body });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.assessmentResult.deleteMany({ where: { assessmentId: id } });
    await db.assessment.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "assessment.deleted", resource: "assessment", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
