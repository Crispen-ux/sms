"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Card, Button, Badge, EmptyState, LoadingState, Input, Select,
  ConfirmModal, useToast,
} from "@/components/ui";
import Link from "next/link";
import {
  ArrowLeft, Mail, BookOpen, GraduationCap, Users, ClipboardCheck,
  FileText, User, Phone, Calendar, Hash, DollarSign, Download,
  Send, Eye, Plus, MoreHorizontal, X, AlertCircle, CheckCircle,
  Edit, Trash2, Activity, Clock, Award, MessageSquare, ChevronRight,
  Receipt, CreditCard, CalendarDays,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────

interface StaffProfile {
  id: string;
  staffNumber: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  schoolId: string;
  user: { id: string; email: string; name: string | null; role: string; status: string; lastLoginAt: string | null } | null;
  teacherClasses: any[];
  teacherSubjects: any[];
}

interface ClassSummary {
  id: string;
  classId: string;
  role: string;
  className: string;
  grade: { id: string; name: string };
  academicYear: { id: string; name: string; active: boolean };
  studentCount: number;
  students: { id: string; firstName: string; lastName: string; studentNumber: string | null }[];
  attendanceRate: number;
}

interface SubjectSummary {
  id: string;
  subjectId: string;
  subject: { id: string; name: string; code: string | null };
  assessmentCount: number;
  activeAssessments: number;
}

interface ProfileData {
  staff: StaffProfile;
  classes: ClassSummary[];
  subjects: SubjectSummary[];
  totalStudents: number;
  attendance: { total: number; present: number; absent: number; late: number; excused: number; rate: number };
  assessments: { total: number; active: number };
  documents: { id: string; type: string; title: string; createdAt: string; student: { id: string; firstName: string; lastName: string } | null; academicYear: { name: string } | null }[];
  activity: { id: string; action: string; resource: string; metadata: any; createdAt: string; userName: string }[];
}

type Tab = "overview" | "classes" | "subjects" | "students" | "assessments" | "attendance" | "documents" | "communication" | "activity";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "classes", label: "Classes", icon: BookOpen },
  { key: "subjects", label: "Subjects", icon: Award },
  { key: "students", label: "Students", icon: Users },
  { key: "assessments", label: "Assessments", icon: FileText },
  { key: "attendance", label: "Attendance", icon: ClipboardCheck },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "communication", label: "Communication", icon: Mail },
  { key: "activity", label: "Activity", icon: Activity },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  INACTIVE: "bg-gray-50 text-gray-700 border-gray-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
};

// ─── Main Page ─────────────────────────────────────────

export default function Teacher360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAssignClass, setShowAssignClass] = useState(false);
  const [showAssignSubject, setShowAssignSubject] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/teachers/${id}/profile`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to load teacher" }));
        throw new Error(err.error || "Failed to load teacher");
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Failed to load teacher data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState message="Loading teacher profile..." />;

  if (error || !data) {
    return (
      <div>
        <Link href="/admin/staff" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Staff
        </Link>
        <Card padding>
          <EmptyState
            icon={<AlertCircle className="w-8 h-8 text-red-400" />}
            title="Failed to load teacher"
            description={error || "Teacher not found"}
            action={<Button onClick={fetchData}>Retry</Button>}
          />
        </Card>
      </div>
    );
  }

  const { staff, classes, subjects, totalStudents, attendance, assessments, documents, activity } = data;
  const isTeacher = staff.position?.toLowerCase().includes("teacher") || staff.user?.role === "TEACHER";

  return (
    <div className="space-y-6">
      <Link href="/admin/staff" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark">
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </Link>

      {/* Teacher Header */}
      <Card padding>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-brand-red text-xl font-bold">
                {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-brand-dark truncate">
                {staff.firstName} {staff.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-gray mt-1">
                {staff.staffNumber && (
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{staff.staffNumber}</span>
                )}
                {staff.position && (
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" />{staff.position}</span>
                )}
                {staff.user?.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{staff.user.email}</span>
                )}
                {staff.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{staff.phone}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {classes.length > 0 && (
                  <Badge variant="info">{classes.length} Class{classes.length !== 1 ? "es" : ""}</Badge>
                )}
                {subjects.length > 0 && (
                  <Badge variant="info">{subjects.length} Subject{subjects.length !== 1 ? "s" : ""}</Badge>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[staff.user?.status || "ACTIVE"] || STATUS_COLORS.ACTIVE}`}>
                  {staff.user?.status || "No Account"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" icon={<Mail className="w-4 h-4" />}>Email</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAssignClass(true)} icon={<Plus className="w-4 h-4" />}>Assign Class</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAssignSubject(true)} icon={<Plus className="w-4 h-4" />}>Assign Subject</Button>
            <div className="relative">
              <Button size="sm" variant="ghost" onClick={() => setMoreOpen(!moreOpen)} icon={<MoreHorizontal className="w-4 h-4" />}>More</Button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-brand-mid/30 py-1 w-52">
                    {isTeacher && staff.user && (
                      <Link href={`/teacher`} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3" onClick={() => setMoreOpen(false)}>
                        <Eye className="w-4 h-4 text-brand-gray" /> Teacher Dashboard
                      </Link>
                    )}
                    <button onClick={() => { setMoreOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3">
                      <Edit className="w-4 h-4 text-brand-gray" /> Edit Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-brand-mid/30">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-brand-red text-brand-red"
                    : "border-transparent text-brand-gray hover:text-brand-dark hover:border-brand-mid"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "classes" && <ClassesTab data={data} />}
      {activeTab === "subjects" && <SubjectsTab data={data} />}
      {activeTab === "students" && <StudentsTab data={data} />}
      {activeTab === "assessments" && <AssessmentsTab data={data} />}
      {activeTab === "attendance" && <AttendanceTab data={data} />}
      {activeTab === "documents" && <DocumentsTab data={data} />}
      {activeTab === "communication" && <CommunicationTab data={data} />}
      {activeTab === "activity" && <ActivityTab data={data} />}

      {/* Modals */}
      {showAssignClass && (
        <AssignClassModal staffId={id} onClose={() => setShowAssignClass(false)} onSuccess={() => { setShowAssignClass(false); fetchData(); toast("Class assigned"); }} />
      )}
      {showAssignSubject && (
        <AssignSubjectModal staffId={id} onClose={() => setShowAssignSubject(false)} onSuccess={() => { setShowAssignSubject(false); fetchData(); toast("Subject assigned"); }} />
      )}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────

function OverviewTab({ data }: { data: ProfileData }) {
  const { staff, classes, subjects, totalStudents, attendance, assessments } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats Cards */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{classes.length}</p>
          <p className="text-xs text-brand-gray">Classes</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{totalStudents}</p>
          <p className="text-xs text-brand-gray">Students</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{subjects.length}</p>
          <p className="text-xs text-brand-gray">Subjects</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{assessments.active}</p>
          <p className="text-xs text-brand-gray">Active Assessments</p>
        </Card>
      </div>

      {/* Attendance */}
      <Card padding>
        <h3 className="text-sm font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-brand-red" /> Attendance
        </h3>
        {attendance.total > 0 ? (
          <>
            <div className="text-center mb-3">
              <p className="text-2xl font-bold text-brand-dark">{attendance.rate}%</p>
              <p className="text-xs text-brand-gray">Overall Rate</p>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="bg-green-50 rounded-lg p-1.5">
                <p className="text-sm font-semibold text-green-700">{attendance.present}</p>
                <p className="text-[10px] text-green-600">Present</p>
              </div>
              <div className="bg-red-50 rounded-lg p-1.5">
                <p className="text-sm font-semibold text-red-700">{attendance.absent}</p>
                <p className="text-[10px] text-red-600">Absent</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-1.5">
                <p className="text-sm font-semibold text-amber-700">{attendance.late}</p>
                <p className="text-[10px] text-amber-600">Late</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-1.5">
                <p className="text-sm font-semibold text-blue-700">{attendance.excused}</p>
                <p className="text-[10px] text-blue-600">Excused</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-brand-gray">No attendance records</p>
        )}
      </Card>

      {/* Classes */}
      <Card padding className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-red" /> Assigned Classes
        </h3>
        {classes.length === 0 ? (
          <p className="text-sm text-brand-gray">No classes assigned</p>
        ) : (
          <div className="space-y-2">
            {classes.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between bg-brand-light/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-brand-dark">{cls.grade.name} {cls.className}</p>
                  <p className="text-xs text-brand-gray">{cls.studentCount} students · {cls.role.replace("_", " ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand-dark">{cls.attendanceRate}%</p>
                  <p className="text-[10px] text-brand-gray">attendance</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Subjects */}
      <Card padding>
        <h3 className="text-sm font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-red" /> Assigned Subjects
        </h3>
        {subjects.length === 0 ? (
          <p className="text-sm text-brand-gray">No subjects assigned</p>
        ) : (
          <div className="space-y-2">
            {subjects.map((sub) => (
              <div key={sub.id} className="bg-brand-light/50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-brand-dark">{sub.subject.name}</p>
                <p className="text-xs text-brand-gray">{sub.assessmentCount} assessments · {sub.activeAssessments} active</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card padding className="lg:col-span-3">
        <h3 className="text-sm font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-red" /> Recent Activity
        </h3>
        {data.activity.length === 0 ? (
          <p className="text-sm text-brand-gray">No activity recorded</p>
        ) : (
          <div className="space-y-2">
            {data.activity.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-3 pb-2 border-b border-brand-mid/30 last:border-0">
                <div className="w-2 h-2 bg-brand-red rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-dark">{log.action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                  <p className="text-xs text-brand-gray">{log.userName} · {new Date(log.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Classes Tab ───────────────────────────────────────

function ClassesTab({ data }: { data: ProfileData }) {
  const { toast } = useToast();
  const [showAssign, setShowAssign] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Assigned Classes</h2>
        <Button size="sm" onClick={() => setShowAssign(true)} icon={<Plus className="w-4 h-4" />}>Assign Class</Button>
      </div>

      {data.classes.length === 0 ? (
        <Card padding>
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-brand-gray" />}
            title="No classes assigned"
            description="This teacher has no classes assigned yet."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.classes.map((cls) => (
            <Card key={cls.id} padding>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-brand-dark">{cls.grade.name} {cls.className}</h3>
                  <p className="text-sm text-brand-gray">{cls.academicYear.name}</p>
                </div>
                <Badge variant="info">{cls.role.replace("_", " ")}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brand-gray">
                  <span>Students</span>
                  <span className="font-medium text-brand-dark">{cls.studentCount}</span>
                </div>
                <div className="flex justify-between text-brand-gray">
                  <span>Attendance Rate</span>
                  <span className="font-medium text-brand-dark">{cls.attendanceRate}%</span>
                </div>
              </div>
              {cls.students.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-mid/30">
                  <p className="text-xs text-brand-gray mb-2">Students</p>
                  <div className="space-y-1">
                    {cls.students.slice(0, 5).map((s) => (
                      <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center justify-between text-sm hover:bg-brand-light/50 rounded px-2 py-1">
                        <span className="text-brand-dark">{s.firstName} {s.lastName}</span>
                        <span className="text-xs text-brand-gray font-mono">{s.studentNumber || "—"}</span>
                      </Link>
                    ))}
                    {cls.students.length > 5 && (
                      <p className="text-xs text-brand-gray pl-2">+{cls.students.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showAssign && (
        <AssignClassModal staffId={data.staff.id} onClose={() => setShowAssign(false)} onSuccess={() => { setShowAssign(false); toast("Class assigned"); }} />
      )}
    </div>
  );
}

// ─── Subjects Tab ──────────────────────────────────────

function SubjectsTab({ data }: { data: ProfileData }) {
  const [showAssign, setShowAssign] = useState(false);
  const { toast } = useToast();

  const handleRemove = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/teachers/${data.staff.id}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subject", assignmentId }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      toast("Subject removed");
    } catch {
      toast("Failed to remove subject", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Assigned Subjects</h2>
        <Button size="sm" onClick={() => setShowAssign(true)} icon={<Plus className="w-4 h-4" />}>Assign Subject</Button>
      </div>

      {data.subjects.length === 0 ? (
        <Card padding>
          <EmptyState
            icon={<Award className="w-8 h-8 text-brand-gray" />}
            title="No subjects assigned"
            description="This teacher has no subjects assigned yet."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subjects.map((sub) => (
            <Card key={sub.id} padding>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-brand-dark">{sub.subject.name}</h3>
                  {sub.subject.code && <p className="text-xs text-brand-gray">{sub.subject.code}</p>}
                </div>
                <button onClick={() => handleRemove(sub.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brand-gray">
                  <span>Total Assessments</span>
                  <span className="font-medium text-brand-dark">{sub.assessmentCount}</span>
                </div>
                <div className="flex justify-between text-brand-gray">
                  <span>Active</span>
                  <span className="font-medium text-brand-dark">{sub.activeAssessments}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAssign && (
        <AssignSubjectModal staffId={data.staff.id} onClose={() => setShowAssign(false)} onSuccess={() => { setShowAssign(false); toast("Subject assigned"); }} />
      )}
    </div>
  );
}

// ─── Students Tab ──────────────────────────────────────

function StudentsTab({ data }: { data: ProfileData }) {
  const allStudents = data.classes.flatMap((cls) =>
    cls.students.map((s) => ({ ...s, className: `${cls.grade.name} ${cls.className}`, classId: cls.classId }))
  );
  const uniqueStudents = Array.from(new Map(allStudents.map((s) => [s.id, s])).values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Students ({uniqueStudents.length})</h2>
      </div>

      {uniqueStudents.length === 0 ? (
        <Card padding>
          <EmptyState
            icon={<Users className="w-8 h-8 text-brand-gray" />}
            title="No students"
            description="No students found in assigned classes."
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-mid/30">
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Student</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Number</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Class</th>
                  <th className="text-right px-4 py-2.5 font-medium text-brand-gray">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-mid/30">
                {uniqueStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-brand-light/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/students/${s.id}`} className="font-medium text-brand-dark hover:text-brand-red transition-colors">
                        {s.firstName} {s.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-brand-gray font-mono text-xs">{s.studentNumber || "—"}</td>
                    <td className="px-4 py-3"><Badge variant="info">{s.className}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/students/${s.id}`} className="p-2 hover:bg-brand-light rounded-lg inline-flex">
                        <Eye className="w-4 h-4 text-brand-gray" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Assessments Tab ───────────────────────────────────

function AssessmentsTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Assessments</h2>

      {data.assessments.total === 0 ? (
        <Card padding>
          <EmptyState
            icon={<FileText className="w-8 h-8 text-brand-gray" />}
            title="No assessments"
            description="No assessments found for assigned subjects."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding className="text-center">
            <p className="text-2xl font-bold text-brand-dark">{data.assessments.total}</p>
            <p className="text-xs text-brand-gray">Total Assessments</p>
          </Card>
          <Card padding className="text-center">
            <p className="text-2xl font-bold text-brand-red">{data.assessments.active}</p>
            <p className="text-xs text-brand-gray">Active (Current Year)</p>
          </Card>
          <Card padding className="text-center">
            <p className="text-2xl font-bold text-brand-dark">{data.subjects.length}</p>
            <p className="text-xs text-brand-gray">Subjects</p>
          </Card>
        </div>
      )}

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">All Assessments</h3>
        </div>
        {data.assessments.total === 0 ? (
          <div className="p-6">
            <EmptyState icon={<FileText className="w-6 h-6 text-brand-gray" />} title="No assessments" description="No assessments found." />
          </div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {/* We don't have individual assessment details in the aggregated endpoint yet, show what we have */}
            {data.subjects.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-4 py-3 hover:bg-brand-light/50">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-brand-gray" />
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{sub.subject.name}</p>
                    <p className="text-xs text-brand-gray">{sub.assessmentCount} assessments</p>
                  </div>
                </div>
                <Badge variant={sub.activeAssessments > 0 ? "success" : "default"}>
                  {sub.activeAssessments} active
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Attendance Tab ────────────────────────────────────

function AttendanceTab({ data }: { data: ProfileData }) {
  const { attendance } = data;

  const statusColor = (s: string) => {
    switch (s) {
      case "PRESENT": return "success";
      case "ABSENT": return "danger";
      case "LATE": return "warning";
      case "EXCUSED": return "info";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Attendance Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{attendance.rate}%</p>
          <p className="text-xs text-brand-gray">Rate</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
          <p className="text-xs text-brand-gray">Present</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
          <p className="text-xs text-brand-gray">Absent</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-amber-600">{attendance.late}</p>
          <p className="text-xs text-brand-gray">Late</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-blue-600">{attendance.excused}</p>
          <p className="text-xs text-brand-gray">Excused</p>
        </Card>
      </div>

      <Card padding className="text-center">
        <p className="text-sm text-brand-gray mb-2">Take attendance for your classes</p>
        {data.classes.length > 0 ? (
          <Link href="/teacher/attendance">
            <Button icon={<ClipboardCheck className="w-4 h-4" />}>Go to Attendance</Button>
          </Link>
        ) : (
          <p className="text-sm text-brand-gray">No classes assigned</p>
        )}
      </Card>
    </div>
  );
}

// ─── Documents Tab ─────────────────────────────────────

function DocumentsTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Documents</h2>

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">Student Documents ({data.documents.length})</h3>
        </div>
        {data.documents.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText className="w-6 h-6 text-brand-gray" />}
              title="No documents"
              description="No student documents found for assigned classes."
            />
          </div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {data.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-brand-light/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-gray" />
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{doc.title}</p>
                    <p className="text-xs text-brand-gray">
                      {doc.student ? `${doc.student.firstName} ${doc.student.lastName}` : "School-wide"} · {doc.type.replace("_", " ")} · {new Date(doc.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                </div>
                <a href={`/api/documents/download/${doc.id}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-brand-light rounded-lg">
                  <Download className="w-4 h-4 text-brand-gray" />
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Communication Tab ─────────────────────────────────

function CommunicationTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Communication</h2>

      <Card padding>
        <EmptyState
          icon={<MessageSquare className="w-6 h-6 text-brand-gray" />}
          title="Communication centre"
          description="Communication features will be available here. Teachers will be able to email parents, send class messages, and view communication history."
        />
      </Card>
    </div>
  );
}

// ─── Activity Tab ──────────────────────────────────────

function ActivityTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Activity Timeline</h2>

      <Card padding={false}>
        {data.activity.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Activity className="w-6 h-6 text-brand-gray" />}
              title="No activity"
              description="No activity records found for this teacher."
            />
          </div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {data.activity.map((log) => (
              <div key={log.id} className="flex gap-4 px-4 py-3">
                <div className="w-2 h-2 bg-brand-red rounded-full mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-dark">{log.action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                  <p className="text-xs text-brand-gray mt-0.5">
                    {log.userName} · {new Date(log.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────

function AssignClassModal({ staffId, onClose, onSuccess }: {
  staffId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [classId, setClassId] = useState("");
  const [role, setRole] = useState("class_teacher");
  const [classes, setClasses] = useState<{ id: string; name: string; grade: { name: string }; academicYear: { name: string; active: boolean } }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/classes?limit=200")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) { setError("Please select a class"); return; }
    setSaving(true);
    setError("");
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
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to assign class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Assign Class</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: `${c.grade.name} ${c.name} (${c.academicYear.name})` }))}
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Assigning..." : "Assign"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignSubjectModal({ staffId, onClose, onSuccess }: {
  staffId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/academics?limit=200")
      .then((r) => r.json())
      .then((d) => {
        const unique = new Map<string, { id: string; name: string; code: string | null }>();
        (d.subjects || []).forEach((s: any) => {
          if (s.subject && !unique.has(s.subjectId)) {
            unique.set(s.subjectId, { id: s.subjectId, name: s.subject.name, code: s.subject.code });
          }
        });
        setSubjects(Array.from(unique.values()));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) { setError("Please select a subject"); return; }
    setSaving(true);
    setError("");
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
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to assign subject");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Assign Subject</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjects.map((s) => ({ value: s.id, label: s.name + (s.code ? ` (${s.code})` : "") }))}
            placeholder="Select subject"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Assigning..." : "Assign"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
