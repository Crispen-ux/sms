import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { createStaffSchema, paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("staff.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { staffNumber: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [staff, total] = await Promise.all([
    db.staff.findMany({
      where,
      include: {
        user: { select: { email: true, role: true, status: true, active: true } },
        _count: { select: { teacherClasses: true, teacherSubjects: true } },
      },
      orderBy: { firstName: "asc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.staff.count({ where }),
  ]);

  return NextResponse.json({ staff, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("staff.write");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createStaffSchema.parse(body);

    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school configured" }, { status: 400 });
    }

    const createData: any = {
      schoolId: school.id,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    if (data.userId) createData.userId = data.userId;
    if (data.phone) createData.phone = data.phone;
    if (data.position) createData.position = data.position;
    if (data.staffNumber) createData.staffNumber = data.staffNumber;

    const staff = await db.staff.create({ data: createData });

    await auditLog({
      userId: user.id,
      action: "staff.created",
      resource: "staff",
      resourceId: staff.id,
      metadata: { name: `${data.firstName} ${data.lastName}` },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
