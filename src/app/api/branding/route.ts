import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PRODUCT } from "@/config/product";

/**
 * GET /api/branding — public, unauthenticated.
 *
 * Returns product identity plus this installation's school branding so the
 * login page and public surfaces can render school-specific branding without
 * exposing any operational data.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let school: {
    name: string;
    logoUrl: string | null;
    accentColor: string;
    secondaryColor: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    website: string | null;
  } | null = null;

  try {
    school = await db.school.findFirst({
      select: {
        name: true,
        logoUrl: true,
        accentColor: true,
        secondaryColor: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        website: true,
      },
    });
  } catch {
    // Database not reachable — fall through to product defaults.
  }

  return NextResponse.json({
    product: {
      name: PRODUCT.name,
      version: PRODUCT.version,
      companyName: PRODUCT.companyName,
      website: PRODUCT.companyWebsite,
      supportEmail: PRODUCT.supportEmail,
      logo: PRODUCT.logo,
      primaryColor: PRODUCT.primaryColor,
      secondaryColor: PRODUCT.secondaryColor,
    },
    school,
  });
}
