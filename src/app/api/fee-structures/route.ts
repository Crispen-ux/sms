import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createFeeStructureSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("finance.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { grade: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const academicYearId = searchParams.get("academicYearId");
  if (academicYearId) where.academicYearId = academicYearId;

  const [fees, total] = await Promise.all([
    db.feeStructure.findMany({
      where,
      include: {
        grade: { select: { name: true } },
        academicYear: { select: { name: true, active: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { grade: { name: "asc" } },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.feeStructure.count({ where }),
  ]);

  return NextResponse.json({ fees, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createFeeStructureSchema.parse(body);

    const fee = await db.feeStructure.create({
      data: {
        academicYearId: data.academicYearId,
        gradeId: data.gradeId,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency || "MONTHLY",
        active: data.active ?? true,
      },
      include: {
        grade: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
    });

    await auditLog({
      userId: user.id,
      action: "fee_structure.created",
      resource: "fee_structure",
      resourceId: fee.id,
      metadata: { name: data.name, amount: data.amount },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create fee structure" }, { status: 500 });
  }
}
