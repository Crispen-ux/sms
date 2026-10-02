import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/auth/helpers";
import { sendEmail, generalEmail, getSchool } from "@/lib/email";
import { PRODUCT } from "@/config/product";

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("users.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { to, subject, body: emailBody, recipientName } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "To, subject, and body are required" }, { status: 400 });
    }

    const html = await generalEmail({ subject, body: emailBody.replace(/\n/g, "<br>"), recipientName });

    const school = await getSchool();

    await sendEmail({
      to,
      subject,
      html,
      replyTo: school.email || PRODUCT.supportEmail,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
  }
}
