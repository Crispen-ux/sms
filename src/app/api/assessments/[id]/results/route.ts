import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { saveResultsSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const data = saveResultsSchema.parse({ ...body, assessmentId: id });

    const assessment = await db.assessment.findUnique({ where: { id } });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
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
          where: { assessmentId_studentId: { assessmentId: id, studentId: r.studentId } },
          create: {
            assessmentId: id,
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

    await auditLog({
      userId: user.id,
      action: "results.saved",
      resource: "assessment",
      resourceId: id,
      metadata: { resultCount: results.length },
    });

    return NextResponse.json({ saved: results.length });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }
}
