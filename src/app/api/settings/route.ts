import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const { user, error } = await apiAuth("settings.read");
  if (error) return error;

  const school = await db.school.findFirst();
  if (!school) {
    return NextResponse.json({ error: "No school configured" }, { status: 404 });
  }

  return NextResponse.json(school);
}

export async function PUT(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  const body = await request.json();
  const school = await db.school.findFirst();
  if (!school) {
    return NextResponse.json({ error: "No school configured" }, { status: 404 });
  }

  const allowed = [
    "name", "address", "city", "phone", "email", "website", "logoUrl",
    "accentColor", "secondaryColor", "fontFamily",
    "invoicePrefix", "invoiceNotes", "invoiceTerms", "currency", "currencySymbol",
    "emailSignature", "emailFooter",
    "principalName", "principalTitle",
  ];

  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const updated = await db.school.update({
    where: { id: school.id },
    data,
  });

  await auditLog({
    userId: user.id,
    action: "school.updated",
    resource: "school",
    resourceId: school.id,
    metadata: { updatedFields: Object.keys(data) },
  });

  return NextResponse.json(updated);
}
