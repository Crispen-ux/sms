import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await db.class.update({ where: { id }, data: body });
    await auditLog({ userId: user.id, action: "class.updated", resource: "class", resourceId: id, metadata: body });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.class.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "class.deleted", resource: "class", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
