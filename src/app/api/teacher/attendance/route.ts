import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";
import { saveAttendanceSchema } from "@/lib/validation";

// GET: Fetch attendance for a teacher's class on a date
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const staff = await db.staff.findUnique({ where: { userId: user.id } });
  if (!staff) {
    return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId and date are required" }, { status: 400 });
  }

  // Verify teacher is assigned to this class
  const assignment = await db.teacherClass.findUnique({
    where: { staffId_classId: { staffId: staff.id, classId } },
  });

  if (!assignment) {
    return NextResponse.json({ error: "You are not assigned to this class" }, { status: 403 });
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
      date,
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

  return NextResponse.json({ ...attendance, taken: true });
}

// POST: Save attendance records
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const staff = await db.staff.findUnique({ where: { userId: user.id } });
  if (!staff) {
    return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = saveAttendanceSchema.parse(body);

    // Verify teacher is assigned to this class
    const assignment = await db.teacherClass.findUnique({
      where: { staffId_classId: { staffId: staff.id, classId: data.classId } },
    });

    if (!assignment) {
      return NextResponse.json({ error: "You are not assigned to this class" }, { status: 403 });
    }

    const dateObj = new Date(data.date);

    const attendance = await db.attendance.upsert({
      where: { classId_date: { classId: data.classId, date: dateObj } },
      create: { classId: data.classId, date: dateObj },
      update: {},
    });

    const results = await Promise.all(
      data.records.map((r) =>
        db.attendanceRecord.upsert({
          where: { attendanceId_studentId: { attendanceId: attendance.id, studentId: r.studentId } },
          create: {
            attendanceId: attendance.id,
            studentId: r.studentId,
            status: r.status,
            reason: r.reason,
            recordedById: staff.id,
          },
          update: {
            status: r.status,
            reason: r.reason,
            recordedById: staff.id,
          },
        })
      )
    );

    return NextResponse.json({ attendanceId: attendance.id, records: results.length });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
