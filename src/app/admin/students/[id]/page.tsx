"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Card, Button, Badge, EmptyState, LoadingState, Input, Select,
  ConfirmModal, useToast,
} from "@/components/ui";
import Link from "next/link";
import {
  ArrowLeft, Mail, FileText, GraduationCap, BookOpen,
  User, Phone, Calendar, Hash, ClipboardCheck, DollarSign, Download,
  Send, Eye, Plus, MoreHorizontal, X, AlertCircle,
  Users, Edit, Trash2,
  Receipt, CreditCard, File, MessageSquare, Activity,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  idNumber: string | null;
  guardianLinks: GuardianLink[];
  enrolments: Enrolment[];
}

interface GuardianLink {
  id: string;
  isPrimary: boolean;
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    relationship: string | null;
  };
}

interface Enrolment {
  id: string;
  status: string;
  enrolledAt: string;
  grade: { id: string; name: string };
  class: { id: string; name: string } | null;
  academicYear: { id: string; name: string; active: boolean; startYear: number; endYear: number };
}

interface AttendanceData {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
  recent: { id: string; date: string; status: string; reason: string | null }[];
}

interface SubjectSummary {
  subjectId: string;
  subjectName: string;
  average: number;
  assessmentCount: number;
  latestAssessment: {
    title: string;
    type: string;
    marks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    date: string | null;
  } | null;
}

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paid: number;
  balance: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  academicYear: { name: string } | null;
  items: { id: string; description: string; amount: number; quantity: number }[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  invoiceNumber: string;
}

interface ProfileData {
  student: Student;
  currentEnrolment: Enrolment | null;
  attendance: AttendanceData;
  academics: {
    subjects: SubjectSummary[];
    overallAverage: number;
    totalAssessments: number;
  };
  finance: {
    totalInvoiced: number;
    totalPaid: number;
    balance: number;
    invoices: InvoiceSummary[];
    payments: PaymentRecord[];
  };
  documents: { id: string; type: string; title: string; createdAt: string; academicYear: { name: string } | null }[];
  documentCount: number;
  activity: { id: string; action: string; resource: string; metadata: any; createdAt: string; userName: string }[];
}

type Tab = "overview" | "academics" | "attendance" | "fees" | "documents" | "communication" | "enrolment" | "activity";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "academics", label: "Academics", icon: BookOpen },
  { key: "attendance", label: "Attendance", icon: ClipboardCheck },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "communication", label: "Communication", icon: Mail },
  { key: "enrolment", label: "Enrolment", icon: GraduationCap },
  { key: "activity", label: "Activity", icon: Activity },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  INACTIVE: "bg-gray-50 text-gray-700 border-gray-200",
  TRANSFERRED: "bg-blue-50 text-blue-700 border-blue-200",
  WITHDRAWN: "bg-red-50 text-red-700 border-red-200",
  GRADUATED: "bg-purple-50 text-purple-700 border-purple-200",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  PARTIAL: "info",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "default",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

// ─── Main Page ─────────────────────────────────────────

export default function Student360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showEnrolmentModal, setShowEnrolmentModal] = useState(false);
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${id}/profile`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to load student" }));
        throw new Error(err.error || "Failed to load student");
      }
      const profileData = await res.json();
      setData(profileData);
    } catch (e: any) {
      setError(e.message || "Failed to load student data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState message="Loading student profile..." />;

  if (error || !data) {
    return (
      <div>
        <Link href="/admin/students" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
        <Card padding>
          <EmptyState
            icon={<AlertCircle className="w-8 h-8 text-red-400" />}
            title="Failed to load student"
            description={error || "Student not found"}
            action={<Button onClick={fetchData}>Retry</Button>}
          />
        </Card>
      </div>
    );
  }

  const { student, currentEnrolment, attendance, academics, finance, documents, documentCount, activity } = data;
  const primaryGuardian = student.guardianLinks.find((gl) => gl.isPrimary)?.guardian || student.guardianLinks[0]?.guardian;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link href="/admin/students" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Student Header */}
      <Card padding>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar + Identity */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-brand-red text-xl font-bold">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-brand-dark truncate">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-gray mt-1">
                {student.studentNumber && (
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{student.studentNumber}</span>
                )}
                {currentEnrolment && (
                  <>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {currentEnrolment.grade.name}{currentEnrolment.class ? ` ${currentEnrolment.class.name}` : ""}
                    </span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{currentEnrolment.academicYear.name}</span>
                  </>
                )}
                {primaryGuardian && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{primaryGuardian.firstName} {primaryGuardian.lastName}</span>
                )}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[currentEnrolment?.status || "INACTIVE"] || STATUS_COLORS.INACTIVE}`}>
                  {currentEnrolment?.status || "No Active Enrolment"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEmailModal(true)} icon={<Mail className="w-4 h-4" />}>
              Email Parent
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("documents")} icon={<FileText className="w-4 h-4" />}>
              Documents
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowGradeModal(true)} icon={<GraduationCap className="w-4 h-4" />}>
              Change Grade
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddSubjectModal(true)} icon={<Plus className="w-4 h-4" />}>
              Add Subject
            </Button>
            <div className="relative">
              <Button size="sm" variant="ghost" onClick={() => setMoreOpen(!moreOpen)} icon={<MoreHorizontal className="w-4 h-4" />}>
                More
              </Button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-brand-mid/30 py-1 w-56">
                    <button onClick={() => { setMoreOpen(false); setShowEnrolmentModal(true); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3">
                      <GraduationCap className="w-4 h-4 text-brand-gray" /> New Enrolment
                    </button>
                    <button onClick={() => { setMoreOpen(false); setShowAddGradeModal(true); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3">
                      <Plus className="w-4 h-4 text-brand-gray" /> Add Guardian
                    </button>
                    <button onClick={() => { setMoreOpen(false); setActiveTab("fees"); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3">
                      <FileText className="w-4 h-4 text-brand-gray" /> Generate Statement
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
      {activeTab === "overview" && (
        <OverviewTab data={data} />
      )}
      {activeTab === "academics" && (
        <AcademicsTab data={data} studentId={id} />
      )}
      {activeTab === "attendance" && (
        <AttendanceTab data={data} />
      )}
      {activeTab === "fees" && (
        <FeesTab data={data} studentId={id} />
      )}
      {activeTab === "documents" && (
        <DocumentsTab data={data} studentId={id} onRefresh={fetchData} />
      )}
      {activeTab === "communication" && (
        <CommunicationTab data={data} studentId={id} onRefresh={fetchData} />
      )}
      {activeTab === "enrolment" && (
        <EnrolmentTab data={data} />
      )}
      {activeTab === "activity" && (
        <ActivityTab data={data} />
      )}

      {/* Modals */}
      {showEmailModal && (
        <EmailParentModal
          guardian={primaryGuardian}
          studentName={`${student.firstName} ${student.lastName}`}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => { setShowEmailModal(false); toast("Email sent successfully"); }}
        />
      )}
      {showGradeModal && currentEnrolment && (
        <ChangeGradeModal
          student={student}
          currentEnrolment={currentEnrolment}
          onClose={() => setShowGradeModal(false)}
          onSuccess={() => { setShowGradeModal(false); fetchData(); toast("Grade changed successfully"); }}
        />
      )}
      {showAddSubjectModal && (
        <AddSubjectModal
          studentId={id}
          currentEnrolment={currentEnrolment}
          onClose={() => setShowAddSubjectModal(false)}
          onSuccess={() => { setShowAddSubjectModal(false); toast("Subject added successfully"); }}
        />
      )}
      {showEnrolmentModal && (
        <NewEnrolmentModal
          studentId={id}
          onClose={() => setShowEnrolmentModal(false)}
          onSuccess={() => { setShowEnrolmentModal(false); fetchData(); toast("Enrolment created"); }}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────

function OverviewTab({ data }: { data: ProfileData }) {
  const { student, currentEnrolment, attendance, academics, finance, documents, documentCount } = data;
  const primaryGuardian = student.guardianLinks.find((gl) => gl.isPrimary)?.guardian;
  const secondaryGuardian = student.guardianLinks.find((gl) => !gl.isPrimary)?.guardian;

  const fmt = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Personal Info */}
      <div className="space-y-6">
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-red" /> Personal Information
          </h3>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
            <InfoRow label="Student ID" value={student.studentNumber || "—"} />
            <InfoRow label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-ZA") : "—"} />
            <InfoRow label="Gender" value={student.gender || "—"} />
            <InfoRow label="Nationality" value={student.nationality || "—"} />
            <InfoRow label="ID Number" value={student.idNumber || "—"} />
          </div>
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-red" /> Guardian Information
          </h3>
          {primaryGuardian ? (
            <div className="space-y-4">
              <GuardianCard guardian={primaryGuardian} label="Primary" />
              {secondaryGuardian && <GuardianCard guardian={secondaryGuardian} label="Secondary" />}
            </div>
          ) : (
            <p className="text-sm text-brand-gray">No guardians linked</p>
          )}
        </Card>
      </div>

      {/* Middle Column - Current Enrolment + Attendance */}
      <div className="space-y-6">
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-red" /> Current Enrolment
          </h3>
          {currentEnrolment ? (
            <div className="space-y-3">
              <InfoRow label="Academic Year" value={currentEnrolment.academicYear.name} />
              <InfoRow label="Grade" value={currentEnrolment.grade.name} />
              <InfoRow label="Class" value={currentEnrolment.class?.name || "—"} />
              <InfoRow label="Status" value={<Badge variant={currentEnrolment.status === "ACTIVE" ? "success" : "default"}>{currentEnrolment.status}</Badge>} />
              <InfoRow label="Enrolled" value={new Date(currentEnrolment.enrolledAt).toLocaleDateString("en-ZA")} />
            </div>
          ) : (
            <p className="text-sm text-brand-gray">No active enrolment</p>
          )}
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-brand-red" /> Attendance
          </h3>
          {attendance.total > 0 ? (
            <>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-brand-dark">{attendance.rate}%</p>
                <p className="text-xs text-brand-gray">Attendance Rate</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-green-700">{attendance.present}</p>
                  <p className="text-[10px] text-green-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-red-700">{attendance.absent}</p>
                  <p className="text-[10px] text-red-600">Absent</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-amber-700">{attendance.late}</p>
                  <p className="text-[10px] text-amber-600">Late</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-blue-700">{attendance.excused}</p>
                  <p className="text-[10px] text-blue-600">Excused</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-brand-gray">No attendance records available</p>
          )}
        </Card>
      </div>

      {/* Right Column - Academics + Finance + Documents */}
      <div className="space-y-6">
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-red" /> Academics
          </h3>
          {academics.subjects.length > 0 ? (
            <>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-brand-dark">{academics.overallAverage}%</p>
                <p className="text-xs text-brand-gray">Overall Average</p>
              </div>
              <div className="space-y-2">
                {academics.subjects.slice(0, 5).map((s) => (
                  <div key={s.subjectId} className="flex items-center justify-between text-sm">
                    <span className="text-brand-dark truncate">{s.subjectName}</span>
                    <span className="font-medium text-brand-gray">{s.average}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-brand-gray">No assessment results yet</p>
          )}
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-red" /> Finance
          </h3>
          <div className="space-y-3">
            <InfoRow label="Outstanding" value={<span className={finance.balance > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>{fmt(finance.balance)}</span>} />
            <InfoRow label="Paid This Year" value={fmt(finance.totalPaid)} />
            <InfoRow label="Total Invoiced" value={fmt(finance.totalInvoiced)} />
          </div>
          {finance.invoices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-mid/30 space-y-2">
              {finance.invoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <span className="text-brand-dark truncate">{inv.invoiceNumber}</span>
                  <Badge variant={INVOICE_STATUS_COLORS[inv.status] as any || "default"}>
                    {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-red" /> Documents
          </h3>
          <p className="text-sm text-brand-gray">{documentCount} document{documentCount !== 1 ? "s" : ""} on file</p>
          {documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {documents.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-brand-dark truncate">{d.title}</span>
                  <Badge variant="default">{d.type.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Academics Tab ─────────────────────────────────────

function AcademicsTab({ data, studentId }: { data: ProfileData; studentId: string }) {
  const { academics } = data;
  const { toast } = useToast();
  const [showEnterGrade, setShowEnterGrade] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectSummary | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-dark">Academic Performance</h2>
          <p className="text-sm text-brand-gray">Overall average: {academics.overallAverage}%</p>
        </div>
        <Button size="sm" onClick={() => setShowEnterGrade(true)} icon={<Plus className="w-4 h-4" />}>Add Assessment</Button>
      </div>

      {academics.subjects.length === 0 ? (
        <Card padding>
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-brand-gray" />}
            title="No academic records"
            description="No assessment results found for this student."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academics.subjects.map((subject) => (
            <Card key={subject.subjectId} padding>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-brand-dark">{subject.subjectName}</h3>
                <Badge variant={subject.average >= 60 ? "success" : subject.average >= 40 ? "warning" : "danger"}>
                  {subject.average}%
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brand-gray">
                  <span>Assessments</span>
                  <span>{subject.assessmentCount}</span>
                </div>
                {subject.latestAssessment && (
                  <div className="pt-2 border-t border-brand-mid/30">
                    <p className="text-xs text-brand-gray mb-1">Latest: {subject.latestAssessment.title}</p>
                    <div className="flex justify-between">
                      <span className="text-brand-dark">{subject.latestAssessment.marks}/{subject.latestAssessment.totalMarks}</span>
                      <Badge variant="info">{subject.latestAssessment.grade}</Badge>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-brand-mid/30">
                <button
                  onClick={() => { setSelectedSubject(subject); setShowEnterGrade(true); }}
                  className="text-xs text-brand-red hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Enter Grade
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showEnterGrade && (
        <EnterGradeModal
          studentId={studentId}
          studentName={`${data.student.firstName} ${data.student.lastName}`}
          subject={selectedSubject}
          onClose={() => { setShowEnterGrade(false); setSelectedSubject(null); }}
          onSuccess={() => { setShowEnterGrade(false); setSelectedSubject(null); toast("Grade entered successfully"); }}
        />
      )}
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

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">Recent Attendance</h3>
        </div>
        {attendance.recent.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ClipboardCheck className="w-6 h-6 text-brand-gray" />}
              title="No attendance records"
              description="No attendance data available for this student."
            />
          </div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {attendance.recent.map((record) => (
              <div key={record.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-brand-dark">{new Date(record.date).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  {record.reason && <p className="text-xs text-brand-gray mt-0.5">{record.reason}</p>}
                </div>
                <Badge variant={statusColor(record.status) as any}>{record.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Fees Tab ──────────────────────────────────────────

function FeesTab({ data, studentId }: { data: ProfileData; studentId: string }) {
  const { finance } = data;
  const { toast } = useToast();
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(null);

  const fmt = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleGenerateStatement = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "STATEMENT", studentId }),
      });
      if (!res.ok) throw new Error("Failed to generate statement");
      toast("Statement generated successfully");
    } catch {
      toast("Failed to generate statement", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding className="text-center">
          <p className="text-sm text-brand-gray mb-1">Outstanding</p>
          <p className={`text-2xl font-bold ${finance.balance > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(finance.balance)}</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-sm text-brand-gray mb-1">Paid This Year</p>
          <p className="text-2xl font-bold text-green-600">{fmt(finance.totalPaid)}</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-sm text-brand-gray mb-1">Total Invoiced</p>
          <p className="text-2xl font-bold text-brand-dark">{fmt(finance.totalInvoiced)}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleGenerateStatement} icon={<FileText className="w-4 h-4" />}>Generate Statement</Button>
      </div>

      {/* Invoices */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">Invoices</h3>
        </div>
        {finance.invoices.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Receipt className="w-6 h-6 text-brand-gray" />}
              title="No invoices"
              description="No invoices found for this student."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-mid/30">
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Invoice</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Amount</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Paid</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Balance</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-brand-gray">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-mid/30">
                {finance.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-light/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-dark">{inv.invoiceNumber}</p>
                      <p className="text-xs text-brand-gray">{inv.academicYear?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-brand-dark">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-green-600">{fmt(inv.paid)}</td>
                    <td className="px-4 py-3">
                      <span className={inv.balance > 0 ? "text-red-600 font-medium" : "text-green-600"}>{fmt(inv.balance)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={INVOICE_STATUS_COLORS[inv.status] as any || "default"}>
                        {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.balance > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedInvoice(inv); setShowRecordPayment(true); }}
                          icon={<CreditCard className="w-3 h-3" />}
                        >
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payments */}
      {finance.payments.length > 0 && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-brand-mid/30">
            <h3 className="text-sm font-semibold text-brand-dark">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-mid/30">
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Reference</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Invoice</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Method</th>
                  <th className="text-right px-4 py-2.5 font-medium text-brand-gray">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-mid/30">
                {finance.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-light/50">
                    <td className="px-4 py-3 text-brand-dark">{new Date(p.paidAt).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3 text-brand-gray font-mono text-xs">{p.reference || "—"}</td>
                    <td className="px-4 py-3 text-brand-dark">{p.invoiceNumber}</td>
                    <td className="px-4 py-3"><Badge variant="info">{p.method}</Badge></td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showRecordPayment && selectedInvoice && (
        <RecordPaymentModal
          invoice={selectedInvoice}
          onClose={() => { setShowRecordPayment(false); setSelectedInvoice(null); }}
          onSuccess={() => { setShowRecordPayment(false); setSelectedInvoice(null); toast("Payment recorded"); }}
        />
      )}
    </div>
  );
}

// ─── Documents Tab ─────────────────────────────────────

function DocumentsTab({ data, studentId, onRefresh }: { data: ProfileData; studentId: string; onRefresh: () => void }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (type: string) => {
    setGenerating(type);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, studentId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      toast(`${type.replace("_", " ").toLowerCase()} generated successfully`);
      onRefresh();
    } catch (e: any) {
      toast(e.message || "Failed to generate document", "error");
    } finally {
      setGenerating(null);
    }
  };

  const docTypeLabel = (t: string) => {
    switch (t) {
      case "INVOICE": return "Invoice";
      case "TRANSCRIPT": return "Transcript";
      case "REPORT_CARD": return "Report Card";
      case "STATEMENT": return "Statement";
      case "RECEIPT": return "Receipt";
      default: return t;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Document Centre</h2>
      </div>

      {/* Generate Documents */}
      <Card padding>
        <h3 className="text-sm font-semibold text-brand-dark mb-4">Generate Documents</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["REPORT_CARD", "TRANSCRIPT", "STATEMENT", "RECEIPT"] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleGenerate(type)}
              disabled={!!generating}
              className="flex flex-col items-center gap-2 p-4 border border-brand-mid/30 rounded-xl hover:border-brand-red/50 hover:bg-brand-light/50 transition-colors disabled:opacity-50"
            >
              <FileText className="w-6 h-6 text-brand-red" />
              <span className="text-xs font-medium text-brand-dark">{docTypeLabel(type)}</span>
              {generating === type && <span className="text-[10px] text-brand-gray">Generating...</span>}
            </button>
          ))}
        </div>
      </Card>

      {/* Document List */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">Documents ({data.documentCount})</h3>
        </div>
        {data.documents.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText className="w-6 h-6 text-brand-gray" />}
              title="No documents"
              description="No documents generated yet. Use the buttons above to generate documents."
            />
          </div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {data.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-brand-light/50">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-brand-gray" />
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{doc.title}</p>
                    <p className="text-xs text-brand-gray">{docTypeLabel(doc.type)} · {new Date(doc.createdAt).toLocaleDateString("en-ZA")}</p>
                  </div>
                </div>
                <a
                  href={`/api/documents/download/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-brand-light rounded-lg"
                >
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

function CommunicationTab({ data, studentId, onRefresh }: { data: ProfileData; studentId: string; onRefresh: () => void }) {
  const { toast } = useToast();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const primaryGuardian = data.student.guardianLinks.find((gl) => gl.isPrimary)?.guardian;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Communication</h2>
        <Button size="sm" onClick={() => setShowEmailModal(true)} icon={<Mail className="w-4 h-4" />}>Email Parent</Button>
      </div>

      <Card padding>
        {data.activity.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6 text-brand-gray" />}
            title="No communication history"
            description="No communication records found for this student."
          />
        ) : (
          <div className="space-y-4">
            {data.activity.filter((a) => a.action.includes("email") || a.action.includes("communication") || a.action.includes("notification")).length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="w-6 h-6 text-brand-gray" />}
                title="No communication history"
                description="No emails or messages have been sent for this student."
              />
            ) : (
              data.activity
                .filter((a) => a.action.includes("email") || a.action.includes("communication") || a.action.includes("notification"))
                .slice(0, 20)
                .map((log) => (
                  <div key={log.id} className="flex gap-3 pb-4 border-b border-brand-mid/30 last:border-0">
                    <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-brand-gray" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-dark">{log.action.replace(/[._]/g, " ")}</p>
                      <p className="text-xs text-brand-gray mt-0.5">
                        {log.userName} · {new Date(log.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </Card>

      {showEmailModal && (
        <EmailParentModal
          guardian={primaryGuardian}
          studentName={`${data.student.firstName} ${data.student.lastName}`}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => { setShowEmailModal(false); toast("Email sent successfully"); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Enrolment Tab ─────────────────────────────────────

function EnrolmentTab({ data }: { data: ProfileData }) {
  const { student } = data;

  const statusVariant = (s: string) => {
    switch (s) {
      case "ACTIVE": return "success";
      case "GRADUATED": return "info";
      case "TRANSFERRED": return "warning";
      case "WITHDRAWN": return "danger";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Enrolment History</h2>

      {student.enrolments.length === 0 ? (
        <Card padding>
          <EmptyState
            icon={<GraduationCap className="w-6 h-6 text-brand-gray" />}
            title="No enrolments"
            description="This student has no enrolment records."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {student.enrolments.map((enrolment) => (
            <Card key={enrolment.id} padding>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enrolment.academicYear.active ? "bg-brand-red/10" : "bg-brand-light"}`}>
                    <GraduationCap className={`w-5 h-5 ${enrolment.academicYear.active ? "text-brand-red" : "text-brand-gray"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-brand-dark">{enrolment.academicYear.name}</p>
                    <p className="text-sm text-brand-gray">
                      {enrolment.grade.name}{enrolment.class ? ` · Class ${enrolment.class.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={statusVariant(enrolment.status) as any}>{enrolment.status}</Badge>
                  <p className="text-xs text-brand-gray mt-1">{new Date(enrolment.enrolledAt).toLocaleDateString("en-ZA")}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activity Tab ──────────────────────────────────────

function ActivityTab({ data }: { data: ProfileData }) {
  const formatAction = (action: string) => {
    return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Activity Timeline</h2>

      <Card padding={false}>
        {data.activity.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Activity className="w-6 h-6 text-brand-gray" />}
              title="No activity"
              description="No activity records found for this student."
            />
          </div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {data.activity.map((log) => (
              <div key={log.id} className="flex gap-4 px-4 py-3">
                <div className="w-2 h-2 bg-brand-red rounded-full mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-dark">{formatAction(log.action)}</p>
                  <p className="text-xs text-brand-gray mt-0.5">
                    by {log.userName} · {new Date(log.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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

// ─── Helper Components ─────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-gray">{label}</span>
      <span className="text-sm text-brand-dark font-medium text-right">{value}</span>
    </div>
  );
}

function GuardianCard({ guardian, label }: { guardian: { firstName: string; lastName: string; phone: string | null; email: string | null; relationship: string | null }; label: string }) {
  return (
    <div className="bg-brand-light/50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-brand-dark">{guardian.firstName} {guardian.lastName}</p>
        <Badge variant="default">{label}</Badge>
      </div>
      {guardian.relationship && <p className="text-xs text-brand-gray mb-1">{guardian.relationship}</p>}
      <div className="space-y-0.5">
        {guardian.phone && (
          <p className="text-xs text-brand-gray flex items-center gap-1"><Phone className="w-3 h-3" />{guardian.phone}</p>
        )}
        {guardian.email && (
          <p className="text-xs text-brand-gray flex items-center gap-1"><Mail className="w-3 h-3" />{guardian.email}</p>
        )}
      </div>
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────

function EmailParentModal({ guardian, studentName, onClose, onSuccess }: {
  guardian: { firstName: string; lastName: string; email: string | null } | undefined;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [subject, setSubject] = useState(`Regarding ${studentName}`);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!guardian?.email) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark">Email Parent</h2>
            <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-brand-gray mb-4">No email address found for this guardian.</p>
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { setError("Subject and message are required"); return; }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: guardian.email, subject, body, recipientName: `${guardian.firstName} ${guardian.lastName}` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to send" }));
        throw new Error(err.error || "Failed to send email");
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Email Parent</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">To</label>
            <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2.5">
              <span className="text-sm text-brand-dark">{guardian.firstName} {guardian.lastName}</span>
              <span className="text-xs text-brand-gray">({guardian.email})</span>
            </div>
          </div>
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full border border-brand-mid/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none"
              placeholder="Type your message..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={sending}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={sending} icon={sending ? undefined : <Send className="w-4 h-4" />}>
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EnterGradeModal({ studentId, studentName, subject, onClose, onSuccess }: {
  studentId: string;
  studentName: string;
  subject: SubjectSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [subjectId, setSubjectId] = useState(subject?.subjectId || "");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/academics?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const unique = new Map<string, { id: string; name: string }>();
        (d.subjects || []).forEach((s: any) => {
          if (s.subject && !unique.has(s.subjectId)) {
            unique.set(s.subjectId, { id: s.subjectId, name: s.subject.name });
          }
        });
        setSubjects(Array.from(unique.values()));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !assessmentTitle.trim() || !marks || !totalMarks) {
      setError("All fields are required");
      return;
    }
    const markNum = parseFloat(marks);
    const totalNum = parseFloat(totalMarks);
    if (isNaN(markNum) || isNaN(totalNum) || totalNum <= 0) {
      setError("Please enter valid marks");
      return;
    }
    if (markNum > totalNum) {
      setError("Marks cannot exceed total marks");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // First create the assessment
      const assessRes = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: assessmentTitle, subjectId, totalMarks: totalNum }),
      });
      if (!assessRes.ok) throw new Error("Failed to create assessment");
      const assessment = await assessRes.json();

      // Then save the result
      const resultRes = await fetch(`/api/assessments/${assessment.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: [{ studentId, marks: markNum }] }),
      });
      if (!resultRes.ok) throw new Error("Failed to save grade");

      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Enter Grade</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-brand-gray mb-4">Student: <span className="font-medium text-brand-dark">{studentName}</span></p>
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
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select subject"
          />
          <Input label="Assessment Title" value={assessmentTitle} onChange={(e) => setAssessmentTitle(e.target.value)} placeholder="e.g. Term 2 Test" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marks Obtained" type="number" value={marks} onChange={(e) => setMarks(e.target.value)} min="0" required />
            <Input label="Total Marks" type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} min="1" required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : "Save Grade"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeGradeModal({ student, currentEnrolment, onClose, onSuccess }: {
  student: Student;
  currentEnrolment: Enrolment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/academics?limit=100").then((r) => r.json()),
    ]).then(([acad]) => {
      const gMap = new Map<string, { id: string; name: string }>();
      const cMap = new Map<string, { id: string; name: string }>();
      const yMap = new Map<string, { id: string; name: string; active: boolean }>();
      (acad.enrolments || []).forEach((e: any) => {
        if (e.grade && !gMap.has(e.grade.id)) gMap.set(e.grade.id, e.grade);
        if (e.class && !cMap.has(e.class.id)) cMap.set(e.class.id, e.class);
        if (e.academicYear && !yMap.has(e.academicYear.id)) yMap.set(e.academicYear.id, e.academicYear);
      });
      setGrades(Array.from(gMap.values()));
      setClasses(Array.from(cMap.values()));
      setAcademicYears(Array.from(yMap.values()));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeId || !academicYearId) {
      setError("Grade and academic year are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/enrolments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          gradeId,
          academicYearId,
          classId: classId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to create enrolment");
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to change grade");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Enrolment</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-brand-gray mb-4">
          Current: <span className="font-medium text-brand-dark">{currentEnrolment.grade.name}{currentEnrolment.class ? ` ${currentEnrolment.class.name}` : ""}</span> ({currentEnrolment.academicYear.name})
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Academic Year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            options={academicYears.map((y) => ({ value: y.id, label: y.name + (y.active ? " (Active)" : "") }))}
            placeholder="Select year"
          />
          <Select
            label="Grade"
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            options={grades.map((g) => ({ value: g.id, label: g.name }))}
            placeholder="Select grade"
          />
          <Select
            label="Class (Optional)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : "Create Enrolment"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSubjectModal({ studentId, currentEnrolment, onClose, onSuccess }: {
  studentId: string;
  currentEnrolment: Enrolment | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // This is a placeholder - subject assignment depends on the school's academic model
  // If subjects are inherited from class, this may not be needed
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Add Subject</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-brand-gray mb-4">
          Subject assignment is typically managed through the class enrolment. If this student needs specific subject placement, please use the academics section.
        </p>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </div>
    </div>
  );
}

function NewEnrolmentModal({ studentId, onClose, onSuccess }: {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/academics?limit=100").then((r) => r.json()),
    ]).then(([acad]) => {
      const gMap = new Map<string, { id: string; name: string }>();
      const cMap = new Map<string, { id: string; name: string }>();
      const yMap = new Map<string, { id: string; name: string; active: boolean }>();
      (acad.enrolments || []).forEach((e: any) => {
        if (e.grade && !gMap.has(e.grade.id)) gMap.set(e.grade.id, e.grade);
        if (e.class && !cMap.has(e.class.id)) cMap.set(e.class.id, e.class);
        if (e.academicYear && !yMap.has(e.academicYear.id)) yMap.set(e.academicYear.id, e.academicYear);
      });
      setGrades(Array.from(gMap.values()));
      setClasses(Array.from(cMap.values()));
      setAcademicYears(Array.from(yMap.values()));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeId || !academicYearId) {
      setError("Grade and academic year are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/enrolments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          gradeId,
          academicYearId,
          classId: classId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to create enrolment");
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create enrolment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Enrolment</h2>
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
            label="Academic Year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            options={academicYears.map((y) => ({ value: y.id, label: y.name + (y.active ? " (Active)" : "") }))}
            placeholder="Select year"
          />
          <Select
            label="Grade"
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            options={grades.map((g) => ({ value: g.id, label: g.name }))}
            placeholder="Select grade"
          />
          <Select
            label="Class (Optional)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : "Create Enrolment"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordPaymentModal({ invoice, onClose, onSuccess }: {
  invoice: InvoiceSummary;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(String(invoice.balance));
  const [method, setMethod] = useState("EFT");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fmt = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount"); return; }
    if (amt > invoice.balance) { setError("Amount exceeds outstanding balance"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method, reference: reference || undefined, notes: notes || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to record payment");
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Record Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-brand-light rounded-xl p-4 mb-4">
          <p className="text-sm text-brand-gray">Invoice: <span className="font-medium text-brand-dark">{invoice.invoiceNumber}</span></p>
          <p className="text-sm text-brand-gray">Outstanding: <span className="font-medium text-red-600">{fmt(invoice.balance)}</span></p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" required />
          <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)} options={[
            { value: "EFT", label: "EFT" },
            { value: "CASH", label: "Cash" },
            { value: "CARD", label: "Card" },
            { value: "DEBIT_ORDER", label: "Debit Order" },
            { value: "OTHER", label: "Other" },
          ]} />
          <Input label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. EFT reference number" />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Recording..." : "Record Payment"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
