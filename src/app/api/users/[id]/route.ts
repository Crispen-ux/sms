import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("users.read");
  if (error) return error;

  const { id } = await params;

  const targetUser = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(targetUser);
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
    const data = updateUserSchema.parse(body);

    // Prevent self-demotion
    if (id === user.id && data.role && data.role !== user.role) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Check email uniqueness if changing
    if (data.email) {
      const existing = await db.user.findFirst({
        where: { email: data.email, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await auditLog({
      userId: user.id,
      action: "user.updated",
      resource: "user",
      resourceId: id,
      metadata: data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("users.delete");
  if (error) return error;

  const { id } = await params;

  // Prevent self-deletion
  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Soft delete - deactivate instead
  await db.user.update({
    where: { id },
    data: { active: false },
  });

  await auditLog({
    userId: user.id,
    action: "user.deactivated",
    resource: "user",
    resourceId: id,
    metadata: { email: targetUser.email },
  });

  return NextResponse.json({ success: true });
}
