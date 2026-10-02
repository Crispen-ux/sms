import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("attendance.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  const where: any = { classId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const attendances = await db.attendance.findMany({
    where,
    include: {
      records: {
        select: { status: true },
      },
    },
    orderBy: { date: "desc" },
  });

  // Compute stats
  let totalSessions = attendances.length;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalExcused = 0;
  let totalRecords = 0;

  for (const att of attendances) {
    for (const rec of att.records) {
      totalRecords++;
      switch (rec.status) {
        case "PRESENT": totalPresent++; break;
        case "ABSENT": totalAbsent++; break;
        case "LATE": totalLate++; break;
        case "EXCUSED": totalExcused++; break;
      }
    }
  }

  return NextResponse.json({
    totalSessions,
    totalRecords,
    summary: {
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      excused: totalExcused,
      attendanceRate: totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0,
    },
    sessions: attendances.map((a) => ({
      id: a.id,
      date: a.date,
      total: a.records.length,
      present: a.records.filter((r) => r.status === "PRESENT").length,
      absent: a.records.filter((r) => r.status === "ABSENT").length,
      late: a.records.filter((r) => r.status === "LATE").length,
      excused: a.records.filter((r) => r.status === "EXCUSED").length,
    })),
  });
}
