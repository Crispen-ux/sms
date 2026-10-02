import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: Results for parent's children
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

  const links = await db.studentGuardian.findMany({
    where: { guardianId: parent.id },
    select: { studentId: true },
  });
  const studentIds = links.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return NextResponse.json({ students: [] });
  }

  const targetIds = studentId && studentIds.includes(studentId) ? [studentId] : studentIds;

  const results = await db.assessmentResult.findMany({
    where: { studentId: { in: targetIds } },
    include: {
      assessment: {
        include: {
          subject: { select: { name: true, code: true } },
          academicYear: { select: { name: true } },
        },
      },
      student: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { assessment: { date: "desc" } },
    take: 200,
  });

  const students = await db.student.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const grouped = students.map((s) => {
    const studentResults = results.filter((r) => r.studentId === s.id);
    const published = studentResults.filter((r) => r.status === "PUBLISHED" || r.status === "APPROVED");

    return {
      student: s,
      totalResults: studentResults.length,
      publishedCount: published.length,
      results: studentResults.map((r) => ({
        assessmentTitle: r.assessment.title,
        subject: r.assessment.subject.name,
        subjectCode: r.assessment.subject.code,
        type: r.assessment.type,
        totalMarks: r.assessment.totalMarks,
        marks: r.marks,
        percentage: r.percentage,
        grade: r.grade,
        comment: r.comment,
        status: r.status,
        year: r.assessment.academicYear.name,
        date: r.assessment.date,
      })),
    };
  });

  return NextResponse.json({ students: grouped });
}
