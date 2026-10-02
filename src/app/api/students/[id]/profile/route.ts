import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get("academicYearId");

  const student = await db.student.findUnique({
    where: { id },
    include: {
      guardianLinks: {
        include: { guardian: true },
      },
      enrolments: {
        include: {
          grade: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
          academicYear: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const activeEnrolment = student.enrolments.find(
    (e) => e.academicYear.active && e.status === "ACTIVE"
  );

  const currentYear = activeEnrolment?.academicYear;
  const filterYearId = academicYearId || currentYear?.id;

  const [
    attendanceRecords,
    assessmentResults,
    invoices,
    documents,
    auditLogs,
  ] = await Promise.all([
    filterYearId
      ? db.attendanceRecord.findMany({
          where: {
            studentId: id,
            attendance: { class: { academicYearId: filterYearId } },
          },
          include: {
            attendance: { select: { date: true, classId: true } },
          },
          orderBy: { attendance: { date: "desc" } },
        })
      : [],
    filterYearId
      ? db.assessmentResult.findMany({
          where: {
            studentId: id,
            assessment: { academicYearId: filterYearId },
          },
          include: {
            assessment: {
              include: {
                subject: { select: { id: true, name: true } },
                academicYear: { select: { name: true } },
              },
            },
          },
          orderBy: { assessment: { date: "desc" } },
        })
      : [],
    db.invoice.findMany({
      where: { studentId: id },
      include: {
        academicYear: { select: { name: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.document.findMany({
      where: { studentId: id },
      include: {
        academicYear: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.auditLog.findMany({
      where: { resourceId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Attendance summary
  const totalPresent = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const totalAbsent = attendanceRecords.filter((r) => r.status === "ABSENT").length;
  const totalLate = attendanceRecords.filter((r) => r.status === "LATE").length;
  const totalExcused = attendanceRecords.filter((r) => r.status === "EXCUSED").length;
  const totalAttendance = attendanceRecords.length;
  const attendanceRate = totalAttendance > 0 ? Math.round(((totalPresent + totalLate) / totalAttendance) * 100 * 100) / 100 : 0;

  // Recent attendance (last 10)
  const recentAttendance = attendanceRecords.slice(0, 10).map((r) => ({
    id: r.id,
    date: r.attendance.date,
    status: r.status,
    reason: r.reason,
  }));

  // Academic summary - group results by subject
  const subjectMap = new Map<string, { subjectId: string; subjectName: string; marks: number[]; totalMarks: number[]; assessments: any[] }>();
  for (const result of assessmentResults) {
    const sId = result.assessment.subjectId;
    const sName = result.assessment.subject.name;
    if (!subjectMap.has(sId)) {
      subjectMap.set(sId, { subjectId: sId, subjectName: sName, marks: [], totalMarks: [], assessments: [] });
    }
    const data = subjectMap.get(sId)!;
    data.marks.push(result.marks);
    data.totalMarks.push(result.assessment.totalMarks);
    data.assessments.push({
      id: result.assessment.id,
      title: result.assessment.title,
      type: result.assessment.type,
      marks: result.marks,
      totalMarks: result.assessment.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      date: result.assessment.date,
      status: result.status,
    });
  }

  const academicSummary = Array.from(subjectMap.entries()).map(([sId, data]) => {
    const totalM = data.marks.reduce((a, b) => a + b, 0);
    const totalT = data.totalMarks.reduce((a, b) => a + b, 0);
    const average = totalT > 0 ? Math.round((totalM / totalT) * 100 * 100) / 100 : 0;
    const latestAssessment = data.assessments[0] || null;
    return {
      subjectId: sId,
      subjectName: data.subjectName,
      average,
      latestAssessment,
      assessmentCount: data.assessments.length,
    };
  });

  const overallAverage = academicSummary.length > 0
    ? Math.round((academicSummary.reduce((sum, s) => sum + s.average, 0) / academicSummary.length) * 100) / 100
    : 0;

  // Financial summary
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPaid = invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
    0
  );
  const balance = totalInvoiced - totalPaid;

  const invoicesWithBalance = invoices.map((inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: Number(inv.totalAmount),
      paid,
      balance: Number(inv.totalAmount) - paid,
      status: inv.status,
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
      academicYear: inv.academicYear,
      items: inv.items,
    };
  });

  const allPayments = invoices.flatMap((inv) =>
    inv.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference,
      notes: p.notes,
      paidAt: p.paidAt,
      invoiceNumber: inv.invoiceNumber,
    }))
  ).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  // Recent documents
  const recentDocs = documents.slice(0, 10).map((d) => ({
    id: d.id,
    type: d.type,
    title: d.title,
    createdAt: d.createdAt,
    academicYear: d.academicYear,
  }));

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
    student,
    currentEnrolment: activeEnrolment || null,
    attendance: {
      total: totalAttendance,
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      excused: totalExcused,
      rate: attendanceRate,
      recent: recentAttendance,
    },
    academics: {
      subjects: academicSummary,
      overallAverage,
      totalAssessments: assessmentResults.length,
    },
    finance: {
      totalInvoiced,
      totalPaid,
      balance,
      invoices: invoicesWithBalance,
      payments: allPayments,
    },
    documents: recentDocs,
    documentCount: documents.length,
    activity,
  });
}
