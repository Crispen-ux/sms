import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";
import { saveResultsSchema } from "@/lib/validation";

// GET: Assessments for teacher's subjects
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
  const assessmentId = searchParams.get("assessmentId");

  // Get teacher's subject IDs
  const teacherSubjects = await db.teacherSubject.findMany({
    where: { staffId: staff.id },
    select: { subjectId: true },
  });
  const subjectIds = teacherSubjects.map((ts) => ts.subjectId);

  if (subjectIds.length === 0) {
    return NextResponse.json({ assessments: [], subjects: [] });
  }

  if (assessmentId) {
    // Get specific assessment with results
    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId, subjectId: { in: subjectIds } },
      include: {
        subject: { select: { name: true, code: true } },
        academicYear: { select: { name: true } },
        results: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          },
          orderBy: { student: { firstName: "asc" } },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json({ assessment });
  }

  // List assessments for teacher's subjects
  const assessments = await db.assessment.findMany({
    where: { subjectId: { in: subjectIds } },
    include: {
      subject: { select: { name: true, code: true } },
      academicYear: { select: { name: true, active: true } },
      _count: { select: { results: true } },
    },
    orderBy: { date: "desc" },
  });

  const subjects = await db.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true, code: true },
  });

  return NextResponse.json({ assessments, subjects });
}

// POST: Save results for an assessment
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
    const data = saveResultsSchema.parse(body);

    // Verify teacher is assigned to this assessment's subject
    const assessment = await db.assessment.findUnique({
      where: { id: data.assessmentId },
      include: { subject: { select: { name: true } } },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const isAssigned = await db.teacherSubject.findUnique({
      where: { staffId_subjectId: { staffId: staff.id, subjectId: assessment.subjectId } },
    });

    if (!isAssigned) {
      return NextResponse.json({ error: "You are not assigned to this subject" }, { status: 403 });
    }

    const results = await Promise.all(
      data.results.map((r) => {
        const percentage = assessment.totalMarks > 0 ? (r.marks / assessment.totalMarks) * 100 : 0;
        let letterGrade = "F";
        if (percentage >= 80) letterGrade = "A";
        else if (percentage >= 70) letterGrade = "B";
        else if (percentage >= 60) letterGrade = "C";
        else if (percentage >= 50) letterGrade = "D";
        else if (percentage >= 40) letterGrade = "E";

        return db.assessmentResult.upsert({
          where: { assessmentId_studentId: { assessmentId: data.assessmentId, studentId: r.studentId } },
          create: {
            assessmentId: data.assessmentId,
            studentId: r.studentId,
            marks: r.marks,
            percentage: Math.round(percentage * 100) / 100,
            grade: letterGrade,
            comment: r.comment,
            status: "DRAFT",
          },
          update: {
            marks: r.marks,
            percentage: Math.round(percentage * 100) / 100,
            grade: letterGrade,
            comment: r.comment,
          },
        });
      })
    );

    return NextResponse.json({ saved: results.length });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }
}
