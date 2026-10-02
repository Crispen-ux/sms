"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, FileText, Trash2, X, AlertCircle, CheckCircle } from "lucide-react";

interface Enrolment {
  id: string;
  status: string;
  enrolledAt: string;
  withdrawnAt: string | null;
  student: { id: string; firstName: string; lastName: string; studentNumber: string | null };
  grade: { name: string };
  class: { name: string } | null;
  academicYear: { name: string; active: boolean };
}

interface Student { id: string; firstName: string; lastName: string; studentNumber: string | null; }
interface AcademicYear { id: string; name: string; active: boolean; }
interface Grade { id: string; name: string; }
interface GradeClass { id: string; name: string; }

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "success",
  TRANSFERRED: "info",
  WITHDRAWN: "danger",
  GRADUATED: "success",
};

export default function EnrolmentsPage() {
  const { toast } = useToast();
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<GradeClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }) });
      const [eRes, sRes, yRes, gRes] = await Promise.all([
        fetch(`/api/enrolments?${params}`),
        fetch("/api/students?limit=500"),
        fetch("/api/academic-years?limit=100"),
        fetch("/api/grades?limit=100"),
      ]);
      const eData = await eRes.json();
      const sData = await sRes.json();
      const yData = await yRes.json();
      const gData = await gRes.json();
      setEnrolments(eData.enrolments);
      setTotalPages(eData.totalPages);
      setStudents(sData.students);
      setYears(yData.years);
      setGrades(gData.grades);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleGradeChange = async (gradeId: string) => {
    try {
      const res = await fetch(`/api/classes?limit=100&search=${gradeId}`);
      const data = await res.json();
      setClasses(data.classes);
    } catch { setClasses([]); }
  };

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/enrolments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Student enrolled");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/enrolments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error("Failed to update");
      setSuccess(`Enrolment marked as ${status.toLowerCase()}`);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to update"); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    try {
      await fetch(`/api/enrolments/${id}`, { method: "DELETE" });
      toast("Enrolment deleted");
      fetchData();
    } catch { toast("Failed to delete", "error"); }
  };

  return (
    <div>
      <PageHeader
        title="Enrolments"
        description="Manage student enrolments per academic year."
        action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>New Enrolment</Button>}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input type="text" placeholder="Search by student name or number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full" />
          </div>
        </div>

        {loading ? <LoadingState /> : enrolments.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6 text-brand-gray" />} title="No enrolments found" description="Enrol your first student to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Student</TableCell>
                <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                <TableCell className="font-semibold text-brand-dark">Class</TableCell>
                <TableCell className="font-semibold text-brand-dark">Year</TableCell>
                <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                <TableCell className="font-semibold text-brand-dark">Enrolled</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium text-brand-dark">{e.student ? `${e.student.firstName} ${e.student.lastName}` : "—"}</p>
                    {e.student.studentNumber && <p className="text-xs text-brand-gray">{e.student.studentNumber}</p>}
                  </TableCell>
                  <TableCell><Badge variant="info">{e.grade.name}</Badge></TableCell>
                  <TableCell className="text-brand-gray">{e.class?.name || "—"}</TableCell>
                  <TableCell>{e.academicYear.name}{e.academicYear.active && <Badge variant="success" className="ml-1">Active</Badge>}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[e.status] as any || "default"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-brand-gray text-sm">{new Date(e.enrolledAt).toLocaleDateString("en-ZA")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {e.status === "ACTIVE" && (
                        <>
                          <button onClick={() => handleUpdateStatus(e.id, "TRANSFERRED")} className="p-2 hover:bg-blue-50 rounded-lg" title="Transfer"><span className="text-xs text-blue-600">T</span></button>
                          <button onClick={() => handleUpdateStatus(e.id, "WITHDRAWN")} className="p-2 hover:bg-red-50 rounded-lg" title="Withdraw"><span className="text-xs text-red-600">W</span></button>
                          <button onClick={() => handleUpdateStatus(e.id, "GRADUATED")} className="p-2 hover:bg-green-50 rounded-lg" title="Graduate"><span className="text-xs text-green-600">G</span></button>
                        </>
                      )}
                      <button onClick={() => setConfirmDelete(e.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-mid/30">
            <span className="text-sm text-brand-gray">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <EnrolmentModal
          students={students}
          years={years}
          grades={grades}
          classes={classes}
          onGradeChange={handleGradeChange}
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setError(""); }}
        />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Enrolment"
        message="Delete this enrolment?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function EnrolmentModal({ students, years, grades, classes, onGradeChange, onSubmit, onClose }: {
  students: Student[]; years: AcademicYear[]; grades: Grade[]; classes: GradeClass[];
  onGradeChange: (id: string) => void; onSubmit: (d: any) => void; onClose: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");

  const activeYear = years.find((y) => y.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Enrolment</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ studentId, academicYearId, gradeId, classId: classId || undefined }); }} className="space-y-4">
          <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)} options={students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}${s.studentNumber ? ` (${s.studentNumber})` : ""}` }))} placeholder="Select student" required />
          <Select label="Academic Year" value={academicYearId || (activeYear?.id ?? "")} onChange={(e) => setAcademicYearId(e.target.value)} options={years.map((y) => ({ value: y.id, label: `${y.name}${y.active ? " (Active)" : ""}` }))} placeholder="Select year" required />
          <Select label="Grade" value={gradeId} onChange={(e) => { setGradeId(e.target.value); setClassId(""); onGradeChange(e.target.value); }} options={grades.map((g) => ({ value: g.id, label: g.name }))} placeholder="Select grade" required />
          <Select label="Class (optional)" value={classId} onChange={(e) => setClassId(e.target.value)} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="No class assigned" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Enrol</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
