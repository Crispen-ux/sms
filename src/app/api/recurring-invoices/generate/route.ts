import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

function generateInvoiceNumber(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mn = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000).toString();
  return `INV-${yr}${mn}-${rand}`;
}

function calculateNextDueDate(frequency: string, currentDate: Date): Date {
  const next = new Date(currentDate);
  switch (frequency) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "TERM":
      next.setMonth(next.getMonth() + 3);
      break;
    case "ANNUAL":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  try {
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const activeRecurringInvoices = await db.recurringInvoice.findMany({
      where: {
        active: true,
        nextDueDate: { lte: now },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        feeStructure: { select: { name: true, amount: true, frequency: true } },
      },
    });

    const createdInvoices = [];

    for (const recurring of activeRecurringInvoices) {
      const invoiceNumber = generateInvoiceNumber();
      const amount = Number(recurring.feeStructure.amount);

      const invoice = await db.invoice.create({
        data: {
          studentId: recurring.studentId,
          academicYearId: recurring.academicYearId,
          feeStructureId: recurring.feeStructureId,
          invoiceNumber,
          totalAmount: amount,
          dueDate,
          items: {
            create: {
              description: recurring.feeStructure.name,
              amount,
              quantity: 1,
            },
          },
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
          items: true,
        },
      });

      const nextDueDate = calculateNextDueDate(
        recurring.feeStructure.frequency,
        recurring.nextDueDate || now
      );

      await db.recurringInvoice.update({
        where: { id: recurring.id },
        data: {
          lastGeneratedAt: now,
          nextDueDate,
        },
      });

      await auditLog({
        userId: user.id,
        action: "recurring_invoice.generated",
        resource: "invoice",
        resourceId: invoice.id,
        metadata: {
          recurringInvoiceId: recurring.id,
          studentName: `${recurring.student.firstName} ${recurring.student.lastName}`,
          invoiceNumber,
          amount,
          nextDueDate: nextDueDate.toISOString(),
        },
      });

      createdInvoices.push(invoice);
    }

    return NextResponse.json({
      generated: createdInvoices.length,
      invoices: createdInvoices,
    });
  } catch (e: any) {
    console.error("Error generating invoices:", e);
    return NextResponse.json(
      { error: "Failed to generate invoices" },
      { status: 500 }
    );
  }
}