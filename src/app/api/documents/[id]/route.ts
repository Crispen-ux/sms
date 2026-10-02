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

  const document = await db.document.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      academicYear: { select: { name: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...document,
    data: JSON.parse(document.data),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.document.delete({ where: { id } });
    await auditLog({
      userId: user.id,
      action: "document.deleted",
      resource: "document",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}