"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Select, Badge,
  EmptyState, LoadingState,
} from "@/components/ui";
import { Calendar, AlertCircle, CheckCircle, Save, ChevronLeft, ChevronRight, ClipboardCheck, TrendingUp } from "lucide-react";

interface ClassItem { id: string; name: string; grade: { name: string }; }
interface Student { id: string; firstName: string; lastName: string; studentNumber: string | null; }
interface AttendanceRecord { id: string | null; studentId: string; student: Student; status: string; reason: string | null; }
interface AttendanceData { id: string | null; classId: string; date: string; className: string; gradeName: string; records: AttendanceRecord[]; taken: boolean; }

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
  { value: "LATE", label: "Late", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
];

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.color || STATUS_OPTIONS[0].color;
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [records, setRecords] = useState<Record<string, { status: string; reason: string }>>({});
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes?limit=100");
        const data = await res.json();
        setClasses(data.classes);
        if (data.classes.length > 0) setSelectedClass(data.classes[0].id);
      } catch { setError("Failed to load classes"); }
      finally { setClassesLoading(false); }
    };
    fetchClasses();
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !date) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance?classId=${selectedClass}&date=${date}`);
      const data = await res.json();
      setAttendance(data);
      const recordsMap: Record<string, { status: string; reason: string }> = {};
      for (const r of data.records) {
        recordsMap[r.studentId] = { status: r.status, reason: r.reason || "" };
      }
      setRecords(recordsMap);
    } catch { setError("Failed to load attendance"); }
    finally { setLoading(false); }
  }, [selectedClass, date]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const fetchStats = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch(`/api/attendance/stats?classId=${selectedClass}&startDate=${new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]}&endDate=${date}`);
      const data = await res.json();
      setStats(data);
    } catch { /* ignore */ }
  }, [selectedClass, date]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, reason: prev[studentId]?.reason || "" },
    }));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], reason },
    }));
  };

  const handleSave = async () => {
    if (!attendance) return;
    setSaving(true);
    setError("");
    try {
      const recordList = Object.entries(records).map(([studentId, r]) => ({
        studentId,
        status: r.status as any,
        reason: r.reason || undefined,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, date, records: recordList }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Attendance saved successfully");
      fetchAttendance();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to save attendance"); setTimeout(() => setError(""), 3000); }
    finally { setSaving(false); }
  };

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  const markAll = (status: string) => {
    const updated: Record<string, { status: string; reason: string }> = {};
    for (const key of Object.keys(records)) {
      updated[key] = { status, reason: "" };
    }
    setRecords(updated);
  };

  const present = Object.values(records).filter((r) => r.status === "PRESENT").length;
  const absent = Object.values(records).filter((r) => r.status === "ABSENT").length;
  const late = Object.values(records).filter((r) => r.status === "LATE").length;
  const excused = Object.values(records).filter((r) => r.status === "EXCUSED").length;
  const total = Object.keys(records).length;

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track daily student attendance by class."
        action={
          <Button onClick={handleSave} disabled={saving || !attendance} icon={<Save className="w-4 h-4" />}>
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        }
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Controls */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classes.map((c) => ({ value: c.id, label: `${c.grade.name} — ${c.name}` }))}
              placeholder={classesLoading ? "Loading classes..." : "Select class"}
            />
          </div>
          <div className="flex items-end gap-1">
            <button onClick={() => shiftDate(-1)} className="p-2.5 hover:bg-brand-light rounded-lg border border-brand-mid/30"><ChevronLeft className="w-4 h-4" /></button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-brand-mid/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
            />
            <button onClick={() => shiftDate(1)} className="p-2.5 hover:bg-brand-light rounded-lg border border-brand-mid/30"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date().toISOString().split("T")[0])}>Today</Button>
        </div>
      </Card>

      {loading ? <LoadingState /> : !attendance ? (
        <EmptyState icon={<ClipboardCheck className="w-6 h-6 text-brand-gray" />} title="Select a class and date" description="Choose a class and date to take attendance." />
      ) : attendance.records.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="w-6 h-6 text-brand-gray" />} title="No enrolled students" description="There are no active students enrolled in this class." />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <Card className="text-center">
              <p className="text-2xl font-bold text-brand-dark">{total}</p>
              <p className="text-xs text-brand-gray">Total</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{present}</p>
              <p className="text-xs text-brand-gray">Present</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-red-600">{absent}</p>
              <p className="text-xs text-brand-gray">Absent</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-amber-600">{late}</p>
              <p className="text-xs text-brand-gray">Late</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-600">{excused}</p>
              <p className="text-xs text-brand-gray">Excused</p>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-brand-gray">Mark all:</span>
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => markAll(opt.value)} className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${opt.color}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Student list */}
          <Card padding={false}>
            <div className="divide-y divide-brand-mid/20">
              {attendance.records.map((r) => (
                <div key={r.studentId} className="flex items-center gap-4 px-4 py-3 hover:bg-brand-light/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-dark text-sm">{r.student ? `${r.student.firstName} ${r.student.lastName}` : "—"}</p>
                    {r.student.studentNumber && <p className="text-xs text-brand-gray">{r.student.studentNumber}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(r.studentId, opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          records[r.studentId]?.status === opt.value
                            ? opt.color
                            : "bg-white text-brand-gray border-brand-mid/30 hover:bg-brand-light"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Reason..."
                    value={records[r.studentId]?.reason || ""}
                    onChange={(e) => handleReasonChange(r.studentId, e.target.value)}
                    className="w-32 text-xs border border-brand-mid/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red/20"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* 30-day stats */}
          {stats && stats.totalSessions > 0 && (
            <Card className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-brand-red" />
                <h3 className="font-semibold text-brand-dark text-sm">Last 30 Days — {stats.totalSessions} sessions</h3>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.summary.present}</p>
                  <p className="text-xs text-brand-gray">Present</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{stats.summary.absent}</p>
                  <p className="text-xs text-brand-gray">Absent</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{stats.summary.late}</p>
                  <p className="text-xs text-brand-gray">Late</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-dark">{stats.summary.attendanceRate}%</p>
                  <p className="text-xs text-brand-gray">Attendance Rate</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
