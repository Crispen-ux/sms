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

  const parent = await db.parentGuardian.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true } },
      studentLinks: {
        include: {
          student: {
            include: {
              enrolments: {
                include: {
                  grade: { select: { id: true, name: true } },
                  class: { select: { id: true, name: true } },
                  academicYear: true,
                },
                orderBy: { enrolledAt: "desc" },
              },
              guardianLinks: {
                include: { guardian: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, relationship: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Parent not found" }, { status: 404 });
  }

  const studentIds = parent.studentLinks.map((sl) => sl.student.id);

  const [invoices, documents, auditLogs] = await Promise.all([
    studentIds.length > 0
      ? db.invoice.findMany({
          where: { studentId: { in: studentIds } },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            items: true,
            payments: true,
            academicYear: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
    studentIds.length > 0
      ? db.document.findMany({
          where: { studentId: { in: studentIds } },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            academicYear: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
    parent.user
      ? db.auditLog.findMany({
          where: { userId: parent.user.id },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
  ]);

  // Compute per-child summaries
  const children = parent.studentLinks.map((sl) => {
    const student = sl.student;
    const activeEnrolment = student.enrolments.find(
      (e) => e.academicYear.active && e.status === "ACTIVE"
    );

    // Financial summary for this child
    const childInvoices = invoices.filter((inv) => inv.studentId === student.id);
    const totalInvoiced = childInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = childInvoices.reduce(
      (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
      0
    );
    const balance = totalInvoiced - totalPaid;

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      isPrimary: sl.isPrimary,
      activeEnrolment: activeEnrolment || null,
      enrolments: student.enrolments,
      allGuardians: student.guardianLinks.map((gl) => ({
        id: gl.guardian.id,
        firstName: gl.guardian.firstName,
        lastName: gl.guardian.lastName,
        phone: gl.guardian.phone,
        email: gl.guardian.email,
        relationship: gl.guardian.relationship,
        isPrimary: gl.isPrimary,
      })),
      finance: {
        totalInvoiced,
        totalPaid,
        balance,
        invoiceCount: childInvoices.length,
      },
    };
  });

  // Aggregate financial summary
  const totalOutstanding = children.reduce((sum, c) => sum + c.finance.balance, 0);
  const totalPaid = children.reduce((sum, c) => sum + c.finance.totalPaid, 0);
  const totalInvoiced = children.reduce((sum, c) => sum + c.finance.totalInvoiced, 0);

  // Invoice summary
  const invoiceSummary = invoices.map((inv) => {
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
      student: inv.student,
      academicYear: inv.academicYear,
      items: inv.items,
    };
  });

  // Payment summary
  const allPayments = invoices.flatMap((inv) =>
    inv.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference,
      paidAt: p.paidAt,
      invoiceNumber: inv.invoiceNumber,
      student: inv.student,
    }))
  ).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  return NextResponse.json({
    parent,
    children,
    finance: {
      totalOutstanding,
      totalPaid,
      totalInvoiced,
      invoices: invoiceSummary,
      payments: allPayments,
    },
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      createdAt: d.createdAt,
      student: d.student,
      academicYear: d.academicYear,
    })),
    documentCount: documents.length,
    activity: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      metadata: log.metadata,
      createdAt: log.createdAt,
      userName: log.user?.name || "System",
    })),
  });
}
