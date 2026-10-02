"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Search, Plus, X, AlertCircle, BookOpen, Users, Award, Trash2 } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  staffNumber: string | null;
  position: string | null;
  user: { email: string; role: string; status: string } | null;
  teacherClasses: { id: string; classId: string; role: string; class: { name: string; grade: { name: string }; academicYear: { name: string; active: boolean } } }[];
  teacherSubjects: { id: string; subjectId: string; subject: { name: string; code: string | null } }[];
}

interface ClassOption {
  id: string;
  name: string;
  grade: { name: string };
  academicYear: { name: string; active: boolean };
}

interface SubjectOption {
  id: string;
  name: string;
  code: string | null;
}

export default function TeacherAssignmentsPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAssignClass, setShowAssignClass] = useState<string | null>(null);
  const [showAssignSubject, setShowAssignSubject] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ type: string; assignmentId: string; teacherName: string; label: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        fetch("/api/staff?limit=200"),
        fetch("/api/classes?limit=200"),
        fetch("/api/academics?limit=200"),
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        // Filter to teacher-role staff
        const allStaff = tData.staff || [];
        setTeachers(allStaff.filter((s: Teacher) =>
          s.position?.toLowerCase().includes("teacher") || s.user?.role === "TEACHER"
        ));
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setClasses(cData.classes || []);
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        // Deduplicate subjects
        const unique = new Map<string, SubjectOption>();
        (sData.subjects || []).forEach((s: any) => {
          if (s.subject && !unique.has(s.subjectId)) {
            unique.set(s.subjectId, { id: s.subjectId, name: s.subject.name, code: s.subject.code });
          }
        });
        setSubjects(Array.from(unique.values()));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssignClass = async (staffId: string, classId: string, role: string) => {
    try {
      const res = await fetch(`/api/teachers/${staffId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "class", classId, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      toast("Class assigned successfully");
      setShowAssignClass(null);
      fetchData();
    } catch (e: any) {
      toast(e.message || "Failed to assign class", "error");
    }
  };

  const handleAssignSubject = async (staffId: string, subjectId: string) => {
    try {
      const res = await fetch(`/api/teachers/${staffId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subject", subjectId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      toast("Subject assigned successfully");
      setShowAssignSubject(null);
      fetchData();
    } catch (e: any) {
      toast(e.message || "Failed to assign subject", "error");
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    try {
      const teacher = teachers.find((t) => t.teacherClasses.some((c) => c.id === confirmRemove.assignmentId) || t.teacherSubjects.some((s) => s.id === confirmRemove.assignmentId));
      if (!teacher) throw new Error("Teacher not found");

      const res = await fetch(`/api/teachers/${teacher.id}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: confirmRemove.type, assignmentId: confirmRemove.assignmentId }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      toast("Assignment removed");
      fetchData();
    } catch {
      toast("Failed to remove assignment", "error");
    }
    setConfirmRemove(null);
  };

  const filteredTeachers = teachers.filter((t) =>
    !search || `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    t.staffNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Get assigned class/subject IDs for each teacher to filter dropdowns
  const getAssignedClassIds = (teacher: Teacher) => new Set(teacher.teacherClasses.map((c) => c.classId));
  const getAssignedSubjectIds = (teacher: Teacher) => new Set(teacher.teacherSubjects.map((s) => s.subjectId));
  const getActiveClasses = (teacher: Teacher) => classes.filter((c) => c.academicYear.active);

  return (
    <div>
      <PageHeader
        title="Teacher Assignments"
        description="Manage class and subject assignments for teachers."
      />

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full"
            />
          </div>
        </div>

        {loading ? <LoadingState /> : filteredTeachers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-brand-gray" />}
            title="No teachers found"
            description="No teacher-role staff members found."
          />
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {filteredTeachers.map((teacher) => {
              const assignedClassIds = getAssignedClassIds(teacher);
              const assignedSubjectIds = getAssignedSubjectIds(teacher);
              const activeClasses = getActiveClasses(teacher);
              const availableClasses = activeClasses.filter((c) => !assignedClassIds.has(c.id));
              const availableSubjects = subjects.filter((s) => !assignedSubjectIds.has(s.id));

              return (
                <div key={teacher.id} className="p-4 hover:bg-brand-light/30">
                  {/* Teacher Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-brand-red text-sm font-bold">{teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand-dark">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-xs text-brand-gray">{teacher.position || "Teacher"} · {teacher.staffNumber || "No staff number"}</p>
                    </div>
                  </div>

                  {/* Class Assignments */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Classes ({teacher.teacherClasses.length})
                      </p>
                      <button
                        onClick={() => setShowAssignClass(teacher.id)}
                        className="text-xs text-brand-red hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Class
                      </button>
                    </div>
                    {teacher.teacherClasses.length === 0 ? (
                      <p className="text-xs text-brand-gray pl-4">No classes assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {teacher.teacherClasses.map((tc) => (
                          <div key={tc.id} className="flex items-center gap-1 bg-brand-light rounded-lg px-2.5 py-1.5 text-xs">
                            <span className="text-brand-dark font-medium">{tc.class.grade.name} {tc.class.name}</span>
                            <Badge variant="default" className="text-[10px]">{tc.role.replace("_", " ")}</Badge>
                            <button
                              onClick={() => setConfirmRemove({
                                type: "class",
                                assignmentId: tc.id,
                                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                                label: `${tc.class.grade.name} ${tc.class.name}`,
                              })}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subject Assignments */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3 h-3" /> Subjects ({teacher.teacherSubjects.length})
                      </p>
                      <button
                        onClick={() => setShowAssignSubject(teacher.id)}
                        className="text-xs text-brand-red hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Subject
                      </button>
                    </div>
                    {teacher.teacherSubjects.length === 0 ? (
                      <p className="text-xs text-brand-gray pl-4">No subjects assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {teacher.teacherSubjects.map((ts) => (
                          <div key={ts.id} className="flex items-center gap-1 bg-brand-light rounded-lg px-2.5 py-1.5 text-xs">
                            <span className="text-brand-dark font-medium">{ts.subject.name}</span>
                            {ts.subject.code && <span className="text-brand-gray">({ts.subject.code})</span>}
                            <button
                              onClick={() => setConfirmRemove({
                                type: "subject",
                                assignmentId: ts.id,
                                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                                label: ts.subject.name,
                              })}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Assign Class Modal */}
      {showAssignClass && (
        <AssignClassModal
          teacherId={showAssignClass}
          teachers={teachers}
          classes={classes}
          onAssign={handleAssignClass}
          onClose={() => setShowAssignClass(null)}
        />
      )}

      {/* Assign Subject Modal */}
      {showAssignSubject && (
        <AssignSubjectModal
          teacherId={showAssignSubject}
          teachers={teachers}
          subjects={subjects}
          onAssign={handleAssignSubject}
          onClose={() => setShowAssignSubject(null)}
        />
      )}

      {/* Confirm Remove */}
      <ConfirmModal
        open={!!confirmRemove}
        title="Remove Assignment"
        message={`Remove "${confirmRemove?.label}" from ${confirmRemove?.teacherName}?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────

function AssignClassModal({ teacherId, teachers, classes, onAssign, onClose }: {
  teacherId: string;
  teachers: Teacher[];
  classes: ClassOption[];
  onAssign: (staffId: string, classId: string, role: string) => void;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState("");
  const [role, setRole] = useState("class_teacher");

  const teacher = teachers.find((t) => t.id === teacherId);
  const assignedClassIds = new Set(teacher?.teacherClasses.map((c) => c.classId) || []);
  const activeClasses = classes.filter((c) => c.academicYear.active);
  const availableClasses = activeClasses.filter((c) => !assignedClassIds.has(c.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    onAssign(teacherId, classId, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">
            Assign Class to {teacher?.firstName} {teacher?.lastName}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={availableClasses.map((c) => ({ value: c.id, label: `${c.grade.name} ${c.name} (${c.academicYear.name})` }))}
            placeholder="Select class"
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: "class_teacher", label: "Class Teacher" },
              { value: "subject_teacher", label: "Subject Teacher" },
            ]}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!classId}>Assign</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignSubjectModal({ teacherId, teachers, subjects, onAssign, onClose }: {
  teacherId: string;
  teachers: Teacher[];
  subjects: SubjectOption[];
  onAssign: (staffId: string, subjectId: string) => void;
  onClose: () => void;
}) {
  const [subjectId, setSubjectId] = useState("");

  const teacher = teachers.find((t) => t.id === teacherId);
  const assignedSubjectIds = new Set(teacher?.teacherSubjects.map((s) => s.subjectId) || []);
  const availableSubjects = subjects.filter((s) => !assignedSubjectIds.has(s.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    onAssign(teacherId, subjectId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">
            Assign Subject to {teacher?.firstName} {teacher?.lastName}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={availableSubjects.map((s) => ({ value: s.id, label: s.name + (s.code ? ` (${s.code})` : "") }))}
            placeholder="Select subject"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!subjectId}>Assign</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
