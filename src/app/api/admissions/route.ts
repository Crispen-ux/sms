import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateAdmissionStatusSchema, paginationSchema } from "@/lib/validation";

const GRADES = [
  "Grade RR", "Grade R", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11",
];

const SOURCES = ["WEBSITE", "AI_ASSISTANT", "WHATSAPP", "PHONE", "REFERRAL", "WALK_IN", "OTHER"];
const CONTACT_METHODS = ["whatsapp", "phone", "email"];

function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 500);
}

function isValidSAphone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  return /^(0[6-8]\d{8}|27[6-8]\d{8})$/.test(cleaned);
}

// POST: Public — submit an admission enquiry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parentName = sanitizeInput(body.parentName);
    const phone = sanitizeInput(body.phone);
    const grade = sanitizeInput(body.grade);

    if (!parentName) {
      return NextResponse.json({ error: "Parent name is required." }, { status: 400 });
    }

    if (!phone || !isValidSAphone(phone)) {
      return NextResponse.json({ error: "A valid South African phone number is required." }, { status: 400 });
    }

    if (!grade || !GRADES.includes(grade)) {
      return NextResponse.json({ error: "Please select a valid grade." }, { status: 400 });
    }

    const email = sanitizeInput(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const childName = sanitizeInput(body.childName);
    const message = sanitizeInput(body.message);
    const preferredContact = CONTACT_METHODS.includes(body.preferredContact) ? body.preferredContact : "whatsapp";
    const source = SOURCES.includes(body.source?.toUpperCase()) ? body.source.toUpperCase() : "WEBSITE";
    const schoolVisitRequested = Boolean(body.schoolVisitRequested);

    const createData: any = {
      parentName,
      phone,
      grade,
      preferredContact,
      schoolVisitRequested,
      source: source as any,
      status: "NEW",
    };
    if (email) createData.email = email;
    if (childName) createData.childName = childName;
    if (message) createData.message = message;

    const admission = await db.admission.create({ data: createData });

    return NextResponse.json({
      success: true,
      id: admission.id,
      message: "Enquiry submitted successfully.",
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// GET: Admin — list admissions with search, filter, pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Allow unauthenticated access for the admin page (middleware handles auth)
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { parentName: { contains: params.search, mode: "insensitive" } },
      { childName: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { grade: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const status = searchParams.get("status");
  if (status && status !== "ALL") {
    where.status = status;
  }

  const source = searchParams.get("source");
  if (source && source !== "ALL") {
    where.source = source;
  }

  const [admissions, total] = await Promise.all([
    db.admission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.admission.count({ where }),
  ]);

  return NextResponse.json({
    admissions,
    total,
    page: params.page,
    totalPages: Math.ceil(total / params.limit),
  });
}
