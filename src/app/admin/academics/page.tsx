"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, Calendar, GraduationCap, BookOpen, Edit, Trash2, X, AlertCircle, CheckCircle, Star } from "lucide-react";

type Tab = "years" | "grades" | "subjects";

interface AcademicYear { id: string; name: string; startYear: number; endYear: number; active: boolean; _count: { enrolments: number; classes: number }; }
interface Grade { id: string; name: string; phase: string | null; sortOrder: number; _count: { classes: number; enrolments: number }; }
interface Subject { id: string; name: string; code: string | null; _count: { teacherSubjects: number; assessments: number }; }

export default function AcademicsPage() {
  const [tab, setTab] = useState<Tab>("years");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Data
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [yRes, gRes, sRes] = await Promise.all([
        fetch("/api/academic-years?limit=100"),
        fetch("/api/grades?limit=100"),
        fetch("/api/subjects?limit=100"),
      ]);
      setYears((await yRes.json()).years);
      setGrades((await gRes.json()).grades);
      setSubjects((await sRes.json()).subjects);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    const endpoint = tab === "years" ? "/api/academic-years" : tab === "grades" ? "/api/grades" : "/api/subjects";
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Created successfully");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const endpoint = tab === "years" ? "/api/academic-years" : tab === "grades" ? "/api/grades" : "/api/subjects";
    try {
      await fetch(`${endpoint}/${confirmDelete}`, { method: "DELETE" });
      toast("Deleted successfully");
      fetchData();
    } catch {
      toast("Failed to delete", "error");
    }
    setConfirmDelete(null);
  };

  const handleSetActive = async (id: string) => {
    try {
      await fetch(`/api/academic-years/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: true }) });
      setSuccess("Academic year activated");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to activate"); setTimeout(() => setError(""), 3000); }
  };

  return (
    <div>
      <PageHeader title="Academics" description="Manage academic years, grades, and subjects." />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-brand-light rounded-xl p-1 w-fit">
        {([["years", "Academic Years", Calendar], ["grades", "Grades", GraduationCap], ["subjects", "Subjects", BookOpen]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white text-brand-dark shadow-sm" : "text-brand-gray hover:text-brand-dark"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <Card padding={false}>
        {loading ? <LoadingState /> : (
          <>
            {tab === "years" && (
              years.length === 0 ? <EmptyState icon={<Calendar className="w-6 h-6 text-brand-gray" />} title="No academic years" action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Year</Button>} /> : (
                <>
                  <div className="p-4 border-b border-brand-mid/30 flex justify-end">
                    <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />} size="sm">Add Year</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow>
                      <TableCell className="font-semibold text-brand-dark">Year</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Period</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Classes</TableCell>
                      <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
                    </TableRow></TableHeader>
                    <TableBody>
                      {years.map((y) => (
                        <TableRow key={y.id}>
                          <TableCell className="font-medium text-brand-dark">{y.name}</TableCell>
                          <TableCell className="text-brand-gray">{y.startYear} – {y.endYear}</TableCell>
                          <TableCell>{y.active ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge>}</TableCell>
                          <TableCell>{y._count.classes}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!y.active && <button onClick={() => handleSetActive(y.id)} className="p-2 hover:bg-green-50 rounded-lg" title="Set as active"><Star className="w-4 h-4 text-green-500" /></button>}
                              <button onClick={() => setConfirmDelete(y.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )
            )}

            {tab === "grades" && (
              grades.length === 0 ? <EmptyState icon={<GraduationCap className="w-6 h-6 text-brand-gray" />} title="No grades" action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Grade</Button>} /> : (
                <>
                  <div className="p-4 border-b border-brand-mid/30 flex justify-end">
                    <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />} size="sm">Add Grade</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow>
                      <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Phase</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Classes</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Enrolments</TableCell>
                      <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
                    </TableRow></TableHeader>
                    <TableBody>
                      {grades.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium text-brand-dark">{g.name}</TableCell>
                          <TableCell><Badge variant="info">{g.phase || "—"}</Badge></TableCell>
                          <TableCell>{g._count.classes}</TableCell>
                          <TableCell>{g._count.enrolments}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setConfirmDelete(g.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )
            )}

            {tab === "subjects" && (
              subjects.length === 0 ? <EmptyState icon={<BookOpen className="w-6 h-6 text-brand-gray" />} title="No subjects" action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Subject</Button>} /> : (
                <>
                  <div className="p-4 border-b border-brand-mid/30 flex justify-end">
                    <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />} size="sm">Add Subject</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow>
                      <TableCell className="font-semibold text-brand-dark">Subject</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Code</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Teachers</TableCell>
                      <TableCell className="font-semibold text-brand-dark">Assessments</TableCell>
                      <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
                    </TableRow></TableHeader>
                    <TableBody>
                      {subjects.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-brand-dark">{s.name}</TableCell>
                          <TableCell className="text-brand-gray">{s.code || "—"}</TableCell>
                          <TableCell>{s._count.teacherSubjects}</TableCell>
                          <TableCell>{s._count.assessments}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setConfirmDelete(s.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )
            )}
          </>
        )}
      </Card>

      {showCreate && (
        <CreateModal tab={tab} onSubmit={handleCreate} onClose={() => { setShowCreate(false); setError(""); }} />
      )}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CreateModal({ tab, onSubmit, onClose }: { tab: Tab; onSubmit: (d: any) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState("");
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState(new Date().getFullYear() + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "years") onSubmit({ name, startYear, endYear, active: false });
    else if (tab === "grades") onSubmit({ name, phase: phase || undefined, sortOrder: 0 });
    else onSubmit({ name, code: code || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">
            {tab === "years" ? "Add Academic Year" : tab === "grades" ? "Add Grade" : "Add Subject"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "years" && (
            <>
              <Input label="Year Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2027" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Year" type="number" value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} required />
                <Input label="End Year" type="number" value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} required />
              </div>
            </>
          )}
          {tab === "grades" && (
            <>
              <Input label="Grade Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 5" required />
              <Input label="Phase" value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="e.g. Primary Phase" hint="Optional" />
            </>
          )}
          {tab === "subjects" && (
            <>
              <Input label="Subject Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" required />
              <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MATH" hint="Optional" />
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
