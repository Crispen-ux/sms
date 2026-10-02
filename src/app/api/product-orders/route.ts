import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { paginationSchema } from "@/lib/validation";
import { auth } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const where: any = {};

  // Non-admin users only see their own orders
  if (role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
    where.userId = userId;
  }

  const status = searchParams.get("status");
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    db.productOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      include: {
        items: {
          include: { product: true },
        },
        user: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    db.productOrder.count({ where }),
  ]);

  return NextResponse.json({
    orders,
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
    const { studentId, items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Fetch all products to calculate total and verify stock
    const productIds = items.map((item: any) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      if (!product.active) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not active` },
          { status: 400 }
        );
      }

      const quantity = item.quantity || 1;
      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);
      totalAmount += unitPrice * quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity,
        unitPrice,
      });
    }

    // Create order and decrement stock in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.productOrder.create({
        data: {
          userId: user.id,
          studentId: studentId || null,
          totalAmount,
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Decrement stock for each product
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    await auditLog({
      userId: user.id,
      action: "product_order.created",
      resource: "product_order",
      resourceId: order.id,
      metadata: { totalAmount, itemCount: orderItemsData.length },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
