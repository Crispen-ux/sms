import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("users.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status === "pending") where.acceptedAt = null;
  if (status === "accepted") where.acceptedAt = { not: null };

  const invitations = await db.invitation.findMany({
    where,
    include: { invitedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const validRoles = ["TEACHER", "PARENT", "SCHOOL_ADMIN", "PRINCIPAL"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const existingInvitation = await db.invitation.findFirst({
      where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvitation) {
      return NextResponse.json({ error: "An active invitation already exists for this email" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await db.invitation.create({
      data: {
        email,
        role,
        token,
        invitedById: user.id,
        expiresAt,
      },
    });

    await auditLog({
      userId: user.id,
      action: "invitation.created",
      resource: "invitation",
      resourceId: invitation.id,
      metadata: { email, role },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?token=${token}`;

    return NextResponse.json({
      invitation,
      inviteUrl,
      message: "Invitation created. Share this link with the user.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
