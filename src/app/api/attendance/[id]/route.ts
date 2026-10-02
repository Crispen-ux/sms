import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("attendance.read");
  if (error) return error;

  const { id } = await params;

  const attendance = await db.attendance.findUnique({
    where: { id },
    include: {
      records: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        },
        orderBy: { student: { firstName: "asc" } },
      },
      class: { select: { name: true, grade: { select: { name: true } } } },
    },
  });

  if (!attendance) {
    return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
  }

  return NextResponse.json(attendance);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("attendance.write");
  if (error) return error;

  const { id } = await params;

  try {
    // Delete records first, then the attendance session
    await db.attendanceRecord.deleteMany({ where: { attendanceId: id } });
    await db.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
