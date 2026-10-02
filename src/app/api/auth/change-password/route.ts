import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!fullUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(
      data.currentPassword,
      fullUser.passwordHash
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await auditLog({
      userId: user.id,
      action: "user.password_changed",
      resource: "user",
      resourceId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
