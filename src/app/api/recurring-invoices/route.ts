import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("finance.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get("academicYearId");
  const studentId = searchParams.get("studentId");
  const active = searchParams.get("active");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (academicYearId) where.academicYearId = academicYearId;
  if (studentId) where.studentId = studentId;
  if (active !== null && active !== undefined) where.active = active === "true";

  const [recurringInvoices, total] = await Promise.all([
    db.recurringInvoice.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        feeStructure: { select: { id: true, name: true, amount: true, frequency: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.recurringInvoice.count({ where }),
  ]);

  return NextResponse.json({
    recurringInvoices,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { studentId, feeStructureId, academicYearId, nextDueDate } = body;

    if (!studentId || !feeStructureId || !academicYearId) {
      return NextResponse.json(
        { error: "studentId, feeStructureId, and academicYearId are required" },
        { status: 400 }
      );
    }

    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    const recurringInvoice = await db.recurringInvoice.create({
      data: {
        studentId,
        feeStructureId,
        academicYearId,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : new Date(),
        active: true,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        feeStructure: { select: { name: true, amount: true, frequency: true } },
      },
    });

    await auditLog({
      userId: user.id,
      action: "recurring_invoice.created",
      resource: "recurring_invoice",
      resourceId: recurringInvoice.id,
      metadata: {
        studentName: `${recurringInvoice.student.firstName} ${recurringInvoice.student.lastName}`,
        feeName: recurringInvoice.feeStructure.name,
        amount: Number(recurringInvoice.feeStructure.amount),
      },
    });

    return NextResponse.json(recurringInvoice, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to create recurring invoice" },
      { status: 500 }
    );
  }
}