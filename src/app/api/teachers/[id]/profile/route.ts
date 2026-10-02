import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("staff.read");
  if (error) return error;

  const { id } = await params;

  const staff = await db.staff.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true } },
      teacherClasses: {
        include: {
          class: {
            include: {
              grade: { select: { id: true, name: true } },
              academicYear: { select: { id: true, name: true, active: true } },
              enrolments: {
                where: { status: "ACTIVE" },
                include: {
                  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
                },
              },
            },
          },
        },
      },
      teacherSubjects: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  // Collect all class IDs and subject IDs
  const classIds = staff.teacherClasses.map((tc) => tc.classId);
  const subjectIds = staff.teacherSubjects.map((ts) => ts.subjectId);

  // Collect all student IDs from assigned classes
  const studentIds = new Set<string>();
  for (const tc of staff.teacherClasses) {
    for (const enr of tc.class.enrolments) {
      studentIds.add(enr.student.id);
    }
  }

  const [
    assessments,
    attendanceRecords,
    documents,
    auditLogs,
  ] = await Promise.all([
    // Assessments for assigned subjects
    subjectIds.length > 0
      ? db.assessment.findMany({
          where: {
            subjectId: { in: subjectIds },
          },
          include: {
            subject: { select: { id: true, name: true } },
            academicYear: { select: { name: true, active: true } },
            _count: { select: { results: true } },
          },
          orderBy: { date: "desc" },
          take: 50,
        })
      : [],
    // Attendance records for assigned classes
    classIds.length > 0
      ? db.attendanceRecord.findMany({
          where: {
            attendance: { classId: { in: classIds } },
          },
          include: {
            attendance: { select: { date: true, classId: true } },
            student: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { attendance: { date: "desc" } },
          take: 200,
        })
      : [],
    // Documents for students in assigned classes
    studentIds.size > 0
      ? db.document.findMany({
          where: { studentId: { in: Array.from(studentIds) } },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            academicYear: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
    // Audit logs for this staff member's user
    staff.userId
      ? db.auditLog.findMany({
          where: { userId: staff.userId },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
  ]);

  // Compute class summaries
  const classSummaries = staff.teacherClasses.map((tc) => {
    const classStudents = tc.class.enrolments;
    const classAttendance = attendanceRecords.filter(
      (r) => r.attendance.classId === tc.classId
    );
    const totalPresent = classAttendance.filter((r) => r.status === "PRESENT").length;
    const totalLate = classAttendance.filter((r) => r.status === "LATE").length;
    const totalRecords = classAttendance.length;
    const attendanceRate = totalRecords > 0
      ? Math.round(((totalPresent + totalLate) / totalRecords) * 100 * 100) / 100
      : 0;

    return {
      id: tc.id,
      classId: tc.classId,
      role: tc.role,
      className: tc.class.name,
      grade: tc.class.grade,
      academicYear: tc.class.academicYear,
      studentCount: classStudents.length,
      students: classStudents.map((e) => e.student),
      attendanceRate,
    };
  });

  // Compute subject summaries
  const subjectSummaries = staff.teacherSubjects.map((ts) => {
    const subjectAssessments = assessments.filter(
      (a) => a.subjectId === ts.subjectId
    );
    return {
      id: ts.id,
      subjectId: ts.subjectId,
      subject: ts.subject,
      assessmentCount: subjectAssessments.length,
      activeAssessments: subjectAssessments.filter((a) => a.academicYear?.active).length,
    };
  });

  // Attendance summary across all classes
  const totalPresent = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const totalAbsent = attendanceRecords.filter((r) => r.status === "ABSENT").length;
  const totalLate = attendanceRecords.filter((r) => r.status === "LATE").length;
  const totalExcused = attendanceRecords.filter((r) => r.status === "EXCUSED").length;
  const totalAttendance = attendanceRecords.length;
  const overallAttendanceRate = totalAttendance > 0
    ? Math.round(((totalPresent + totalLate) / totalAttendance) * 100 * 100) / 100
    : 0;

  // Assessment stats
  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter((a) => a.academicYear?.active).length;

  // Activity log
  const activity = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    resource: log.resource,
    metadata: log.metadata,
    createdAt: log.createdAt,
    userName: log.user?.name || "System",
  }));

  return NextResponse.json({
    staff,
    classes: classSummaries,
    subjects: subjectSummaries,
    totalStudents: studentIds.size,
    attendance: {
      total: totalAttendance,
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      excused: totalExcused,
      rate: overallAttendanceRate,
    },
    assessments: {
      total: totalAssessments,
      active: activeAssessments,
    },
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      createdAt: d.createdAt,
      student: d.student,
      academicYear: d.academicYear,
    })),
    activity,
  });
}
