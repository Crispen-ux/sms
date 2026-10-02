"use client";

import { useState, useEffect } from "react";
import { Card, Select, Badge, LoadingState, Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui";
import { AlertCircle, ClipboardCheck } from "lucide-react";

interface AttendanceSummary {
  student: { id: string; firstName: string; lastName: string };
  summary: { total: number; present: number; absent: number; late: number; excused: number; attendanceRate: number };
  records: { date: string; status: string; reason: string | null; className: string; gradeName: string }[];
}

const STATUS_BADGES: Record<string, string> = {
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  EXCUSED: "info",
};

export default function ParentAttendancePage() {
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    fetch("/api/parent/attendance")
      .then((r) => r.json())
      .then((d) => {
        setData(d.students || []);
        if (d.students?.length > 0) setSelectedStudent(d.students[0].student.id);
      })
      .catch(() => setError("Failed to load attendance"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;

  const current = data.find((d) => d.student.id === selectedStudent);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Attendance</h1>

      {data.length === 0 ? (
        <Card><p className="text-brand-gray text-center py-8">No attendance records found.</p></Card>
      ) : (
        <>
          {data.length > 1 && (
            <Card className="mb-6">
              <Select
                label="Select Child"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={data.map((d) => ({ value: d.student.id, label: `${d.student.firstName} ${d.student.lastName}` }))}
              />
            </Card>
          )}

          {current && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                <Card className="text-center">
                  <p className="text-2xl font-bold text-brand-dark">{current.summary.total}</p>
                  <p className="text-xs text-brand-gray">Total Sessions</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-green-600">{current.summary.present}</p>
                  <p className="text-xs text-brand-gray">Present</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-red-600">{current.summary.absent}</p>
                  <p className="text-xs text-brand-gray">Absent</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{current.summary.late}</p>
                  <p className="text-xs text-brand-gray">Late</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-brand-dark">{current.summary.attendanceRate}%</p>
                  <p className="text-xs text-brand-gray">Attendance Rate</p>
                </Card>
              </div>

              {/* Records */}
              <Card padding={false}>
                {current.records.length === 0 ? (
                  <p className="text-brand-gray text-center py-8">No records yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell className="font-semibold text-brand-dark">Date</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Class</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Reason</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {current.records.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-brand-dark">{new Date(r.date).toLocaleDateString("en-ZA")}</TableCell>
                          <TableCell className="text-brand-gray">{r.gradeName}</TableCell>
                          <TableCell className="text-brand-gray">{r.className}</TableCell>
                          <TableCell><Badge variant={STATUS_BADGES[r.status] as any || "default"}>{r.status}</Badge></TableCell>
                          <TableCell className="text-brand-gray text-sm">{r.reason || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
