import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/helpers";

// GET: Invoices for parent's children
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parent = await db.parentGuardian.findUnique({ where: { userId: user.id } });
  if (!parent) {
    return NextResponse.json({ error: "Parent record not found" }, { status: 404 });
  }

  const links = await db.studentGuardian.findMany({
    where: { guardianId: parent.id },
    select: { studentId: true },
  });
  const studentIds = links.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return NextResponse.json({ students: [] });
  }

  const invoices = await db.invoice.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      items: true,
      payments: { select: { amount: true, method: true, reference: true, paidAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const grouped = students.map((s) => {
    const studentInvoices = invoices.filter((i) => i.studentId === s.id);
    const totalOwed = studentInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      return sum + (Number(inv.totalAmount) - paid);
    }, 0);

    return {
      student: s,
      totalOwed: Math.max(0, totalOwed),
      invoices: studentInvoices.map((inv) => {
        const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: Number(inv.totalAmount),
          totalPaid,
          balance: Number(inv.totalAmount) - totalPaid,
          status: inv.status,
          dueDate: inv.dueDate,
          items: inv.items.map((item) => ({
            description: item.description,
            amount: Number(item.amount),
            quantity: item.quantity,
          })),
          payments: inv.payments.map((p) => ({
            amount: Number(p.amount),
            method: p.method,
            reference: p.reference,
            paidAt: p.paidAt,
          })),
          createdAt: inv.createdAt,
        };
      }),
    };
  });

  return NextResponse.json({ students: grouped });
}
