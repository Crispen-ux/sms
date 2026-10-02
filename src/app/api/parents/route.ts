import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createParentSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const params = paginationSchema.parse(Object.fromEntries(searchParams));

    const where: any = {};
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [parents, total] = await Promise.all([
      db.parentGuardian.findMany({
        where,
        include: {
          studentLinks: {
            include: { student: { select: { firstName: true, lastName: true, studentNumber: true } } },
          },
        },
        orderBy: { firstName: "asc" },
        take: params.limit,
        skip: (params.page - 1) * params.limit,
      }),
      db.parentGuardian.count({ where }),
    ]);

    return NextResponse.json({ parents, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
  } catch (e: any) {
    console.error("Error fetching parents:", e);
    return NextResponse.json({ error: "Failed to fetch parents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("students.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createParentSchema.parse(body);

    const createData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      relationship: data.relationship,
    };
    if (data.email) createData.email = data.email;

    const parent = await db.parentGuardian.create({ data: createData });

    await auditLog({
      userId: user.id,
      action: "parent.created",
      resource: "parent",
      resourceId: parent.id,
      metadata: { name: `${data.firstName} ${data.lastName}` },
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create parent" }, { status: 500 });
  }
}
