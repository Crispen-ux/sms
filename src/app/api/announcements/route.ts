import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { paginationSchema } from "@/lib/validation";
import { sendEmail, announcementEmail, getSchool } from "@/lib/email";
import { PRODUCT } from "@/config/product";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = paginationSchema.parse(Object.fromEntries(searchParams));

  const where: any = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { content: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const target = searchParams.get("target");
  if (target && target !== "ALL") where.target = target;

  const published = searchParams.get("published");
  if (published !== null) where.published = published === "true";

  const [announcements, total] = await Promise.all([
    db.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    db.announcement.count({ where }),
  ]);

  return NextResponse.json({ announcements, total, page: params.page, totalPages: Math.ceil(total / params.limit) });
}

export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("announcements.write");
  if (error) return error;

  try {
    const body = await request.json();
    const { title, content, target, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        target: target || "ALL",
        published: published ?? false,
        publishedAt: published ? new Date() : null,
      },
    });

    await auditLog({
      userId: user.id,
      action: "announcement.created",
      resource: "announcement",
      resourceId: announcement.id,
      metadata: { title, target },
    });

    // Send email notifications if published
    if (published) {
      try {
        const html = await announcementEmail({
          title,
          content,
          target: target || "ALL",
          publishedAt: new Date().toISOString(),
        });

        // Collect recipient emails based on target
        let recipients: string[] = [];
        if (target === "ALL" || target === "PARENTS") {
          const parents = await db.parentGuardian.findMany({
            where: { user: { status: "ACTIVE" } },
            select: { email: true },
          });
          recipients.push(...parents.map((p) => p.email).filter((e): e is string => Boolean(e)));
        }
        if (target === "ALL" || target === "TEACHERS") {
          const teachers = await db.staff.findMany({
            where: { user: { status: "ACTIVE" }, position: { contains: "Teacher", mode: "insensitive" } },
            select: { user: { select: { email: true } } },
          });
          teachers.forEach((t) => { if (t.user?.email) recipients.push(t.user.email); });
        }

        // Deduplicate
        recipients = [...new Set(recipients)];

        if (recipients.length > 0) {
          const school = await getSchool();
          await sendEmail({
            to: recipients,
            subject: `Announcement: ${title}`,
            html,
            replyTo: school.email || PRODUCT.supportEmail,
          });
        }
      } catch (e: any) {
        console.error("Failed to send announcement emails:", e.message);
        // Don't fail the announcement creation if email fails
      }
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
