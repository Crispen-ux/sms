import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  const { id } = await params;

  try {
    const invitation = await db.invitation.findUnique({ where: { id } });
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    await db.invitation.delete({ where: { id } });

    await auditLog({
      userId: user.id,
      action: "invitation.deleted",
      resource: "invitation",
      resourceId: id,
      metadata: { email: invitation.email },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
