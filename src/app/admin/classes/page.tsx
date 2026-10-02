"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, BookOpen, Edit, Trash2, X, AlertCircle, CheckCircle } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  capacity: number;
  grade: { name: string };
  academicYear: { name: string };
  _count: { enrolments: number; teacherClasses: number };
}

interface Grade { id: string; name: string; }
interface AcademicYear { id: string; name: string; }

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }) });
      const [classRes, gradeRes, yearRes] = await Promise.all([
        fetch(`/api/classes?${params}`),
        fetch("/api/grades?limit=100"),
        fetch("/api/academic-years?limit=100"),
      ]);
      const classData = await classRes.json();
      const gradeData = await gradeRes.json();
      const yearData = await yearRes.json();
      setClasses(classData.classes);
      setTotalPages(classData.totalPages);
      setGrades(gradeData.grades);
      setYears(yearData.years);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Class created");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/classes/${confirmDelete}`, { method: "DELETE" });
      toast("Class deleted successfully");
      fetchData();
    } catch {
      toast("Failed to delete class", "error");
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage classes for each grade and academic year."
        action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Class</Button>}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input type="text" placeholder="Search classes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full" />
          </div>
        </div>

        {loading ? <LoadingState /> : classes.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-6 h-6 text-brand-gray" />} title="No classes found" description="Create your first class to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Class Name</TableCell>
                <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                <TableCell className="font-semibold text-brand-dark">Year</TableCell>
                <TableCell className="font-semibold text-brand-dark">Enrolled</TableCell>
                <TableCell className="font-semibold text-brand-dark">Capacity</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-brand-dark">{c.name}</TableCell>
                  <TableCell><Badge>{c.grade.name}</Badge></TableCell>
                  <TableCell className="text-brand-gray">{c.academicYear.name}</TableCell>
                  <TableCell>{c._count.enrolments}</TableCell>
                  <TableCell>{c.capacity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(c)} className="p-2 hover:bg-brand-light rounded-lg"><Edit className="w-4 h-4 text-brand-gray" /></button>
                      <button onClick={() => setConfirmDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
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

      {(showCreate || editing) && (
        <ClassModal
          cls={editing}
          grades={grades}
          years={years}
          onSubmit={editing ? async (d) => { await fetch(`/api/classes/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); setEditing(null); fetchData(); } : handleCreate}
          onClose={() => { setShowCreate(false); setEditing(null); setError(""); }}
        />
      )}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function ClassModal({ cls, grades, years, onSubmit, onClose }: { cls: any; grades: Grade[]; years: AcademicYear[]; onSubmit: (d: any) => void; onClose: () => void }) {
  const [name, setName] = useState(cls?.name || "");
  const [gradeId, setGradeId] = useState(cls?.gradeId || "");
  const [academicYearId, setAcademicYearId] = useState(cls?.academicYearId || "");
  const [capacity, setCapacity] = useState(cls?.capacity || 40);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">{cls ? "Edit Class" : "Add Class"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, gradeId, academicYearId, capacity }); }} className="space-y-4">
          <Input label="Class Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 5A" required />
          <Select label="Grade" value={gradeId} onChange={(e) => setGradeId(e.target.value)} options={grades.map((g) => ({ value: g.id, label: g.name }))} placeholder="Select grade" required />
          <Select label="Academic Year" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} options={years.map((y) => ({ value: y.id, label: y.name }))} placeholder="Select year" required />
          <Input label="Capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} min={1} max={100} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{cls ? "Save" : "Create"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
