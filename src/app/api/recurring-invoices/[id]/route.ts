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

  const recurringInvoice = await db.recurringInvoice.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      feeStructure: { select: { id: true, name: true, amount: true, frequency: true } },
      academicYear: { select: { name: true } },
    },
  });

  if (!recurringInvoice) {
    return NextResponse.json({ error: "Recurring invoice not found" }, { status: 404 });
  }

  return NextResponse.json(recurringInvoice);
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
    const { active, nextDueDate } = body;

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (nextDueDate) updateData.nextDueDate = new Date(nextDueDate);

    const recurringInvoice = await db.recurringInvoice.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: user.id,
      action: "recurring_invoice.updated",
      resource: "recurring_invoice",
      resourceId: id,
      metadata: updateData,
    });

    return NextResponse.json(recurringInvoice);
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
    await db.recurringInvoice.delete({ where: { id } });
    await auditLog({
      userId: user.id,
      action: "recurring_invoice.deleted",
      resource: "recurring_invoice",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}