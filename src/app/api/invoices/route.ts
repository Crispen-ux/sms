import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createInvoiceSchema, paginationSchema } from "@/lib/validation";

function generateInvoiceNumber(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mn = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${yr}${mn}-${rand}`;
}

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("finance.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { invoiceNumber: { contains: params.search, mode: "insensitive" } },
      { student: { firstName: { contains: params.search, mode: "insensitive" } } },
      { student: { lastName: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const status = searchParams.get("status");
  if (status && status !== "ALL") where.status = status;

  const academicYearId = searchParams.get("academicYearId");
  if (academicYearId) where.academicYearId = academicYearId;

  const studentId = searchParams.get("studentId");
  if (studentId) where.studentId = studentId;

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        academicYear: { select: { name: true } },
        items: true,
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.invoice.count({ where }),
  ]);

  // Calculate total paid per invoice
  const invoicesWithPaid = invoices.map((inv) => {
    const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(inv.totalAmount);
    return {
      ...inv,
      totalPaid,
      balance: totalAmount - totalPaid,
    };
  });

  return NextResponse.json({ invoices: invoicesWithPaid, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // Calculate total from items
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount * (item.quantity || 1), 0);

    const createData: any = {
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      invoiceNumber: generateInvoiceNumber(),
      totalAmount,
      status: "PENDING",
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          amount: item.amount,
          quantity: item.quantity || 1,
        })),
      },
    };
    if (data.feeStructureId) createData.feeStructureId = data.feeStructureId;
    if (data.dueDate) createData.dueDate = new Date(data.dueDate);

    const invoice = await db.invoice.create({
      data: createData,
      include: {
        student: { select: { firstName: true, lastName: true } },
        items: true,
      },
    });

    await auditLog({
      userId: user.id,
      action: "invoice.created",
      resource: "invoice",
      resourceId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, totalAmount },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
