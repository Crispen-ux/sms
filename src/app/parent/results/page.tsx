"use client";

import { useState, useEffect } from "react";
import { Card, Select, Badge, LoadingState, Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui";
import { AlertCircle } from "lucide-react";

interface Result {
  assessmentTitle: string;
  subject: string;
  subjectCode: string | null;
  type: string;
  totalMarks: number;
  marks: number;
  percentage: number | null;
  grade: string | null;
  comment: string | null;
  status: string;
  year: string;
  date: string | null;
}

interface StudentResults {
  student: { id: string; firstName: string; lastName: string };
  totalResults: number;
  publishedCount: number;
  results: Result[];
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-amber-600",
  D: "text-orange-600",
  F: "text-red-600",
};

export default function ParentResultsPage() {
  const [data, setData] = useState<StudentResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    fetch("/api/parent/results")
      .then((r) => r.json())
      .then((d) => {
        setData(d.students || []);
        if (d.students?.length > 0) setSelectedStudent(d.students[0].student.id);
      })
      .catch(() => setError("Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;

  const current = data.find((d) => d.student.id === selectedStudent);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Results</h1>

      {data.length === 0 ? (
        <Card><p className="text-brand-gray text-center py-8">No results available yet.</p></Card>
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
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="text-center">
                  <p className="text-2xl font-bold text-brand-dark">{current.totalResults}</p>
                  <p className="text-xs text-brand-gray">Total Results</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-green-600">{current.publishedCount}</p>
                  <p className="text-xs text-brand-gray">Published</p>
                </Card>
              </div>

              <Card padding={false}>
                {current.results.length === 0 ? (
                  <p className="text-brand-gray text-center py-8">No results yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell className="font-semibold text-brand-dark">Assessment</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Subject</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Marks</TableCell>
                        <TableCell className="font-semibold text-brand-dark">%</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Comment</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {current.results.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <p className="font-medium text-brand-dark">{r.assessmentTitle}</p>
                            <p className="text-xs text-brand-gray">{r.type} · {r.year}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-brand-dark">{r.subject}</p>
                            {r.subjectCode && <p className="text-xs text-brand-gray">{r.subjectCode}</p>}
                          </TableCell>
                          <TableCell className="text-brand-dark">{r.marks}/{r.totalMarks}</TableCell>
                          <TableCell className="text-brand-gray">{r.percentage ? `${r.percentage}%` : "—"}</TableCell>
                          <TableCell>
                            {r.grade ? <span className={`font-bold text-lg ${GRADE_COLORS[r.grade] || ""}`}>{r.grade}</span> : "—"}
                          </TableCell>
                          <TableCell className="text-brand-gray text-sm max-w-[200px] truncate">{r.comment || "—"}</TableCell>
                          <TableCell><Badge variant={r.status === "PUBLISHED" ? "success" : r.status === "APPROVED" ? "info" : "default"}>{r.status}</Badge></TableCell>
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
