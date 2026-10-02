import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: AI-powered school intelligence insights
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const activeYear = await db.academicYear.findFirst({ where: { active: true } });

  // Enrollment trends
  const enrolmentsByGrade = activeYear
    ? await db.enrolment.groupBy({
        by: ["gradeId"],
        where: { academicYearId: activeYear.id, status: "ACTIVE" },
        _count: true,
      })
    : [];

  const grades = await db.grade.findMany({ select: { id: true, name: true } });
  const gradeMap = new Map(grades.map((g) => [g.id, g.name]));

  // Financial health
  const invoices = activeYear
    ? await db.invoice.findMany({
        where: { academicYearId: activeYear.id },
        include: { payments: { select: { amount: true } } },
      })
    : [];

  const overdueInvoices = invoices.filter((inv) => {
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return inv.status === "OVERDUE" || (inv.dueDate && new Date(inv.dueDate) < new Date() && paid < Number(inv.totalAmount));
  });

  // Attendance patterns
  const last7Days = new Date(Date.now() - 7 * 86400000);
  const recentRecords = await db.attendanceRecord.findMany({
    where: { attendance: { date: { gte: last7Days } } },
    include: { student: { select: { id: true } }, attendance: { select: { date: true } } },
  });

  // Students with low attendance (absent 3+ times in last 7 days)
  const studentAbsences = new Map<string, number>();
  for (const rec of recentRecords) {
    if (rec.status === "ABSENT") {
      const count = studentAbsences.get(rec.studentId) || 0;
      studentAbsences.set(rec.studentId, count + 1);
    }
  }
  const lowAttendanceStudents = Array.from(studentAbsences.entries())
    .filter(([, count]) => count >= 3)
    .length;

  // Assessment performance
  const recentResults = await db.assessmentResult.findMany({
    where: { status: { in: ["APPROVED", "PUBLISHED"] } },
    select: { marks: true, percentage: true, grade: true },
    take: 500,
  });

  const avgPercentage = recentResults.length > 0
    ? Math.round(recentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / recentResults.length)
    : 0;

  const gradeCounts = recentResults.reduce((acc, r) => {
    if (r.grade) acc[r.grade] = (acc[r.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Admission pipeline
  const admissionStats = await db.admission.groupBy({
    by: ["status"],
    _count: true,
  });

  // Generate insights
  const insights: { type: "info" | "warning" | "success" | "tip"; title: string; description: string; metric?: string }[] = [];

  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      return sum + (Number(inv.totalAmount) - paid);
    }, 0);
    insights.push({
      type: "warning",
      title: "Overdue Invoices",
      description: `${overdueInvoices.length} invoices are overdue with a total outstanding of R ${totalOverdue.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}. Consider sending reminders.`,
      metric: `${overdueInvoices.length} overdue`,
    });
  }

  if (lowAttendanceStudents > 0) {
    insights.push({
      type: "warning",
      title: "Low Attendance Alert",
      description: `${lowAttendanceStudents} student(s) have been absent 3+ times in the last 7 days. Follow up recommended.`,
      metric: `${lowAttendanceStudents} students`,
    });
  }

  if (avgPercentage >= 70) {
    insights.push({
      type: "success",
      title: "Strong Academic Performance",
      description: `Average student performance is ${avgPercentage}%, indicating strong academic outcomes across the school.`,
      metric: `${avgPercentage}% avg`,
    });
  } else if (avgPercentage < 50) {
    insights.push({
      type: "warning",
      title: "Academic Performance Alert",
      description: `Average student performance is ${avgPercentage}%, below the 50% target. Consider intervention strategies.`,
      metric: `${avgPercentage}% avg`,
    });
  }

  const pendingAdmissions = admissionStats.find((s) => s.status === "NEW")?._count || 0;
  if (pendingAdmissions > 5) {
    insights.push({
      type: "tip",
      title: "Admissions Pipeline",
      description: `${pendingAdmissions} new enquiries pending review. Prioritize follow-up to improve conversion rates.`,
      metric: `${pendingAdmissions} pending`,
    });
  }

  const newEnrolments = admissionStats.find((s) => s.status === "ENROLLED")?._count || 0;
  if (newEnrolments > 0) {
    insights.push({
      type: "success",
      title: "Enrolment Growth",
      description: `${newEnrolments} students have been enrolled this period. Growth is on track.`,
      metric: `${newEnrolments} enrolled`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "System Overview",
      description: "All systems are operating normally. No immediate action required.",
    });
  }

  return NextResponse.json({
    insights,
    metrics: {
      enrollmentByGrade: enrolmentsByGrade.map((e) => ({
        grade: gradeMap.get(e.gradeId) || "Unknown",
        count: e._count,
      })),
      financialHealth: {
        totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
        totalCollected: invoices.reduce((sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0),
        overdueCount: overdueInvoices.length,
      },
      attendanceTrend: {
        last7Days: {
          total: recentRecords.length,
          present: recentRecords.filter((r) => r.status === "PRESENT").length,
          absent: recentRecords.filter((r) => r.status === "ABSENT").length,
        },
      },
      academicPerformance: {
        averagePercentage: avgPercentage,
        gradeDistribution: gradeCounts,
      },
      admissionPipeline: admissionStats.map((s) => ({ status: s.status, count: s._count })),
    },
  });
}
