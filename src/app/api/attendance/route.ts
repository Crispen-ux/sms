import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { saveAttendanceSchema } from "@/lib/validation";

// GET: Fetch attendance for a class on a date
export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("attendance.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId and date are required" }, { status: 400 });
  }

  const dateObj = new Date(date);

  const attendance = await db.attendance.findUnique({
    where: { classId_date: { classId, date: dateObj } },
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
    // Return empty structure — attendance hasn't been taken yet
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      include: {
        grade: { select: { name: true } },
        enrolments: {
          where: { status: "ACTIVE" },
          include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
          orderBy: { student: { firstName: "asc" } },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: null,
      classId,
      date: date,
      className: classInfo.name,
      gradeName: classInfo.grade.name,
      records: classInfo.enrolments.map((e) => ({
        id: null,
        studentId: e.studentId,
        student: e.student,
        status: "PRESENT",
        reason: null,
      })),
      taken: false,
    });
  }

  return NextResponse.json({
    ...attendance,
    date: attendance.date,
    taken: true,
  });
}

// POST: Save attendance records (upsert)
export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("attendance.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = saveAttendanceSchema.parse(body);

    const dateObj = new Date(data.date);

    // Upsert the attendance session
    const attendance = await db.attendance.upsert({
      where: { classId_date: { classId: data.classId, date: dateObj } },
      create: { classId: data.classId, date: dateObj },
      update: {},
    });

    // Save each record
    const results = await Promise.all(
      data.records.map((r) =>
        db.attendanceRecord.upsert({
          where: { attendanceId_studentId: { attendanceId: attendance.id, studentId: r.studentId } },
          create: {
            attendanceId: attendance.id,
            studentId: r.studentId,
            status: r.status,
            reason: r.reason,
            recordedById: user.id,
          },
          update: {
            status: r.status,
            reason: r.reason,
            recordedById: user.id,
          },
        })
      )
    );

    await auditLog({
      userId: user.id,
      action: "attendance.saved",
      resource: "attendance",
      resourceId: attendance.id,
      metadata: { classId: data.classId, date: data.date, recordCount: results.length },
    });

    return NextResponse.json({ attendanceId: attendance.id, records: results.length });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
