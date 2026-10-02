import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: Teacher's assigned classes, subjects, and students
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Find the staff record linked to this user
  const staff = await db.staff.findUnique({
    where: { userId: user.id },
    include: {
      teacherClasses: {
        include: {
          class: {
            include: {
              grade: { select: { name: true } },
              academicYear: { select: { name: true, active: true } },
              enrolments: {
                where: { status: "ACTIVE" },
                include: {
                  student: {
                    select: { id: true, firstName: true, lastName: true, studentNumber: true },
                  },
                },
                orderBy: { student: { firstName: "asc" } },
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
    return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
  }

  return NextResponse.json({
    staff: {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      position: staff.position,
      staffNumber: staff.staffNumber,
    },
    classes: staff.teacherClasses.map((tc) => ({
      id: tc.class.id,
      name: tc.class.name,
      role: tc.role,
      grade: tc.class.grade.name,
      academicYear: tc.class.academicYear.name,
      isActive: tc.class.academicYear.active,
      studentCount: tc.class.enrolments.length,
      students: tc.class.enrolments.map((e) => ({
        id: e.student.id,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        studentNumber: e.student.studentNumber,
      })),
    })),
    subjects: staff.teacherSubjects.map((ts) => ({
      id: ts.subject.id,
      name: ts.subject.name,
      code: ts.subject.code,
    })),
  });
}
