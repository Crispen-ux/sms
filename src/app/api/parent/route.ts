import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: Parent's linked children with summary data
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Find the parent record linked to this user
  const parent = await db.parentGuardian.findUnique({
    where: { userId: user.id },
    include: {
      studentLinks: {
        include: {
          student: {
            include: {
              enrolments: {
                where: { status: "ACTIVE" },
                include: {
                  grade: { select: { name: true } },
                  class: { select: { name: true } },
                  academicYear: { select: { name: true, active: true } },
                },
              },
              guardianLinks: {
                include: { guardian: { select: { firstName: true, lastName: true, relationship: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Parent record not found" }, { status: 404 });
  }

  return NextResponse.json({
    parent: {
      id: parent.id,
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone,
      email: parent.email,
      relationship: parent.relationship,
    },
    children: parent.studentLinks.map((link) => ({
      id: link.student.id,
      firstName: link.student.firstName,
      lastName: link.student.lastName,
      studentNumber: link.student.studentNumber,
      dateOfBirth: link.student.dateOfBirth,
      gender: link.student.gender,
      isPrimary: link.isPrimary,
      activeEnrolment: link.student.enrolments[0] || null,
      guardians: link.student.guardianLinks.map((gl) => ({
        firstName: gl.guardian.firstName,
        lastName: gl.guardian.lastName,
        relationship: gl.guardian.relationship,
        isPrimary: gl.isPrimary,
      })),
    })),
  });
}
