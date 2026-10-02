"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Select, Badge,
  EmptyState, LoadingState,
} from "@/components/ui";
import { AlertCircle, CheckCircle, Save, ChevronLeft, ChevronRight } from "lucide-react";

interface ClassOption { id: string; name: string; grade: string; studentCount: number; }
interface Student { id: string; firstName: string; lastName: string; studentNumber: string | null; }
interface AttendanceData { id: string | null; classId: string; date: string; className: string; gradeName: string; records: { id: string | null; studentId: string; student: Student; status: string; reason: string | null; }[]; taken: boolean; }

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
  { value: "LATE", label: "Late", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
];

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.color || STATUS_OPTIONS[0].color;
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [records, setRecords] = useState<Record<string, { status: string; reason: string }>>({});
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/teacher")
      .then((r) => r.json())
      .then((data) => {
        setClasses(data.classes || []);
        if (data.classes?.length > 0) setSelectedClass(data.classes[0].id);
      })
      .catch(() => setError("Failed to load classes"))
      .finally(() => setClassesLoading(false));
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !date) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/teacher/attendance?classId=${selectedClass}&date=${date}`);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setAttendance(data);
      const recordsMap: Record<string, { status: string; reason: string }> = {};
      for (const r of data.records) {
        recordsMap[r.studentId] = { status: r.status, reason: r.reason || "" };
      }
      setRecords(recordsMap);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [selectedClass, date]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status, reason: prev[studentId]?.reason || "" } }));
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
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, date, records: recordList }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Attendance saved");
      fetchAttendance();
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
  const total = Object.keys(records).length;

  return (
    <div>
      <PageHeader title="Attendance" description="Take attendance for your classes." action={<Button onClick={handleSave} disabled={saving || !attendance} icon={<Save className="w-4 h-4" />}>{saving ? "Saving..." : "Save"}</Button>} />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select label="Class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} options={classes.map((c) => ({ value: c.id, label: `${c.grade} — ${c.name} (${c.studentCount} students)` }))} placeholder={classesLoading ? "Loading..." : "Select class"} />
          </div>
          <div className="flex items-end gap-1">
            <button onClick={() => shiftDate(-1)} className="p-2.5 hover:bg-brand-light rounded-lg border border-brand-mid/30"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-brand-mid/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20" />
            <button onClick={() => shiftDate(1)} className="p-2.5 hover:bg-brand-light rounded-lg border border-brand-mid/30"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date().toISOString().split("T")[0])}>Today</Button>
        </div>
      </Card>

      {loading ? <LoadingState /> : !attendance ? (
        <EmptyState title="Select a class and date" description="Choose a class and date to take attendance." />
      ) : attendance.records.length === 0 ? (
        <EmptyState title="No enrolled students" description="No active students in this class." />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="text-center"><p className="text-2xl font-bold text-brand-dark">{total}</p><p className="text-xs text-brand-gray">Total</p></Card>
            <Card className="text-center"><p className="text-2xl font-bold text-green-600">{present}</p><p className="text-xs text-brand-gray">Present</p></Card>
            <Card className="text-center"><p className="text-2xl font-bold text-red-600">{absent}</p><p className="text-xs text-brand-gray">Absent</p></Card>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-brand-gray">Mark all:</span>
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => markAll(opt.value)} className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${opt.color}`}>{opt.label}</button>
            ))}
          </div>

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
                      <button key={opt.value} onClick={() => handleStatusChange(r.studentId, opt.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${records[r.studentId]?.status === opt.value ? opt.color : "bg-white text-brand-gray border-brand-mid/30 hover:bg-brand-light"}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
