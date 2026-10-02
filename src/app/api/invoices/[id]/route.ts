import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("finance.read");
  if (error) return error;

  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      academicYear: { select: { name: true } },
      items: true,
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return NextResponse.json({
    ...invoice,
    totalPaid,
    balance: Number(invoice.totalAmount) - totalPaid,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await db.invoice.update({ where: { id }, data: body });
    await auditLog({ userId: user.id, action: "invoice.updated", resource: "invoice", resourceId: id, metadata: body });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.payment.deleteMany({ where: { invoiceId: id } });
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await db.invoice.delete({ where: { id } });
    await auditLog({ userId: user.id, action: "invoice.deleted", resource: "invoice", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
