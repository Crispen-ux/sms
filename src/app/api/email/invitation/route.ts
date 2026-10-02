import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/auth/helpers";
import { sendEmail, invitationEmail, getSchool } from "@/lib/email";
import { db } from "@/lib/db";
import { PRODUCT } from "@/config/product";

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
      include: { invitedBy: { select: { name: true } } },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?token=${invitation.token}`;

    const html = await invitationEmail({
      email: invitation.email,
      role: invitation.role,
      inviteUrl,
    });

    const school = await getSchool();

    await sendEmail({
      to: invitation.email,
      subject: `You're invited to join ${school.name}`,
      html,
      replyTo: school.email || PRODUCT.supportEmail,
    });

    return NextResponse.json({ success: true, message: "Invitation email sent" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send invitation email" }, { status: 500 });
  }
}
