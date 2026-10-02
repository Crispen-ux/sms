import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

// GET: List current assignments for a teacher
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
      teacherClasses: {
        include: {
          class: {
            include: {
              grade: { select: { name: true } },
              academicYear: { select: { name: true, active: true } },
              _count: { select: { enrolments: true } },
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

  return NextResponse.json({
    classes: staff.teacherClasses.map((tc) => ({
      id: tc.id,
      classId: tc.classId,
      role: tc.role,
      className: tc.class.name,
      grade: tc.class.grade,
      academicYear: tc.class.academicYear,
      studentCount: tc.class._count.enrolments,
    })),
    subjects: staff.teacherSubjects.map((ts) => ({
      id: ts.id,
      subjectId: ts.subjectId,
      subject: ts.subject,
    })),
  });
}

// POST: Assign class or subject to teacher
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("staff.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const { type, classId, subjectId, role } = body;

    if (!type || !["class", "subject"].includes(type)) {
      return NextResponse.json({ error: "type must be 'class' or 'subject'" }, { status: 400 });
    }

    const staff = await db.staff.findUnique({ where: { id } });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (type === "class") {
      if (!classId) {
        return NextResponse.json({ error: "classId is required" }, { status: 400 });
      }
      const existing = await db.teacherClass.findUnique({
        where: { staffId_classId: { staffId: id, classId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Teacher is already assigned to this class" }, { status: 409 });
      }
      const assignment = await db.teacherClass.create({
        data: { staffId: id, classId, role: role || "class_teacher" },
        include: {
          class: {
            include: {
              grade: { select: { name: true } },
              academicYear: { select: { name: true } },
            },
          },
        },
      });
      await auditLog({
        userId: user.id,
        action: "teacher.class_assigned",
        resource: "staff",
        resourceId: id,
        metadata: { classId, role: role || "class_teacher" },
      });
      return NextResponse.json(assignment, { status: 201 });
    }

    if (type === "subject") {
      if (!subjectId) {
        return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
      }
      const existing = await db.teacherSubject.findUnique({
        where: { staffId_subjectId: { staffId: id, subjectId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Teacher is already assigned to this subject" }, { status: 409 });
      }
      const assignment = await db.teacherSubject.create({
        data: { staffId: id, subjectId },
        include: { subject: { select: { name: true, code: true } } },
      });
      await auditLog({
        userId: user.id,
        action: "teacher.subject_assigned",
        resource: "staff",
        resourceId: id,
        metadata: { subjectId },
      });
      return NextResponse.json(assignment, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

// DELETE: Remove class or subject assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("staff.write");
  if (error) return error;

  const { id } = await params;

  try {
    const { type, assignmentId } = await request.json();

    if (!type || !["class", "subject"].includes(type) || !assignmentId) {
      return NextResponse.json({ error: "type and assignmentId are required" }, { status: 400 });
    }

    if (type === "class") {
      await db.teacherClass.delete({ where: { id: assignmentId } });
      await auditLog({
        userId: user.id,
        action: "teacher.class_unassigned",
        resource: "staff",
        resourceId: id,
        metadata: { assignmentId },
      });
    }

    if (type === "subject") {
      await db.teacherSubject.delete({ where: { id: assignmentId } });
      await auditLog({
        userId: user.id,
        action: "teacher.subject_unassigned",
        resource: "staff",
        resourceId: id,
        metadata: { assignmentId },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove assignment" }, { status: 500 });
  }
}
