import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("announcements.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const updateData: any = { ...body };
    if (body.published === true && !body.publishedAt) {
      updateData.publishedAt = new Date();
    }
    const updated = await db.announcement.update({ where: { id }, data: updateData });
    await auditLog({ userId: user.id, action: "announcement.updated", resource: "announcement", resourceId: id, metadata: body });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("announcements.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.announcement.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "announcement.deleted", resource: "announcement", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
