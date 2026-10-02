import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("admissions.write");
  if (error) return error;

  const { id } = await params;

  const admission = await db.admission.findUnique({ where: { id } });
  if (!admission) {
    return NextResponse.json({ error: "Admission not found" }, { status: 404 });
  }

  if (!admission.email) {
    return NextResponse.json(
      { error: "Admission must have an email to onboard parent" },
      { status: 400 }
    );
  }

  try {
    // Find the grade
    const grade = await db.grade.findFirst({
      where: { name: admission.grade },
    });

    if (!grade) {
      return NextResponse.json(
        { error: `Grade "${admission.grade}" not found` },
        { status: 400 }
      );
    }

    // Find an active academic year
    const academicYear = await db.academicYear.findFirst({
      where: { active: true },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "No active academic year found" },
        { status: 400 }
      );
    }

    // Create the student record (no gradeId — that's on Enrolment)
    const firstName = admission.childName?.split(" ")[0] || "Unknown";
    const lastName = admission.childName?.split(" ").slice(1).join(" ") || "Unknown";

    const student = await db.student.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: null,
        gender: null,
      },
    });

    // Create the enrolment linking student to grade + academic year
    await db.enrolment.create({
      data: {
        studentId: student.id,
        academicYearId: academicYear.id,
        gradeId: grade.id,
        status: "ACTIVE",
      },
    });

    // Find or create parent/guardian user
    let parentUser = await db.user.findUnique({
      where: { email: admission.email },
    });

    let invitation = null;

    if (!parentUser) {
      // Create parent user with INVITED status
      const tempPasswordHash = await import("bcryptjs").then(bcrypt =>
        bcrypt.hash(crypto.randomBytes(16).toString("hex"), 12)
      );

      parentUser = await db.user.create({
        data: {
          email: admission.email,
          name: admission.parentName,
          passwordHash: tempPasswordHash,
          role: "PARENT",
          status: "INVITED",
          active: false,
        },
      });

      // Create invitation token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      invitation = await db.invitation.create({
        data: {
          email: admission.email,
          role: "PARENT",
          token,
          invitedById: user.id,
          expiresAt,
        },
      });

      await auditLog({
        userId: user.id,
        action: "invitation.created",
        resource: "invitation",
        resourceId: invitation.id,
        metadata: { email: admission.email, role: "PARENT", source: "admission_onboarding" },
      });
    }

    // Create or find parent guardian record
    let parentGuardian = await db.parentGuardian.findFirst({
      where: { userId: parentUser.id },
    });

    if (!parentGuardian) {
      parentGuardian = await db.parentGuardian.create({
        data: {
          userId: parentUser.id,
          firstName: admission.parentName.split(" ")[0],
          lastName: admission.parentName.split(" ").slice(1).join(" ") || "",
          email: admission.email,
          phone: admission.phone,
          relationship: "PARENT",
        },
      });
    }

    // Link student to parent
    const existingLink = await db.studentGuardian.findFirst({
      where: {
        studentId: student.id,
        guardianId: parentGuardian.id,
      },
    });

    if (!existingLink) {
      await db.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: parentGuardian.id,
          isPrimary: true,
        },
      });
    }

    // Update admission status
    await db.admission.update({
      where: { id },
      data: { status: "ENROLLED" },
    });

    await auditLog({
      userId: user.id,
      action: "admission.onboarded",
      resource: "admission",
      resourceId: id,
      metadata: {
        studentId: student.id,
        parentUserId: parentUser.id,
        parentGuardianId: parentGuardian.id,
        invitationId: invitation?.id,
      },
    });

    return NextResponse.json({
      success: true,
      student: { id: student.id, name: `${student.firstName} ${student.lastName}` },
      parent: { id: parentUser.id, email: parentUser.email, name: parentUser.name },
      invitation: invitation ? {
        id: invitation.id,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        activateUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?token=${invitation.token}`,
      } : null,
      message: invitation
        ? "Student enrolled, parent account created. Send the invitation link to activate their portal access."
        : "Student enrolled, parent account already exists.",
    });
  } catch (e: any) {
    console.error("Onboarding error:", e);
    return NextResponse.json(
      { error: "Failed to onboard: " + (e.message || "Unknown error") },
      { status: 500 }
    );
  }
}
