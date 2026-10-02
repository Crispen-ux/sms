"use client";

import { useState, useEffect } from "react";
import { Card, Badge, LoadingState, Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui";
import { AlertCircle } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
}

interface ClassData {
  id: string;
  name: string;
  role: string;
  grade: string;
  academicYear: string;
  isActive: boolean;
  studentCount: number;
  students: Student[];
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    fetch("/api/teacher")
      .then((r) => r.json())
      .then((data) => {
        setClasses(data.classes || []);
        if (data.classes?.length > 0) setSelectedClass(data.classes[0].id);
      })
      .catch(() => setError("Failed to load classes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;

  const current = classes.find((c) => c.id === selectedClass);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">My Classes</h1>

      {classes.length === 0 ? (
        <Card><p className="text-brand-gray text-center py-8">No classes assigned yet.</p></Card>
      ) : (
        <>
          {/* Class tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedClass === cls.id ? "bg-brand-red text-white" : "bg-brand-light text-brand-gray hover:text-brand-dark"}`}
              >
                {cls.grade} — {cls.name}
                {cls.isActive && <Badge variant="success" className="ml-2">Active</Badge>}
              </button>
            ))}
          </div>

          {current && (
            <Card padding={false}>
              <div className="p-4 border-b border-brand-mid/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-brand-dark">{current.grade} — {current.name}</h2>
                    <p className="text-sm text-brand-gray">{current.academicYear} · {current.studentCount} students · {current.role === "class_teacher" ? "Class Teacher" : "Subject Teacher"}</p>
                  </div>
                </div>
              </div>

              {current.students.length === 0 ? (
                <p className="text-brand-gray text-center py-8">No students enrolled.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold text-brand-dark">#</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Name</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Student Number</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {current.students.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-brand-gray">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-brand-dark">{s.firstName} {s.lastName}</TableCell>
                        <TableCell className="text-brand-gray font-mono text-sm">{s.studentNumber || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
