import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: Executive analytics dashboard data
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"].includes(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Get current active year
  const activeYear = await db.academicYear.findFirst({ where: { active: true } });

  // Core counts
  const [
    totalStudents,
    totalStaff,
    totalParents,
    totalClasses,
    totalSubjects,
    activeEnrolments,
    pendingAdmissions,
    totalInvoices,
  ] = await Promise.all([
    db.student.count(),
    db.staff.count(),
    db.parentGuardian.count(),
    db.class.count(),
    db.subject.count(),
    activeYear ? db.enrolment.count({ where: { academicYearId: activeYear.id, status: "ACTIVE" } }) : 0,
    db.admission.count({ where: { status: { in: ["NEW", "CONTACTED", "IN_PROGRESS"] } } }),
    activeYear ? db.invoice.count({ where: { academicYearId: activeYear.id } }) : 0,
  ]);

  // Financial summary
  const invoices = activeYear
    ? await db.invoice.findMany({
        where: { academicYearId: activeYear.id },
        include: { payments: { select: { amount: true } } },
      })
    : [];

  const totalRevenue = invoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
  }, 0);

  const totalOwed = invoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
    return sum + (Number(inv.totalAmount) - paid);
  }, 0);

  // Attendance summary (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const recentAttendance = await db.attendanceRecord.findMany({
    where: { attendance: { date: { gte: thirtyDaysAgo } } },
    select: { status: true },
  });

  const attendanceSummary = {
    total: recentAttendance.length,
    present: recentAttendance.filter((r) => r.status === "PRESENT").length,
    absent: recentAttendance.filter((r) => r.status === "ABSENT").length,
    late: recentAttendance.filter((r) => r.status === "LATE").length,
    rate: recentAttendance.length > 0
      ? Math.round(((recentAttendance.filter((r) => r.status === "PRESENT").length + recentAttendance.filter((r) => r.status === "LATE").length) / recentAttendance.length) * 100)
      : 0,
  };

  // Grade distribution
  const gradeDistribution = await db.grade.findMany({
    include: {
      _count: { select: { enrolments: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Admission sources
  const admissionSources = await db.admission.groupBy({
    by: ["source"],
    _count: true,
    where: activeYear ? { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } } : {},
  });

  // Recent activity
  const recentAdmissions = await db.admission.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, parentName: true, grade: true, status: true, createdAt: true },
  });

  const recentPayments = await db.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: 5,
    include: { invoice: { select: { invoiceNumber: true, student: { select: { firstName: true, lastName: true } } } } },
  });

  return NextResponse.json({
    overview: {
      totalStudents,
      totalStaff,
      totalParents,
      totalClasses,
      totalSubjects,
      activeEnrolments,
      pendingAdmissions,
      totalInvoices,
    },
    financial: {
      totalRevenue,
      totalOwed,
      collectionRate: totalRevenue + totalOwed > 0 ? Math.round((totalRevenue / (totalRevenue + totalOwed)) * 100) : 0,
    },
    attendance: attendanceSummary,
    gradeDistribution: gradeDistribution.map((g) => ({ name: g.name, count: g._count.enrolments })),
    admissionSources: admissionSources.map((s) => ({ source: s.source, count: s._count })),
    recentActivity: {
      admissions: recentAdmissions,
      payments: recentPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        invoiceNumber: p.invoice.invoiceNumber,
        studentName: `${p.invoice.student.firstName} ${p.invoice.student.lastName}`,
        paidAt: p.paidAt,
      })),
    },
  });
}
