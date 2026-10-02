import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { updateEnrolmentSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;

  const enrolment = await db.enrolment.findUnique({
    where: { id },
    include: {
      student: true,
      grade: { select: { name: true } },
      class: { select: { name: true } },
      academicYear: true,
    },
  });

  if (!enrolment) {
    return NextResponse.json({ error: "Enrolment not found" }, { status: 404 });
  }

  return NextResponse.json(enrolment);
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
    const data = updateEnrolmentSchema.parse(body);

    const updateData: any = { ...data };
    if (data.status === "WITHDRAWN" || data.status === "TRANSFERRED" || data.status === "GRADUATED") {
      updateData.withdrawnAt = new Date();
    }

    const updated = await db.enrolment.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { firstName: true, lastName: true } },
        grade: { select: { name: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
    });

    await auditLog({ userId: user.id, action: "enrolment.updated", resource: "enrolment", resourceId: id, metadata: data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
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
    await db.enrolment.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "enrolment.deleted", resource: "enrolment", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
