import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { updateAdmissionStatusSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const admission = await db.admission.findUnique({ where: { id } });
  if (!admission) {
    return NextResponse.json({ error: "Admission not found" }, { status: 404 });
  }

  return NextResponse.json(admission);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("admissions.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateAdmissionStatusSchema.parse(body);

    const admission = await db.admission.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
      },
    });

    await auditLog({
      userId: user.id,
      action: "admission.status_updated",
      resource: "admission",
      resourceId: id,
      metadata: { status: data.status, previousStatus: admission.status },
    });

    return NextResponse.json(admission);
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
  const { user, error } = await apiAuth("admissions.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.admission.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "admission.deleted", resource: "admission", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
