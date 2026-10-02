"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, FileText, Edit, Trash2, X, AlertCircle, CheckCircle, ClipboardList } from "lucide-react";
import Link from "next/link";

interface Assessment {
  id: string;
  title: string;
  type: string;
  totalMarks: number;
  date: string | null;
  subject: { name: string; code: string | null };
  academicYear: { name: string; active: boolean };
  _count: { results: number };
}

interface Subject { id: string; name: string; }
interface AcademicYear { id: string; name: string; active: boolean; }

const TYPE_LABELS: Record<string, string> = {
  TEST: "Test",
  EXAM: "Exam",
  ASSIGNMENT: "Assignment",
  PROJECT: "Project",
  QUIZ: "Quiz",
};

const TYPE_COLORS: Record<string, string> = {
  TEST: "info",
  EXAM: "danger",
  ASSIGNMENT: "default",
  PROJECT: "success",
  QUIZ: "warning",
};

export default function AssessmentsPage() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search && { search }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
      });
      const [aRes, sRes, yRes] = await Promise.all([
        fetch(`/api/assessments?${params}`),
        fetch("/api/subjects?limit=200"),
        fetch("/api/academic-years?limit=100"),
      ]);
      const aData = await aRes.json();
      const sData = await sRes.json();
      const yData = await yRes.json();
      setAssessments(aData.assessments);
      setTotalPages(aData.totalPages);
      setSubjects(sData.subjects);
      setYears(yData.years);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, [page, search, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Assessment created");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    try {
      await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      toast("Assessment deleted");
      fetchData();
    } catch { toast("Failed to delete", "error"); }
  };

  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Create and manage assessments for subjects."
        action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>New Assessment</Button>}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Assessment title or subject..." />
          </div>
          <div className="w-40">
            <Select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={[
                { value: "ALL", label: "All Types" },
                ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? <LoadingState /> : assessments.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6 text-brand-gray" />} title="No assessments found" description="Create your first assessment to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Title</TableCell>
                <TableCell className="font-semibold text-brand-dark">Subject</TableCell>
                <TableCell className="font-semibold text-brand-dark">Type</TableCell>
                <TableCell className="font-semibold text-brand-dark">Total Marks</TableCell>
                <TableCell className="font-semibold text-brand-dark">Results</TableCell>
                <TableCell className="font-semibold text-brand-dark">Year</TableCell>
                <TableCell className="font-semibold text-brand-dark">Date</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-brand-dark">{a.title}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-brand-dark">{a.subject.name}</p>
                      {a.subject.code && <p className="text-xs text-brand-gray">{a.subject.code}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={TYPE_COLORS[a.type] as any || "default"}>{TYPE_LABELS[a.type] || a.type}</Badge></TableCell>
                  <TableCell className="text-brand-dark">{a.totalMarks}</TableCell>
                  <TableCell>{a._count.results > 0 ? <Badge variant="success">{a._count.results} entered</Badge> : <Badge>No results</Badge>}</TableCell>
                  <TableCell>{a.academicYear.name}{a.academicYear.active && <Badge variant="success" className="ml-1">Active</Badge>}</TableCell>
                  <TableCell className="text-brand-gray text-sm">{a.date ? new Date(a.date).toLocaleDateString("en-ZA") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/results?assessmentId=${a.id}`} className="p-2 hover:bg-brand-light rounded-lg" title="Enter results"><ClipboardList className="w-4 h-4 text-brand-red" /></Link>
                      <button onClick={() => setConfirmDelete(a.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
        <CreateAssessmentModal subjects={subjects} years={years} onSubmit={handleCreate} onClose={() => { setShowCreate(false); setError(""); }} />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Assessment"
        message="Delete this assessment and all its results?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CreateAssessmentModal({ subjects, years, onSubmit, onClose }: {
  subjects: Subject[]; years: AcademicYear[];
  onSubmit: (d: any) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [type, setType] = useState("TEST");
  const [totalMarks, setTotalMarks] = useState(100);
  const [date, setDate] = useState("");

  const activeYear = years.find((y) => y.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Assessment</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, subjectId, academicYearId: academicYearId || activeYear?.id, type, totalMarks, date: date || undefined }); }} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Term 1 Mathematics Test" required />
          <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} options={subjects.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" required />
          <Select label="Academic Year" value={academicYearId || (activeYear?.id ?? "")} onChange={(e) => setAcademicYearId(e.target.value)} options={years.map((y) => ({ value: y.id, label: `${y.name}${y.active ? " (Active)" : ""}` }))} placeholder="Select year" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Input label="Total Marks" type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} min={1} />
          </div>
          <Input label="Date (optional)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
