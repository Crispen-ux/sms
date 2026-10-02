import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { paginationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const category = searchParams.get("category");
  if (category) where.category = category;

  const active = searchParams.get("active");
  if (active !== null) where.active = active === "true";

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      include: {
        _count: { select: { orderItems: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page: params.page,
    totalPages: Math.ceil(total / params.limit),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, category, price, stock, imageUrl, active } =
      body;

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: "Name, category, and price are required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "UNIFORM",
      "STATIONERY",
      "BOOKS",
      "SPORTS",
      "EXTRACURRICULAR",
      "OTHER",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        description: description || null,
        category,
        price,
        stock: stock ?? 0,
        imageUrl: imageUrl || null,
        active: active ?? true,
      },
    });

    await auditLog({
      userId: user.id,
      action: "product.created",
      resource: "product",
      resourceId: product.id,
      metadata: { name, category, price },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
