import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { sendEmail, overdueInvoiceReminderEmail, getSchool } from "@/lib/email";
import { PRODUCT } from "@/config/product";

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { invoiceIds, dryRun } = body;

    const where: any = {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      dueDate: { lt: new Date() },
    };

    if (invoiceIds && invoiceIds.length > 0) {
      where.id = { in: invoiceIds };
    }

    const overdueInvoices = await db.invoice.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, studentNumber: true,
          },
        },
        payments: { select: { amount: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    // Fetch guardian links separately for all students
    const studentIds = [...new Set(overdueInvoices.map((inv) => inv.studentId))];
    const guardianLinks = await db.studentGuardian.findMany({
      where: { studentId: { in: studentIds } },
      include: { guardian: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    const guardiansByStudent = new Map<string, typeof guardianLinks>();
    for (const gl of guardianLinks) {
      const existing = guardiansByStudent.get(gl.studentId) || [];
      existing.push(gl);
      guardiansByStudent.set(gl.studentId, existing);
    }

    if (overdueInvoices.length === 0) {
      return NextResponse.json({ message: "No overdue invoices found", sent: 0 });
    }

    const results: { invoiceId: string; invoiceNumber: string; studentName: string; sent: boolean; error?: string }[] = [];
    let sentCount = 0;
    const school = await getSchool();

    for (const invoice of overdueInvoices) {
      const paidAmount = invoice.payments.reduce((sum: number, p: { amount: any }) => sum + Number(p.amount), 0);
      const balance = Number(invoice.totalAmount) - paidAmount;
      const daysOverdue = invoice.dueDate
        ? Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000)
        : 0;
      const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;

      const studentGuardians = guardiansByStudent.get(invoice.studentId) || [];
      const guardianEmails = studentGuardians
        .map((sg) => sg.guardian.email)
        .filter(Boolean) as string[];

      if (guardianEmails.length === 0) {
        results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, studentName, sent: false, error: "No guardian email found" });
        continue;
      }

      if (dryRun) {
        results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, studentName, sent: false, error: "Dry run — no email sent" });
        continue;
      }

      try {
        const parentName = studentGuardians[0]
          ? `${studentGuardians[0].guardian.firstName} ${studentGuardians[0].guardian.lastName}`
          : "Parent/Guardian";

        const html = await overdueInvoiceReminderEmail({
          studentName,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: Number(invoice.totalAmount),
          balance,
          dueDate: invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })
            : "N/A",
          parentName,
          daysOverdue,
          paymentLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/invoices`,
        });

        await sendEmail({
          to: guardianEmails,
          subject: `Payment Reminder: ${invoice.invoiceNumber} — ${daysOverdue} days overdue`,
          html,
          replyTo: school.email || PRODUCT.supportEmail,
        });

        if (invoice.status !== "OVERDUE") {
          await db.invoice.update({ where: { id: invoice.id }, data: { status: "OVERDUE" } });
        }

        results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, studentName, sent: true });
        sentCount++;
      } catch (e: any) {
        results.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, studentName, sent: false, error: e.message });
      }
    }

    await auditLog({
      userId: user.id,
      action: "invoice.reminders_sent",
      resource: "invoice",
      metadata: { total: overdueInvoices.length, sent: sentCount, dryRun: !!dryRun },
    });

    return NextResponse.json({ success: true, total: overdueInvoices.length, sent: sentCount, results });
  } catch (e: any) {
    console.error("Error sending overdue reminders:", e);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("finance.read");
  if (error) return error;

  const overdueInvoices = await db.invoice.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      dueDate: { lt: new Date() },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const results = overdueInvoices.map((inv) => {
    const paid = inv.payments.reduce((sum: number, p: { amount: any }) => sum + Number(p.amount), 0);
    const balance = Number(inv.totalAmount) - paid;
    const daysOverdue = inv.dueDate
      ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000)
      : 0;
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentName: `${inv.student.firstName} ${inv.student.lastName}`,
      totalAmount: Number(inv.totalAmount),
      balance,
      dueDate: inv.dueDate,
      daysOverdue,
      status: inv.status,
    };
  });

  return NextResponse.json({ invoices: results, total: results.length });
}
