import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("academics.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const studentId = searchParams.get("studentId");
  const academicYearId = searchParams.get("academicYearId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (type) where.type = type;
  if (studentId) where.studentId = studentId;
  if (academicYearId) where.academicYearId = academicYearId;

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.document.count({ where }),
  ]);

  return NextResponse.json({
    documents,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("academics.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { type, studentId, academicYearId } = body;

    if (!type || !studentId) {
      return NextResponse.json(
        { error: "type and studentId are required" },
        { status: 400 }
      );
    }

    const validTypes = ["INVOICE", "TRANSCRIPT", "REPORT_CARD", "STATEMENT", "RECEIPT"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true, studentNumber: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    let documentData: any = {};
    let title = "";

    switch (type) {
      case "TRANSCRIPT": {
        title = `Transcript - ${student.firstName} ${student.lastName}`;
        const academicYearFilter: any = {};
        if (academicYearId) academicYearFilter.id = academicYearId;
        else academicYearFilter.active = true;

        const year = await db.academicYear.findFirst({
          where: academicYearFilter,
        });

        if (!year) {
          return NextResponse.json(
            { error: "No academic year found" },
            { status: 404 }
          );
        }

        const results = await db.assessmentResult.findMany({
          where: {
            studentId,
            assessment: { academicYearId: year.id },
          },
          include: {
            assessment: {
              include: {
                subject: { select: { name: true } },
              },
            },
          },
        });

        const subjectMap = new Map<string, { marks: number[]; totalMarks: number[]; assessments: any[] }>();
        for (const result of results) {
          const subjectName = result.assessment.subject.name;
          if (!subjectMap.has(subjectName)) {
            subjectMap.set(subjectName, { marks: [], totalMarks: [], assessments: [] });
          }
          const data = subjectMap.get(subjectName)!;
          data.marks.push(result.marks);
          data.totalMarks.push(result.assessment.totalMarks);
          data.assessments.push({
            title: result.assessment.title,
            type: result.assessment.type,
            marks: result.marks,
            totalMarks: result.assessment.totalMarks,
            percentage: result.percentage,
            grade: result.grade,
          });
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

          return {
            subject: name,
            average: Math.round(average * 100) / 100,
            grade,
            assessments: data.assessments,
          };
        });

        documentData = {
          student,
          academicYear: year,
          subjects,
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case "REPORT_CARD": {
        title = `Report Card - ${student.firstName} ${student.lastName}`;
        const academicYearFilter: any = {};
        if (academicYearId) academicYearFilter.id = academicYearId;
        else academicYearFilter.active = true;

        const year = await db.academicYear.findFirst({
          where: academicYearFilter,
        });

        if (!year) {
          return NextResponse.json(
            { error: "No academic year found" },
            { status: 404 }
          );
        }

        // Get student enrolment for grade/class info
        const enrolment = await db.enrolment.findFirst({
          where: { studentId, academicYearId: year.id, status: "ACTIVE" },
          include: { grade: { select: { name: true } }, class: { select: { name: true } } },
        });

        // Attendance records
        const attendanceRecords = await db.attendanceRecord.findMany({
          where: {
            studentId,
            attendance: { class: { academicYearId: year.id } },
          },
          include: {
            attendance: { select: { date: true } },
          },
        });

        // Group attendance by quarter (term) based on attendance date
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

        // Assessment results with quarterly breakdown
        const results = await db.assessmentResult.findMany({
          where: {
            studentId,
            assessment: { academicYearId: year.id },
          },
          include: {
            assessment: {
              include: {
                subject: { select: { name: true } },
              },
            },
          },
        });

        // Group by subject, then by quarter
        const subjectQuarterMap = new Map<string, { quarters: Map<number, { marks: number[]; total: number[] }>; allMarks: number[]; allTotal: number[] }>();
        for (const result of results) {
          const subjectName = result.assessment.subject.name;
          if (!subjectQuarterMap.has(subjectName)) {
            subjectQuarterMap.set(subjectName, { quarters: new Map(), allMarks: [], allTotal: [] });
          }
          const subjectData = subjectQuarterMap.get(subjectName)!;
          subjectData.allMarks.push(result.marks);
          subjectData.allTotal.push(result.assessment.totalMarks);

          // Determine quarter from assessment date
          let q = 0;
          if (result.assessment.date) {
            const month = new Date(result.assessment.date).getMonth();
            q = month < 3 ? 0 : month < 6 ? 1 : month < 9 ? 2 : 3;
          } else {
            // Fallback: distribute results evenly across quarters
            const idx = subjectData.allMarks.length - 1;
            q = Math.min(idx % 4, 3);
          }
          if (!subjectData.quarters.has(q)) {
            subjectData.quarters.set(q, { marks: [], total: [] });
          }
          const qData = subjectData.quarters.get(q)!;
          qData.marks.push(result.marks);
          qData.total.push(result.assessment.totalMarks);
        }

        // Build academic results with quarterly breakdown
        const academicResults = Array.from(subjectQuarterMap.entries()).map(([name, data]) => {
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

          return {
            subject: name,
            quarterlyGrades,
            finalPercentage: finalPct,
            finalGrade: calcGrade(finalPct),
          };
        });

        // Calculate GPA per quarter and final
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

        const overallAverage =
          academicResults.length > 0
            ? academicResults.reduce((sum, r) => sum + r.finalPercentage, 0) / academicResults.length
            : 0;

        documentData = {
          student,
          grade: enrolment?.grade?.name || "N/A",
          className: enrolment?.class?.name || null,
          academicYear: year,
          attendance: attendanceSummary,
          attendanceRate:
            attendanceSummary.total > 0
              ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100 * 100) / 100
              : 0,
          academicResults,
          quarterlyGPAs,
          finalGPA,
          overallAverage: Math.round(overallAverage * 100) / 100,
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case "STATEMENT": {
        title = `Statement - ${student.firstName} ${student.lastName}`;
        const invoices = await db.invoice.findMany({
          where: { studentId },
          include: {
            items: true,
            payments: { orderBy: { paidAt: "asc" } },
            feeStructure: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        });

        const statementItems: any[] = [];
        let balance = 0;

        for (const invoice of invoices) {
          balance += Number(invoice.totalAmount);
          statementItems.push({
            type: "INVOICE",
            date: invoice.createdAt,
            description: `Invoice ${invoice.invoiceNumber}${invoice.feeStructure ? ` - ${invoice.feeStructure.name}` : ""}`,
            amount: Number(invoice.totalAmount),
            balance,
          });

          for (const payment of invoice.payments) {
            balance -= Number(payment.amount);
            statementItems.push({
              type: "PAYMENT",
              date: payment.paidAt,
              description: `Payment (${payment.method})${payment.reference ? ` - ${payment.reference}` : ""}`,
              amount: -Number(payment.amount),
              balance,
            });
          }
        }

        const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalPaid = invoices.reduce(
          (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
          0
        );

        documentData = {
          student,
          items: statementItems,
          totalInvoiced,
          totalPaid,
          balance: totalInvoiced - totalPaid,
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case "RECEIPT": {
        title = `Receipt - ${student.firstName} ${student.lastName}`;
        const invoices = await db.invoice.findMany({
          where: { studentId },
          include: {
            payments: { orderBy: { paidAt: "desc" } },
          },
        });

        const allPayments = invoices.flatMap((inv) =>
          inv.payments.map((p) => ({
            ...p,
            invoiceNumber: inv.invoiceNumber,
          }))
        );

        documentData = {
          student,
          payments: allPayments,
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case "INVOICE": {
        title = `Invoice - ${student.firstName} ${student.lastName}`;

        // Find the student's most recent invoice (or by academicYearId if provided)
        const invoiceWhere: any = { studentId };
        if (academicYearId) invoiceWhere.academicYearId = academicYearId;

        const invoice = await db.invoice.findFirst({
          where: invoiceWhere,
          include: {
            items: true,
            payments: { orderBy: { paidAt: "asc" } },
            feeStructure: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!invoice) {
          return NextResponse.json(
            { error: "No invoice found for this student" },
            { status: 404 }
          );
        }

        const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAmount = Number(invoice.totalAmount);

        documentData = {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.createdAt,
          dueDate: invoice.dueDate,
          status: invoice.status,
          totalAmount,
          paidAmount,
          balance: totalAmount - paidAmount,
          student,
          feeStructure: invoice.feeStructure?.name || null,
          items: invoice.items.map((item) => ({
            description: item.description,
            amount: Number(item.amount),
            quantity: item.quantity || 1,
          })),
          payments: invoice.payments.map((p) => ({
            amount: Number(p.amount),
            method: p.method,
            reference: p.reference,
            paidAt: p.paidAt,
          })),
          generatedAt: new Date().toISOString(),
        };
        break;
      }
    }

    const document = await db.document.create({
      data: {
        type,
        title,
        studentId,
        academicYearId: academicYearId || null,
        data: JSON.stringify(documentData),
        generatedById: user.id,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        academicYear: { select: { name: true } },
      },
    });

    await auditLog({
      userId: user.id,
      action: "document.created",
      resource: "document",
      resourceId: document.id,
      metadata: {
        type,
        studentName: `${student.firstName} ${student.lastName}`,
        title,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (e: any) {
    console.error("Error creating document:", e);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}