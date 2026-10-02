import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;

  const parent = await db.parentGuardian.findUnique({
    where: { id },
    include: {
      studentLinks: {
        include: { student: true },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Parent not found" }, { status: 404 });
  }

  return NextResponse.json(parent);
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
    const updated = await db.parentGuardian.update({ where: { id }, data: body });
    await auditLog({ userId: user.id, action: "parent.updated", resource: "parent", resourceId: id, metadata: body });
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
    await db.parentGuardian.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "parent.deleted", resource: "parent", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
