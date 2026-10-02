"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState,
} from "@/components/ui";
import { AlertCircle, CheckCircle, Save, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

interface Assessment {
  id: string;
  title: string;
  type: string;
  totalMarks: number;
  subject: { name: string; code: string | null };
  academicYear: { name: string };
  results: {
    id: string;
    studentId: string;
    student: { id: string; firstName: string; lastName: string; studentNumber: string | null };
    marks: number;
    percentage: number | null;
    grade: string | null;
    comment: string | null;
    status: string;
  }[];
}

interface AssessmentOption { id: string; title: string; subject: { name: string }; totalMarks: number; _count: { results: number }; }

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-amber-600",
  D: "text-orange-600",
  F: "text-red-600",
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const assessmentIdParam = searchParams.get("assessmentId");

  const [assessments, setAssessments] = useState<AssessmentOption[]>([]);
  const [selectedId, setSelectedId] = useState(assessmentIdParam || "");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [marks, setMarks] = useState<Record<string, { marks: number; comment: string }>>({});
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await fetch("/api/assessments?limit=200");
        const data = await res.json();
        setAssessments(data.assessments);
      } catch { setError("Failed to load assessments"); }
      finally { setListLoading(false); }
    };
    fetchAssessments();
  }, []);

  const fetchAssessment = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${selectedId}`);
      const data = await res.json();
      setAssessment(data);
      const marksMap: Record<string, { marks: number; comment: string }> = {};
      for (const r of data.results) {
        marksMap[r.studentId] = { marks: r.marks, comment: r.comment || "" };
      }
      setMarks(marksMap);
    } catch { setError("Failed to load assessment"); }
    finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  const handleMarksChange = (studentId: string, value: string) => {
    const num = parseInt(value) || 0;
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: num },
    }));
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment },
    }));
  };

  const handleSave = async () => {
    if (!assessment) return;
    setSaving(true);
    setError("");
    try {
      const resultsList = Object.entries(marks).map(([studentId, r]) => ({
        studentId,
        marks: r.marks,
        comment: r.comment || undefined,
      }));

      const res = await fetch(`/api/assessments/${assessment.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: resultsList }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Results saved successfully");
      fetchAssessment();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to save results"); setTimeout(() => setError(""), 3000); }
    finally { setSaving(false); }
  };

  const filteredResults = assessment?.results.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.student?.firstName?.toLowerCase().includes(q) || r.student?.lastName?.toLowerCase().includes(q) || (r.student?.studentNumber || "").toLowerCase().includes(q);
  }) || [];

  const enteredCount = Object.keys(marks).filter((k) => marks[k].marks > 0).length;

  return (
    <div>
      <PageHeader
        title="Results Entry"
        description="Enter marks and comments for assessments."
        action={
          assessment ? (
            <Button onClick={handleSave} disabled={saving} icon={<Save className="w-4 h-4" />}>
              {saving ? "Saving..." : `Save (${enteredCount} entered)`}
            </Button>
          ) : undefined
        }
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Assessment selector */}
      <Card className="mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Select
              label="Select Assessment"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              options={assessments.map((a) => ({
                value: a.id,
                label: `${a.title} — ${a.subject.name} (${a.totalMarks} marks, ${a._count.results} results)`,
              }))}
              placeholder={listLoading ? "Loading assessments..." : "Select an assessment"}
            />
          </div>
          <Link href="/admin/assessments" className="flex items-center gap-1 text-sm text-brand-red hover:underline mb-1"><ArrowLeft className="w-4 h-4" />Back to Assessments</Link>
        </div>
      </Card>

      {loading ? <LoadingState /> : !assessment ? (
        <EmptyState icon={<Search className="w-6 h-6 text-brand-gray" />} title="Select an assessment" description="Choose an assessment above to enter results." />
      ) : assessment.results.length === 0 ? (
        <EmptyState icon={<Search className="w-6 h-6 text-brand-gray" />} title="No enrolled students" description="There are no active students enrolled for this assessment's academic year." />
      ) : (
        <>
          {/* Assessment info */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <Card className="text-center">
              <p className="text-xs text-brand-gray">Subject</p>
              <p className="text-sm font-medium text-brand-dark">{assessment.subject.name}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-brand-gray">Type</p>
              <Badge variant="info">{assessment.type}</Badge>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-brand-gray">Total Marks</p>
              <p className="text-lg font-bold text-brand-dark">{assessment.totalMarks}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-brand-gray">Students</p>
              <p className="text-lg font-bold text-brand-dark">{assessment.results.length}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-brand-gray">Entered</p>
              <p className="text-lg font-bold text-green-600">{enteredCount}</p>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
              <Search className="w-4 h-4 text-brand-gray" />
              <input type="text" placeholder="Filter students..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full" />
            </div>
          </div>

          {/* Results table */}
          <Card padding={false}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="font-semibold text-brand-dark">Student</TableCell>
                  <TableCell className="font-semibold text-brand-dark">Number</TableCell>
                  <TableCell className="font-semibold text-brand-dark">Marks (/{assessment.totalMarks})</TableCell>
                  <TableCell className="font-semibold text-brand-dark">%</TableCell>
                  <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                  <TableCell className="font-semibold text-brand-dark">Comment</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((r) => {
                  const m = marks[r.studentId];
                  const pct = m && assessment.totalMarks > 0 ? Math.round((m.marks / assessment.totalMarks) * 100) : 0;
                  let grade = "F";
                  if (pct >= 80) grade = "A";
                  else if (pct >= 70) grade = "B";
                  else if (pct >= 60) grade = "C";
                  else if (pct >= 50) grade = "D";
                  else if (pct >= 40) grade = "E";

                  return (
                    <TableRow key={r.studentId}>
                      <TableCell className="font-medium text-brand-dark">
                        {r.student ? `${r.student.firstName} ${r.student.lastName}` : "—"}
                        {r.status !== "DRAFT" && <Badge variant="success" className="ml-2">{r.status}</Badge>}
                      </TableCell>
                      <TableCell className="text-brand-gray text-sm font-mono">{r.student.studentNumber || "—"}</TableCell>
                      <TableCell>
                        <input
                          type="number"
                          value={m?.marks ?? ""}
                          onChange={(e) => handleMarksChange(r.studentId, e.target.value)}
                          min={0}
                          max={assessment.totalMarks}
                          className="w-20 border border-brand-mid/30 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/20"
                        />
                      </TableCell>
                      <TableCell className="text-brand-gray text-sm">{m?.marks ? `${pct}%` : "—"}</TableCell>
                      <TableCell>
                        {m?.marks ? <span className={`font-bold ${GRADE_COLORS[grade] || ""}`}>{grade}</span> : "—"}
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          value={m?.comment ?? ""}
                          onChange={(e) => handleCommentChange(r.studentId, e.target.value)}
                          placeholder="Optional..."
                          className="w-40 text-xs border border-brand-mid/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red/20"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResultsContent />
    </Suspense>
  );
}
