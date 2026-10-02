import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  const school = await db.school.findFirst();
  if (!school) {
    return NextResponse.json({ error: "No school configured" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { logo } = body;

    if (!logo || typeof logo !== "string") {
      return NextResponse.json({ error: "Logo data URI is required" }, { status: 400 });
    }

    if (!logo.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid logo format. Must be a data URI." }, { status: 400 });
    }

    const base64Data = logo.split(",")[1] || "";
    const rawSizeKB = Math.round((base64Data.length * 3) / 4 / 1024);
    if (rawSizeKB > 2048) {
      return NextResponse.json({ error: `Logo too large (${rawSizeKB}KB). Maximum 2MB.`, status: 400 });
    }

    const updated = await db.school.update({
      where: { id: school.id },
      data: { logoUrl: logo },
    });

    await auditLog({
      userId: user.id,
      action: "school.logo_updated",
      resource: "school",
      resourceId: school.id,
      metadata: { rawSizeKB },
    });

    return NextResponse.json({ logoUrl: updated.logoUrl });
  } catch (e: any) {
    console.error("Logo upload error:", e);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}

export async function DELETE() {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  const school = await db.school.findFirst();
  if (!school) {
    return NextResponse.json({ error: "No school configured" }, { status: 404 });
  }

  const updated = await db.school.update({
    where: { id: school.id },
    data: { logoUrl: null },
  });

  await auditLog({
    userId: user.id,
    action: "school.logo_removed",
    resource: "school",
    resourceId: school.id,
    metadata: {},
  });

  return NextResponse.json({ logoUrl: null });
}
