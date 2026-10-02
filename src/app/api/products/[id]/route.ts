import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const updateData: any = { ...body };

    if (body.category) {
      const validCategories = [
        "UNIFORM",
        "STATIONERY",
        "BOOKS",
        "SPORTS",
        "EXTRACURRICULAR",
        "OTHER",
      ];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: `Category must be one of: ${validCategories.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const updated = await db.product.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: user.id,
      action: "product.updated",
      resource: "product",
      resourceId: id,
      metadata: body,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  const { id } = await params;

  try {
    const orderCount = await db.orderItem.count({
      where: { productId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders" },
        { status: 400 }
      );
    }

    await db.product.delete({ where: { id } });

    await auditLog({
      userId: user.id,
      action: "product.deleted",
      resource: "product",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
