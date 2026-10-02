import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createExpenseSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("accounting.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};

  if (params.search) {
    where.OR = [
      { description: { contains: params.search, mode: "insensitive" } },
      { vendor: { contains: params.search, mode: "insensitive" } },
      { reference: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const category = searchParams.get("category");
  if (category && category !== "ALL") where.category = category;

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [expenses, total] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.expense.count({ where }),
  ]);

  return NextResponse.json({
    expenses,
    total,
    page: params.page,
    totalPages: Math.ceil(total / params.limit),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("accounting.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createExpenseSchema.parse(body);

    const expense = await db.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date ? new Date(data.date) : new Date(),
        reference: data.reference,
        vendor: data.vendor,
        notes: data.notes,
        recordedById: user.id,
      },
    });

    await auditLog({
      userId: user.id,
      action: "expense.created",
      resource: "expense",
      resourceId: expense.id,
      metadata: { description: expense.description, amount: Number(expense.amount), category: expense.category },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
