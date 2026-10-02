import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: Attendance for parent's children
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parent = await db.parentGuardian.findUnique({ where: { userId: user.id } });
  if (!parent) {
    return NextResponse.json({ error: "Parent record not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  // Get all student IDs linked to this parent
  const links = await db.studentGuardian.findMany({
    where: { guardianId: parent.id },
    select: { studentId: true },
  });
  const studentIds = links.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return NextResponse.json({ students: [] });
  }

  // Filter by specific student if provided
  const targetIds = studentId && studentIds.includes(studentId) ? [studentId] : studentIds;

  // Get attendance records for these students
  const attendanceRecords = await db.attendanceRecord.findMany({
    where: { studentId: { in: targetIds } },
    include: {
      attendance: {
        include: {
          class: { select: { name: true, grade: { select: { name: true } } } },
        },
      },
      student: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { attendance: { date: "desc" } },
    take: 100,
  });

  // Get student names
  const students = await db.student.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  // Group by student
  const grouped = students.map((s) => {
    const records = attendanceRecords.filter((r) => r.studentId === s.id);
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const excused = records.filter((r) => r.status === "EXCUSED").length;
    const total = records.length;

    return {
      student: s,
      summary: {
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      },
      records: records.slice(0, 30).map((r) => ({
        date: r.attendance.date,
        status: r.status,
        reason: r.reason,
        className: r.attendance.class.name,
        gradeName: r.attendance.class.grade.name,
      })),
    };
  });

  return NextResponse.json({ students: grouped });
}
