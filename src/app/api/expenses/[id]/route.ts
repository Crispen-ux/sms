import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("accounting.read");
  if (error) return error;

  const { id } = await params;

  const expense = await db.expense.findUnique({ where: { id } });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("accounting.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();

    if (body.date) body.date = new Date(body.date);

    const expense = await db.expense.update({ where: { id }, data: body });

    await auditLog({
      userId: user.id,
      action: "expense.updated",
      resource: "expense",
      resourceId: id,
      metadata: body,
    });

    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("accounting.write");
  if (error) return error;

  const { id } = await params;

  try {
    await db.expense.delete({ where: { id } });

    await auditLog({
      userId: user.id,
      action: "expense.deleted",
      resource: "expense",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
