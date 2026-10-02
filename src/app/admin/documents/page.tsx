"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import {
  FileText, Download, Trash2, Plus, Filter,
  AlertCircle, CheckCircle, ExternalLink, X, Layers,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Class {
  id: string;
  name: string;
  grade: { name: string };
}

interface Document {
  id: string;
  type: string;
  title: string;
  student: { id: string; firstName: string; lastName: string };
  academicYear: { id: string; name: string } | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────

const DOCUMENT_TYPES = [
  { value: "INVOICE", label: "Invoice" },
  { value: "TRANSCRIPT", label: "Transcript" },
  { value: "REPORT_CARD", label: "Report Card" },
  { value: "STATEMENT", label: "Statement" },
  { value: "RECEIPT", label: "Receipt" },
];

const TYPE_BADGE_VARIANT: Record<string, string> = {
  INVOICE: "bg-blue-50 text-blue-700",
  TRANSCRIPT: "bg-green-50 text-green-700",
  REPORT_CARD: "bg-purple-50 text-purple-700",
  STATEMENT: "bg-amber-50 text-amber-700",
  RECEIPT: "bg-teal-50 text-teal-700",
};

// ─── Helpers ────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatType(type: string) {
  return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
}

// ─── Page ───────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [docType, setDocType] = useState("INVOICE");
  const [studentId, setStudentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");

  // Bulk generate state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkType, setBulkType] = useState("REPORT_CARD");
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkYearId, setBulkYearId] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ generated: number; errors: number; total: number } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      setError("Failed to load students");
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch("/api/academic-years");
      const data = await res.json();
      const years = data.academicYears || data.years || [];
      setAcademicYears(years);
      const current = years.find((y: AcademicYear) => y.isCurrent);
      if (current) {
        setAcademicYearId(current.id);
        setBulkYearId(current.id);
      }
    } catch {
      setError("Failed to load academic years");
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch {
      // silent
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setError("Failed to load documents");
    } finally {
      setDocumentsLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchAcademicYears(), fetchClasses()]);
      setLoading(false);
    };
    init();
  }, [fetchStudents, fetchAcademicYears, fetchClasses]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError("Please select a student");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: docType, studentId, academicYearId: academicYearId || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate document");
      }
      setSuccess("Document generated successfully");
      fetchDocuments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to generate document");
      setTimeout(() => setError(""), 3000);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/documents/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      toast("Document deleted successfully");
      fetchDocuments();
    } catch {
      toast("Failed to delete document", "error");
    }
    setConfirmDelete(null);
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkGenerating(true);
    setBulkResult(null);
    setError("");

    try {
      const body: any = { type: bulkType };
      if (bulkClassId) body.classId = bulkClassId;
      if (bulkYearId) body.academicYearId = bulkYearId;

      const res = await fetch("/api/documents/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate documents");

      setBulkResult({ generated: data.generated, errors: data.errors, total: data.total });
      toast(`Generated ${data.generated} documents successfully`);
      fetchDocuments();
    } catch (e: any) {
      setError(e.message || "Failed to generate documents");
      setTimeout(() => setError(""), 4000);
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Generate and manage school documents."
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading documents..." />
      ) : (
        <>
          {/* ── Generate Document ──────────────────────────── */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-red/10">
                  <Plus className="w-5 h-5 text-brand-red" />
                </div>
                <h2 className="text-lg font-semibold text-brand-dark">
                  {bulkMode ? "Bulk Generate Documents" : "Generate Document"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => { setBulkMode(!bulkMode); setBulkResult(null); }}
                className="text-sm text-brand-red hover:underline font-medium"
              >
                {bulkMode ? "Single Generate" : "Bulk Generate"}
              </button>
            </div>

            {bulkMode ? (
              <form onSubmit={handleBulkGenerate} className="space-y-4">
                {bulkResult && (
                  <div className={`p-4 rounded-xl border ${bulkResult.errors > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                    <p className="text-sm font-medium">
                      {bulkResult.generated} of {bulkResult.total} documents generated successfully
                      {bulkResult.errors > 0 && <span className="text-amber-600"> · {bulkResult.errors} errors</span>}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="w-44">
                    <Select
                      label="Document Type"
                      value={bulkType}
                      onChange={(e) => setBulkType(e.target.value)}
                      options={DOCUMENT_TYPES.filter((t) => ["REPORT_CARD", "TRANSCRIPT", "STATEMENT", "RECEIPT"].includes(t.value))}
                      required
                    />
                  </div>
                  <div className="w-56">
                    <Select
                      label="Class (optional)"
                      value={bulkClassId}
                      onChange={(e) => setBulkClassId(e.target.value)}
                      options={[
                        { value: "", label: "All students" },
                        ...classes.map((c) => ({ value: c.id, label: `${c.grade.name} - ${c.name}` })),
                      ]}
                    />
                  </div>
                  <div className="w-44">
                    <Select
                      label="Academic Year"
                      value={bulkYearId}
                      onChange={(e) => setBulkYearId(e.target.value)}
                      options={academicYears.map((y) => ({ value: y.id, label: y.name + (y.isCurrent ? " (Current)" : "") }))}
                      placeholder="Select year"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={bulkGenerating} icon={<Layers className="w-4 h-4" />}>
                      {bulkGenerating ? "Generating..." : "Generate All"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-brand-gray">
                  Generates documents for all enrolled students matching the criteria. Maximum 200 per batch.
                </p>
              </form>
            ) : (
            <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
              <div className="w-44">
                <Select
                  label="Document Type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  options={DOCUMENT_TYPES}
                  required
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Select
                  label="Student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.firstName} ${s.lastName}${s.studentNumber ? ` (${s.studentNumber})` : ""}`,
                  }))}
                  placeholder={students.length === 0 ? "No students available" : "Select a student"}
                  required
                />
              </div>
              <div className="w-44">
                <Select
                  label="Academic Year"
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  options={academicYears.map((y) => ({
                    value: y.id,
                    label: y.name + (y.isCurrent ? " (Current)" : ""),
                  }))}
                  placeholder={academicYears.length === 0 ? "No academic years" : "Select year"}
                />
              </div>
              <Button type="submit" disabled={generating} icon={<FileText className="w-4 h-4" />}>
                {generating ? "Generating..." : "Generate"}
              </Button>
            </form>
            )}
          </Card>

          {/* ── Documents List ─────────────────────────────── */}
          <Card padding={false}>
            <div className="p-4 border-b border-brand-mid/30 flex items-center gap-4">
              <Filter className="w-4 h-4 text-brand-gray" />
              <div className="flex gap-2">
                <button
                  onClick={() => setTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === "ALL"
                      ? "bg-brand-red text-white"
                      : "bg-brand-light text-brand-gray hover:text-brand-dark"
                  }`}
                >
                  All
                </button>
                {DOCUMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTypeFilter(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === t.value
                        ? "bg-brand-red text-white"
                        : "bg-brand-light text-brand-gray hover:text-brand-dark"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {documentsLoading ? (
              <LoadingState message="Loading documents..." />
            ) : documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-6 h-6 text-brand-gray" />}
                title="No documents found"
                description="Generate your first document using the form above."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-semibold text-brand-dark">Type</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Title</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Student</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Academic Year</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Date Generated</TableCell>
                    <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_VARIANT[doc.type] || "bg-gray-50 text-gray-700"}`}>
                          {formatType(doc.type)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-brand-dark">{doc.title}</TableCell>
                      <TableCell className="text-brand-dark">
                        {doc.student ? `${doc.student.firstName} ${doc.student.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="text-brand-gray text-sm">
                        {doc.academicYear?.name || "—"}
                      </TableCell>
                      <TableCell className="text-brand-gray text-sm">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/api/documents/download/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-brand-light rounded-lg"
                            title="Download document"
                          >
                            <Download className="w-4 h-4 text-brand-gray" />
                          </a>
                          <button
                            onClick={() => setConfirmDelete(doc.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
