"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, GraduationCap, Edit, Trash2, X, AlertCircle, CheckCircle, Link2, Unlink, Eye, Download } from "lucide-react";
import Link from "next/link";
import { downloadCSV } from "@/lib/export-csv";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  idNumber: string | null;
  guardianLinks: { id: string; guardian: { id: string; firstName: string; lastName: string; phone: string; relationship: string | null }; isPrimary: boolean }[];
  enrolments: { grade: { name: string }; class: { name: string } | null; academicYear: { name: string; active: boolean }; status: string }[];
}

interface Parent { id: string; firstName: string; lastName: string; phone: string; relationship: string | null; }

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [linkingStudent, setLinkingStudent] = useState<Student | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<{ studentId: string; guardianId: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }) });
      const [sRes, pRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch("/api/parents?limit=200"),
      ]);
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
        setTotalPages(sData.totalPages || 1);
      } else {
        setError("Failed to load students");
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setParents(pData.parents || []);
      }
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create student" }));
      throw new Error(err.error || "Failed to create student");
    }
    toast("Student added successfully");
    setShowCreate(false);
    fetchData();
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    const res = await fetch(`/api/students/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to update student" }));
      throw new Error(err.error || "Failed to update student");
    }
    toast("Student updated successfully");
    setEditing(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/students/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Student deleted successfully");
      fetchData();
    } catch { toast("Failed to delete student", "error"); }
    setConfirmDelete(null);
  };

  const handleLinkGuardian = async (guardianId: string, isPrimary: boolean) => {
    if (!linkingStudent) return;
    try {
      const res = await fetch(`/api/students/${linkingStudent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId, isPrimary }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast("Guardian linked successfully");
      setLinkingStudent(null);
      fetchData();
    } catch (e: any) { toast(e.message || "Failed to link guardian", "error"); }
  };

  const handleUnlinkGuardian = async () => {
    if (!confirmUnlink) return;
    try {
      await fetch(`/api/students/${confirmUnlink.studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId: confirmUnlink.guardianId }),
      });
      toast("Guardian unlinked");
      fetchData();
    } catch { toast("Failed to unlink guardian", "error"); }
    setConfirmUnlink(null);
  };

  const activeEnrolment = (s: Student) => s.enrolments.find((e) => e.academicYear.active && e.status === "ACTIVE");

  const handleExport = () => {
    const rows = students.map((s) => {
      const enrolment = activeEnrolment(s);
      return {
        "Student Number": s.studentNumber || "",
        "First Name": s.firstName,
        "Last Name": s.lastName,
        "Gender": s.gender || "",
        "Date of Birth": s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("en-ZA") : "",
        "ID Number": s.idNumber || "",
        "Grade": enrolment?.grade?.name || "",
        "Class": enrolment?.class?.name || "",
        "Status": enrolment?.status || "Not Enrolled",
        "Guardian": s.guardianLinks?.[0] ? `${s.guardianLinks[0].guardian.firstName} ${s.guardianLinks[0].guardian.lastName}` : "",
        "Guardian Phone": s.guardianLinks?.[0]?.guardian?.phone || "",
      };
    });
    downloadCSV(rows, "students");
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student records, enrolments, and guardian links."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} icon={<Download className="w-4 h-4" />}>Export CSV</Button>
            <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Student</Button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input type="text" placeholder="Search by name or number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full" />
          </div>
        </div>

        {loading ? <LoadingState /> : students.length === 0 ? (
          <EmptyState icon={<GraduationCap className="w-6 h-6 text-brand-gray" />} title="No students found" description="Add your first student to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Student</TableCell>
                <TableCell className="font-semibold text-brand-dark">Number</TableCell>
                <TableCell className="font-semibold text-brand-dark">Current Grade</TableCell>
                <TableCell className="font-semibold text-brand-dark">Guardians</TableCell>
                <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const ae = activeEnrolment(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <Link href={`/admin/students/${s.id}`} className="font-medium text-brand-dark hover:text-brand-red transition-colors">
                          {s.firstName} {s.lastName}
                        </Link>
                        {s.gender && <p className="text-xs text-brand-gray">{s.gender}{s.dateOfBirth ? ` · ${new Date(s.dateOfBirth).toLocaleDateString("en-ZA")}` : ""}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-brand-gray font-mono text-sm">{s.studentNumber || "—"}</TableCell>
                    <TableCell>{ae ? <Badge variant="info">{ae.grade.name}{ae.class ? ` ${ae.class.name}` : ""}</Badge> : <Badge>No Active Enrolment</Badge>}</TableCell>
                    <TableCell>
                      {s.guardianLinks.length === 0 ? (
                        <button onClick={() => setLinkingStudent(s)} className="text-xs text-brand-red hover:underline flex items-center gap-1"><Link2 className="w-3 h-3" />Link Parent</button>
                      ) : (
                        <div className="space-y-0.5">
                          {s.guardianLinks.map((gl) => (
                            <div key={gl.id} className="flex items-center gap-1 text-xs">
                              <span className="text-brand-dark">{gl.guardian.firstName} {gl.guardian.lastName}</span>
                              {gl.isPrimary && <Badge variant="success">Primary</Badge>}
                              <button onClick={() => setConfirmUnlink({ studentId: s.id, guardianId: gl.guardian.id })} className="text-red-400 hover:text-red-600"><Unlink className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{ae ? <Badge variant="success">Enrolled</Badge> : <Badge>Inactive</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/students/${s.id}`} className="p-2 hover:bg-brand-light rounded-lg"><Eye className="w-4 h-4 text-brand-gray" /></Link>
                        <button onClick={() => setEditing(s)} className="p-2 hover:bg-brand-light rounded-lg"><Edit className="w-4 h-4 text-brand-gray" /></button>
                        <button onClick={() => setConfirmDelete(s.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {(showCreate || editing) && (
        <StudentModal student={editing} onSubmit={editing ? handleUpdate : handleCreate} onClose={() => { setShowCreate(false); setEditing(null); }} />
      )}

      {linkingStudent && (
        <LinkGuardianModal student={linkingStudent} parents={parents} onLink={handleLinkGuardian} onClose={() => setLinkingStudent(null)} />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={!!confirmUnlink}
        title="Unlink Guardian"
        message="Are you sure you want to unlink this guardian from the student?"
        confirmLabel="Unlink"
        onConfirm={handleUnlinkGuardian}
        onCancel={() => setConfirmUnlink(null)}
      />
    </div>
  );
}

function StudentModal({ student, onSubmit, onClose }: { student: any; onSubmit: (d: any) => void; onClose: () => void }) {
  const [firstName, setFirstName] = useState(student?.firstName || "");
  const [lastName, setLastName] = useState(student?.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "");
  const [gender, setGender] = useState(student?.gender || "");
  const [nationality, setNationality] = useState(student?.nationality || "");
  const [idNumber, setIdNumber] = useState(student?.idNumber || "");
  const [studentNumber, setStudentNumber] = useState(student?.studentNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ firstName, lastName, dateOfBirth: dateOfBirth || undefined, gender: gender || undefined, nationality: nationality || undefined, idNumber: idNumber || undefined, studentNumber: studentNumber || undefined });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">{student ? "Edit Student" : "Add Student"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} placeholder="Select gender" />
          </div>
          <Input label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. South African" />
          <Input label="ID Number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="SA ID number" />
          <Input label="Student Number" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="Auto-generated if blank" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Saving..." : student ? "Save" : "Add Student"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LinkGuardianModal({ student, parents, onLink, onClose }: { student: Student; parents: Parent[]; onLink: (id: string, primary: boolean) => void; onClose: () => void }) {
  const [selectedGuardian, setSelectedGuardian] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const linkedIds = student.guardianLinks.map((gl) => gl.guardian.id);
  const available = parents.filter((p) => !linkedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Link Guardian to {student.firstName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-brand-gray mb-4">All existing parents are already linked to this student. Create a new parent first.</p>
        ) : (
          <div className="space-y-4">
            <Select label="Parent/Guardian" value={selectedGuardian} onChange={(e) => setSelectedGuardian(e.target.value)} options={available.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} — ${p.phone}` }))} placeholder="Select parent" />
            <label className="flex items-center gap-2 text-sm text-brand-dark">
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded border-brand-mid" />
              Mark as primary contact
            </label>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => { if (selectedGuardian) onLink(selectedGuardian, isPrimary); }} disabled={!selectedGuardian} className="flex-1">Link</Button>
        </div>
      </div>
    </div>
  );
}
