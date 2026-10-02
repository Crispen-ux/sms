"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Card, Button, Badge, EmptyState, LoadingState, Input, Select,
  ConfirmModal, useToast,
} from "@/components/ui";
import Link from "next/link";
import {
  ArrowLeft, Mail, FileText, Users, GraduationCap, BookOpen, Phone,
  User, Calendar, Hash, DollarSign, Download, Send, Eye, Plus,
  MoreHorizontal, X, AlertCircle, Activity, ClipboardCheck,
  Receipt, CreditCard, File, MessageSquare,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────

interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  isPrimary: boolean;
  activeEnrolment: { grade: { id: string; name: string }; class: { id: string; name: string } | null; academicYear: { id: string; name: string } } | null;
  enrolments: any[];
  allGuardians: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null; relationship: string | null; isPrimary: boolean }[];
  finance: { totalInvoiced: number; totalPaid: number; balance: number; invoiceCount: number };
}

interface ProfileData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    relationship: string | null;
    user: { id: string; email: string; name: string | null; role: string; status: string; lastLoginAt: string | null } | null;
  };
  children: ChildSummary[];
  finance: {
    totalOutstanding: number;
    totalPaid: number;
    totalInvoiced: number;
    invoices: any[];
    payments: any[];
  };
  documents: { id: string; type: string; title: string; createdAt: string; student: { id: string; firstName: string; lastName: string } | null; academicYear: { name: string } | null }[];
  documentCount: number;
  activity: { id: string; action: string; resource: string; metadata: any; createdAt: string; userName: string }[];
}

type Tab = "overview" | "children" | "fees" | "documents" | "communication" | "activity";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "children", label: "Children", icon: Users },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "communication", label: "Communication", icon: Mail },
  { key: "activity", label: "Activity", icon: Activity },
];

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING: "warning", PARTIAL: "info", PAID: "success", OVERDUE: "danger", CANCELLED: "default",
};
const INVOICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", PARTIAL: "Partial", PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled",
};

// ─── Main Page ─────────────────────────────────────────

export default function Parent360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/parents/${id}/profile`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to load parent" }));
        throw new Error(err.error || "Failed to load parent");
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Failed to load parent data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState message="Loading parent profile..." />;

  if (error || !data) {
    return (
      <div>
        <Link href="/admin/parents" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Parents
        </Link>
        <Card padding>
          <EmptyState
            icon={<AlertCircle className="w-8 h-8 text-red-400" />}
            title="Failed to load parent"
            description={error || "Parent not found"}
            action={<Button onClick={fetchData}>Retry</Button>}
          />
        </Card>
      </div>
    );
  }

  const { parent, children, finance, documents, documentCount, activity } = data;

  return (
    <div className="space-y-6">
      <Link href="/admin/parents" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark">
        <ArrowLeft className="w-4 h-4" /> Back to Parents
      </Link>

      {/* Parent Header */}
      <Card padding>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-brand-red text-xl font-bold">
                {parent.firstName.charAt(0)}{parent.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-brand-dark truncate">
                {parent.firstName} {parent.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-gray mt-1">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{parent.relationship || "Guardian"}</span>
                {parent.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{parent.email}</span>
                )}
                {parent.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{parent.phone}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="info">{children.length} Child{children.length !== 1 ? "ren" : ""}</Badge>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  parent.user?.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"
                }`}>
                  {parent.user?.status || "No Account"}
                </span>
                {finance.totalOutstanding > 0 && (
                  <Badge variant="danger">R{finance.totalOutstanding.toLocaleString("en-ZA")} outstanding</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEmailModal(true)} icon={<Mail className="w-4 h-4" />}>Email</Button>
            <div className="relative">
              <Button size="sm" variant="ghost" onClick={() => setMoreOpen(!moreOpen)} icon={<MoreHorizontal className="w-4 h-4" />}>More</Button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-brand-mid/30 py-1 w-48">
                    <button onClick={() => { setMoreOpen(false); setActiveTab("children"); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3">
                      <Users className="w-4 h-4 text-brand-gray" /> View Children
                    </button>
                    <button onClick={() => { setMoreOpen(false); setActiveTab("documents"); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light flex items-center gap-3">
                      <FileText className="w-4 h-4 text-brand-gray" /> Documents
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
      {activeTab === "children" && <ChildrenTab data={data} />}
      {activeTab === "fees" && <FeesTab data={data} />}
      {activeTab === "documents" && <DocumentsTab data={data} />}
      {activeTab === "communication" && <CommunicationTab data={data} />}
      {activeTab === "activity" && <ActivityTab data={data} />}

      {showEmailModal && (
        <EmailParentModal
          parent={parent}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => { setShowEmailModal(false); toast("Email sent successfully"); }}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────

function OverviewTab({ data }: { data: ProfileData }) {
  const { parent, children, finance, documentCount } = data;
  const fmt = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Family Summary */}
      <div className="lg:col-span-2 space-y-6">
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-red" /> Family Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-dark">{children.length}</p>
              <p className="text-xs text-brand-gray">Children</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{children.filter((c) => c.activeEnrolment).length}</p>
              <p className="text-xs text-brand-gray">Active Students</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${finance.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(finance.totalOutstanding)}</p>
              <p className="text-xs text-brand-gray">Outstanding</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{fmt(finance.totalPaid)}</p>
              <p className="text-xs text-brand-gray">Paid This Year</p>
            </div>
          </div>
        </Card>

        {/* Children Cards */}
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-red" /> Children
          </h3>
          {children.length === 0 ? (
            <p className="text-sm text-brand-gray">No children linked</p>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between bg-brand-light/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center">
                      <span className="text-brand-red text-sm font-bold">{child.firstName.charAt(0)}{child.lastName.charAt(0)}</span>
                    </div>
                    <div>
                      <Link href={`/admin/students/${child.id}`} className="font-medium text-brand-dark hover:text-brand-red transition-colors">
                        {child.firstName} {child.lastName}
                      </Link>
                      <p className="text-xs text-brand-gray">
                        {child.activeEnrolment ? `${child.activeEnrolment.grade.name}${child.activeEnrolment.class ? ` ${child.activeEnrolment.class.name}` : ""}` : "No active enrolment"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {child.finance.balance > 0 ? (
                      <Badge variant="danger">{fmt(child.finance.balance)}</Badge>
                    ) : (
                      <Badge variant="success">Paid</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Personal Info */}
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-red" /> Guardian Information
          </h3>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={`${parent.firstName} ${parent.lastName}`} />
            <InfoRow label="Relationship" value={parent.relationship || "—"} />
            <InfoRow label="Phone" value={parent.phone || "—"} />
            <InfoRow label="Email" value={parent.email || "—"} />
            <InfoRow label="Account" value={
              <Badge variant={parent.user?.status === "ACTIVE" ? "success" : "default"}>
                {parent.user?.status || "No Account"}
              </Badge>
            } />
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-red" /> Recent Invoices
          </h3>
          {finance.invoices.length === 0 ? (
            <p className="text-sm text-brand-gray">No invoices</p>
          ) : (
            <div className="space-y-2">
              {finance.invoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-brand-dark">{inv.invoiceNumber}</p>
                    <p className="text-xs text-brand-gray">{inv.student?.firstName}</p>
                  </div>
                  <Badge variant={INVOICE_STATUS_COLORS[inv.status] as any || "default"}>
                    {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Documents */}
        <Card padding>
          <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-red" /> Documents
          </h3>
          <p className="text-sm text-brand-gray">{documentCount} document{documentCount !== 1 ? "s" : ""} on file</p>
        </Card>
      </div>
    </div>
  );
}

// ─── Children Tab ──────────────────────────────────────

function ChildrenTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-dark">Children ({data.children.length})</h2>

      {data.children.length === 0 ? (
        <Card padding>
          <EmptyState icon={<Users className="w-8 h-8 text-brand-gray" />} title="No children" description="No children are linked to this parent." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildCard({ child }: { child: ChildSummary }) {
  const fmt = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card padding>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center">
            <span className="text-brand-red font-bold">{child.firstName.charAt(0)}{child.lastName.charAt(0)}</span>
          </div>
          <div>
            <Link href={`/admin/students/${child.id}`} className="font-semibold text-brand-dark hover:text-brand-red transition-colors">
              {child.firstName} {child.lastName}
            </Link>
            <p className="text-xs text-brand-gray">{child.studentNumber || "No student number"}</p>
          </div>
        </div>
        {child.isPrimary && <Badge variant="success">Primary</Badge>}
      </div>

      <div className="space-y-2 text-sm mb-4">
        {child.activeEnrolment ? (
          <>
            <InfoRow label="Grade" value={child.activeEnrolment.grade.name} />
            <InfoRow label="Class" value={child.activeEnrolment.class?.name || "—"} />
            <InfoRow label="Year" value={child.activeEnrolment.academicYear.name} />
          </>
        ) : (
          <p className="text-brand-gray">No active enrolment</p>
        )}
        {child.gender && <InfoRow label="Gender" value={child.gender} />}
        {child.dateOfBirth && <InfoRow label="Date of Birth" value={new Date(child.dateOfBirth).toLocaleDateString("en-ZA")} />}
      </div>

      {child.finance.balance > 0 && (
        <div className="bg-red-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-600 font-medium">Outstanding Balance</p>
          <p className="text-lg font-bold text-red-700">{fmt(child.finance.balance)}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Link href={`/admin/students/${child.id}`}>
          <Button size="sm" variant="outline" icon={<Eye className="w-3 h-3" />}>View Profile</Button>
        </Link>
      </div>
    </Card>
  );
}

// ─── Fees Tab ──────────────────────────────────────────

function FeesTab({ data }: { data: ProfileData }) {
  const { finance } = data;
  const fmt = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding className="text-center">
          <p className="text-sm text-brand-gray mb-1">Outstanding</p>
          <p className={`text-2xl font-bold ${finance.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(finance.totalOutstanding)}</p>
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

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">All Invoices</h3>
        </div>
        {finance.invoices.length === 0 ? (
          <div className="p-6"><EmptyState icon={<Receipt className="w-6 h-6 text-brand-gray" />} title="No invoices" description="No invoices found for this family." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-mid/30">
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Invoice</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Student</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Amount</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Paid</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Balance</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-mid/30">
                {finance.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-light/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-dark">{inv.invoiceNumber}</p>
                      <p className="text-xs text-brand-gray">{inv.academicYear?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-brand-dark">{inv.student?.firstName} {inv.student?.lastName}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Invoice</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Student</th>
                  <th className="text-left px-4 py-2.5 font-medium text-brand-gray">Method</th>
                  <th className="text-right px-4 py-2.5 font-medium text-brand-gray">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-mid/30">
                {finance.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-light/50">
                    <td className="px-4 py-3 text-brand-dark">{new Date(p.paidAt).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3 text-brand-dark">{p.invoiceNumber}</td>
                    <td className="px-4 py-3 text-brand-dark">{p.student?.firstName}</td>
                    <td className="px-4 py-3"><Badge variant="info">{p.method}</Badge></td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{fmt(p.amount)}</td>
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

// ─── Documents Tab ─────────────────────────────────────

function DocumentsTab({ data }: { data: ProfileData }) {
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
      <h2 className="text-lg font-semibold text-brand-dark">Documents</h2>

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-dark">All Documents ({data.documentCount})</h3>
        </div>
        {data.documents.length === 0 ? (
          <div className="p-6"><EmptyState icon={<FileText className="w-6 h-6 text-brand-gray" />} title="No documents" description="No documents found for this family." /></div>
        ) : (
          <div className="divide-y divide-brand-mid/30">
            {data.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-brand-light/50">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-brand-gray" />
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{doc.title}</p>
                    <p className="text-xs text-brand-gray">
                      {doc.student ? `${doc.student.firstName} ${doc.student.lastName}` : "School-wide"} · {docTypeLabel(doc.type)} · {new Date(doc.createdAt).toLocaleDateString("en-ZA")}
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
          description="Communication history and messaging features will be available here."
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
          <div className="p-6"><EmptyState icon={<Activity className="w-6 h-6 text-brand-gray" />} title="No activity" description="No activity records found." /></div>
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

// ─── Helper ────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-gray">{label}</span>
      <span className="text-sm text-brand-dark font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Email Modal ───────────────────────────────────────

function EmailParentModal({ parent, onClose, onSuccess }: {
  parent: { firstName: string; lastName: string; email: string | null };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!parent.email) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark">Email Parent</h2>
            <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-brand-gray mb-4">No email address on file for this parent.</p>
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
        body: JSON.stringify({ to: parent.email, subject, body, recipientName: `${parent.firstName} ${parent.lastName}` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Email {parent.firstName} {parent.lastName}</h2>
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
              <span className="text-sm text-brand-dark">{parent.firstName} {parent.lastName}</span>
              <span className="text-xs text-brand-gray">({parent.email})</span>
            </div>
          </div>
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full border border-brand-mid/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none" placeholder="Type your message..." required />
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
