import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { type, classId, academicYearId, studentIds } = body;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const validTypes = ["REPORT_CARD", "TRANSCRIPT", "STATEMENT", "RECEIPT"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Determine which students to process
    let targetStudentIds: string[] = [];

    if (studentIds && studentIds.length > 0) {
      // Use explicitly provided student IDs
      targetStudentIds = studentIds;
    } else if (classId) {
      // Get all students enrolled in this class
      const enrolments = await db.enrolment.findMany({
        where: {
          classId,
          status: "ACTIVE",
          ...(academicYearId ? { academicYearId } : {}),
        },
        select: { studentId: true },
      });
      targetStudentIds = enrolments.map((e) => e.studentId);
    } else if (academicYearId) {
      // Get all students enrolled in this academic year
      const enrolments = await db.enrolment.findMany({
        where: {
          academicYearId,
          status: "ACTIVE",
        },
        select: { studentId: true },
      });
      targetStudentIds = enrolments.map((e) => e.studentId);
    } else {
      return NextResponse.json(
        { error: "Provide classId, academicYearId, or studentIds" },
        { status: 400 }
      );
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json(
        { error: "No students found matching the criteria" },
        { status: 404 }
      );
    }

    // Limit to 200 students per batch
    if (targetStudentIds.length > 200) {
      return NextResponse.json(
        { error: "Batch size limited to 200 students. Please narrow your selection." },
        { status: 400 }
      );
    }

    // Generate documents for each student by calling the existing logic inline
    const results: { studentId: string; studentName: string; documentId: string | null; error: string | null }[] = [];

    // Get the academic year
    const yearFilter: any = {};
    if (academicYearId) yearFilter.id = academicYearId;
    else yearFilter.active = true;
    const year = await db.academicYear.findFirst({ where: yearFilter });

    if (!year) {
      return NextResponse.json({ error: "No academic year found" }, { status: 404 });
    }

    for (const studentId of targetStudentIds) {
      try {
        const student = await db.student.findUnique({
          where: { id: studentId },
          select: { id: true, firstName: true, lastName: true, studentNumber: true },
        });

        if (!student) {
          results.push({ studentId, studentName: "Unknown", documentId: null, error: "Student not found" });
          continue;
        }

        const studentName = `${student.firstName} ${student.lastName}`;
        let documentData: any = {};
        let title = "";

        if (type === "REPORT_CARD") {
          title = `Report Card - ${studentName}`;

          const enrolment = await db.enrolment.findFirst({
            where: { studentId, academicYearId: year.id, status: "ACTIVE" },
            include: { grade: { select: { name: true } }, class: { select: { name: true } } },
          });

          const attendanceRecords = await db.attendanceRecord.findMany({
            where: { studentId, attendance: { class: { academicYearId: year.id } } },
            include: { attendance: { select: { date: true } } },
          });

          const quarterlyAttendance = [0, 0, 0, 0];
          const quarterlyPresent = [0, 0, 0, 0];
          const quarterlyAbsent = [0, 0, 0, 0];
          const quarterlyLate = [0, 0, 0, 0];
          for (const record of attendanceRecords) {
            const month = new Date(record.attendance.date).getMonth();
            const q = month < 3 ? 0 : month < 6 ? 1 : month < 9 ? 2 : 3;
            quarterlyAttendance[q]++;
            if (record.status === "PRESENT") quarterlyPresent[q]++;
            else if (record.status === "ABSENT") quarterlyAbsent[q]++;
            else if (record.status === "LATE") quarterlyLate[q]++;
          }

          const attendanceSummary = {
            total: attendanceRecords.length,
            present: attendanceRecords.filter((r) => r.status === "PRESENT").length,
            absent: attendanceRecords.filter((r) => r.status === "ABSENT").length,
            late: attendanceRecords.filter((r) => r.status === "LATE").length,
            excused: attendanceRecords.filter((r) => r.status === "EXCUSED").length,
            quarterly: [
              { total: quarterlyAttendance[0], present: quarterlyPresent[0], absent: quarterlyAbsent[0], late: quarterlyLate[0] },
              { total: quarterlyAttendance[1], present: quarterlyPresent[1], absent: quarterlyAbsent[1], late: quarterlyLate[1] },
              { total: quarterlyAttendance[2], present: quarterlyPresent[2], absent: quarterlyAbsent[2], late: quarterlyLate[2] },
              { total: quarterlyAttendance[3], present: quarterlyPresent[3], absent: quarterlyAbsent[3], late: quarterlyLate[3] },
            ],
          };

          const results2 = await db.assessmentResult.findMany({
            where: { studentId, assessment: { academicYearId: year.id } },
            include: { assessment: { include: { subject: { select: { name: true } } } } },
          });

          const subjectQuarterMap = new Map<string, { quarters: Map<number, { marks: number[]; total: number[] }>; allMarks: number[]; allTotal: number[] }>();
          for (const result of results2) {
            const subjectName = result.assessment.subject.name;
            if (!subjectQuarterMap.has(subjectName)) {
              subjectQuarterMap.set(subjectName, { quarters: new Map(), allMarks: [], allTotal: [] });
            }
            const sd = subjectQuarterMap.get(subjectName)!;
            sd.allMarks.push(result.marks);
            sd.allTotal.push(result.assessment.totalMarks);
            let q = 0;
            if (result.assessment.date) {
              const month = new Date(result.assessment.date).getMonth();
              q = month < 3 ? 0 : month < 6 ? 1 : month < 9 ? 2 : 3;
            } else {
              q = Math.min(sd.allMarks.length - 1 % 4, 3);
            }
            if (!sd.quarters.has(q)) sd.quarters.set(q, { marks: [], total: [] });
            const qd = sd.quarters.get(q)!;
            qd.marks.push(result.marks);
            qd.total.push(result.assessment.totalMarks);
          }

          const calcGrade = (pct: number) => {
            if (pct >= 90) return "A";
            if (pct >= 80) return "A-";
            if (pct >= 75) return "B+";
            if (pct >= 70) return "B";
            if (pct >= 65) return "B-";
            if (pct >= 60) return "C+";
            if (pct >= 55) return "C";
            if (pct >= 50) return "C-";
            if (pct >= 45) return "D+";
            if (pct >= 40) return "D";
            if (pct >= 35) return "D-";
            return "F";
          };

          const academicResults = Array.from(subjectQuarterMap.entries()).map(([name, data]) => {
            const quarterlyGrades = [0, 1, 2, 3].map((q) => {
              const qd = data.quarters.get(q);
              if (!qd || qd.marks.length === 0) return null;
              const m = qd.marks.reduce((a, b) => a + b, 0);
              const t = qd.total.reduce((a, b) => a + b, 0);
              const pct = t > 0 ? Math.round((m / t) * 100 * 100) / 100 : 0;
              return { percentage: pct, grade: calcGrade(pct) };
            });
            const totalM = data.allMarks.reduce((a, b) => a + b, 0);
            const totalT = data.allTotal.reduce((a, b) => a + b, 0);
            const finalPct = totalT > 0 ? Math.round((totalM / totalT) * 100 * 100) / 100 : 0;
            return { subject: name, quarterlyGrades, finalPercentage: finalPct, finalGrade: calcGrade(finalPct) };
          });

          const calcGPA = (grades: (string | null)[]) => {
            const gpMap: Record<string, number> = { "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "D-": 0.7, "F": 0.0 };
            const valid = grades.filter((g): g is string => g !== null && gpMap[g] !== undefined);
            if (valid.length === 0) return 0;
            return Math.round((valid.reduce((sum, g) => sum + gpMap[g], 0) / valid.length) * 100) / 100;
          };

          const quarterlyGPAs = [0, 1, 2, 3].map((q) =>
            calcGPA(academicResults.map((r) => r.quarterlyGrades[q]?.grade || null))
          );
          const finalGPA = calcGPA(academicResults.map((r) => r.finalGrade));
          const overallAverage = academicResults.length > 0
            ? academicResults.reduce((sum, r) => sum + r.finalPercentage, 0) / academicResults.length
            : 0;

          documentData = {
            student, grade: enrolment?.grade?.name || "N/A", className: enrolment?.class?.name || null,
            academicYear: year, attendance: attendanceSummary,
            attendanceRate: attendanceSummary.total > 0
              ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100 * 100) / 100 : 0,
            academicResults, quarterlyGPAs, finalGPA,
            overallAverage: Math.round(overallAverage * 100) / 100,
            generatedAt: new Date().toISOString(),
          };
        } else if (type === "TRANSCRIPT") {
          title = `Transcript - ${studentName}`;
          const results2 = await db.assessmentResult.findMany({
            where: { studentId, assessment: { academicYearId: year.id } },
            include: { assessment: { include: { subject: { select: { name: true } } } } },
          });
          const subjectMap = new Map<string, { marks: number[]; totalMarks: number[]; assessments: any[] }>();
          for (const result of results2) {
            const subjectName = result.assessment.subject.name;
            if (!subjectMap.has(subjectName)) subjectMap.set(subjectName, { marks: [], totalMarks: [], assessments: [] });
            const data = subjectMap.get(subjectName)!;
            data.marks.push(result.marks);
            data.totalMarks.push(result.assessment.totalMarks);
            data.assessments.push({ title: result.assessment.title, type: result.assessment.type, marks: result.marks, totalMarks: result.assessment.totalMarks, percentage: result.percentage, grade: result.grade });
          }
          const subjects = Array.from(subjectMap.entries()).map(([name, data]) => {
            const totalMarks = data.marks.reduce((a, b) => a + b, 0);
            const totalPossible = data.totalMarks.reduce((a, b) => a + b, 0);
            const average = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
            let grade = "F";
            if (average >= 90) grade = "A+";
            else if (average >= 80) grade = "A";
            else if (average >= 70) grade = "B";
            else if (average >= 60) grade = "C";
            else if (average >= 50) grade = "D";
            else if (average >= 40) grade = "E";
            return { subject: name, average: Math.round(average * 100) / 100, grade, assessments: data.assessments };
          });
          documentData = { student, academicYear: year, subjects, generatedAt: new Date().toISOString() };
        } else if (type === "STATEMENT") {
          title = `Statement - ${studentName}`;
          const invoices = await db.invoice.findMany({
            where: { studentId },
            include: { items: true, payments: { orderBy: { paidAt: "asc" } }, feeStructure: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          });
          const statementItems: any[] = [];
          let balance = 0;
          for (const invoice of invoices) {
            balance += Number(invoice.totalAmount);
            statementItems.push({ type: "INVOICE", date: invoice.createdAt, description: `Invoice ${invoice.invoiceNumber}${invoice.feeStructure ? ` - ${invoice.feeStructure.name}` : ""}`, amount: Number(invoice.totalAmount), balance });
            for (const payment of invoice.payments) {
              balance -= Number(payment.amount);
              statementItems.push({ type: "PAYMENT", date: payment.paidAt, description: `Payment (${payment.method})${payment.reference ? ` - ${payment.reference}` : ""}`, amount: -Number(payment.amount), balance });
            }
          }
          const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
          const totalPaid = invoices.reduce((sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0);
          documentData = { student, items: statementItems, totalInvoiced, totalPaid, balance: totalInvoiced - totalPaid, generatedAt: new Date().toISOString() };
        } else if (type === "RECEIPT") {
          title = `Receipt - ${studentName}`;
          const invoices = await db.invoice.findMany({ where: { studentId }, include: { payments: { orderBy: { paidAt: "desc" } } } });
          const allPayments = invoices.flatMap((inv) => inv.payments.map((p) => ({ ...p, invoiceNumber: inv.invoiceNumber })));
          documentData = { student, payments: allPayments, generatedAt: new Date().toISOString() };
        }

        const document = await db.document.create({
          data: { type, title, studentId, academicYearId: year.id, data: JSON.stringify(documentData), generatedById: user.id },
        });

        results.push({ studentId, studentName, documentId: document.id, error: null });
      } catch (e: any) {
        results.push({ studentId, studentName: "Error", documentId: null, error: e.message });
      }
    }

    const successCount = results.filter((r) => r.documentId).length;
    const errorCount = results.filter((r) => r.error).length;

    await auditLog({
      userId: user.id,
      action: "document.bulk_generated",
      resource: "document",
      metadata: { type, count: successCount, errors: errorCount },
    });

    return NextResponse.json({
      success: true,
      total: targetStudentIds.length,
      generated: successCount,
      errors: errorCount,
      results,
    });
  } catch (e: any) {
    console.error("Error in bulk document generation:", e);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
