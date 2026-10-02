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
    const order = await db.productOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch order" },
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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existingOrder = await db.productOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // If cancelling, restore stock
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      const orderItems = await db.orderItem.findMany({
        where: { orderId: id },
      });

      await db.$transaction(async (tx) => {
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.productOrder.update({
          where: { id },
          data: { status },
        });
      });
    } else {
      await db.productOrder.update({
        where: { id },
        data: { status },
      });
    }

    await auditLog({
      userId: user.id,
      action: "product_order.status_updated",
      resource: "product_order",
      resourceId: id,
      metadata: { status, previousStatus: existingOrder.status },
    });

    const updatedOrder = await db.productOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
