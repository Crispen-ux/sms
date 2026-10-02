"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, LoadingState } from "@/components/ui";
import { useModules } from "@/lib/useModules";
import { useBranding } from "@/lib/useBranding";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  DollarSign,
  Megaphone,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UserPlus,
  FileText,
  Receipt,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface DashboardData {
  overview: {
    totalStudents: number;
    totalStaff: number;
    totalParents: number;
    totalClasses: number;
    totalSubjects: number;
    activeEnrolments: number;
    pendingAdmissions: number;
    totalInvoices: number;
  };
  financial: {
    totalRevenue: number;
    totalOwed: number;
    collectionRate: number;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
  gradeDistribution: { name: string; count: number }[];
  recentActivity: {
    admissions: { id: string; parentName: string; grade: string; status: string; createdAt: string }[];
    payments: { id: string; amount: number; method: string; invoiceNumber: string; studentName: string; paidAt: string }[];
  };
}

const fmt = (n: number) => n.toLocaleString("en-ZA");
const fmtCurrency = (n: number) => `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-green-100 text-green-700",
  ENROLLED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isEnabled } = useModules();
  const branding = useBranding();

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return null;

  const stats = [
    {
      label: "Total Students",
      value: fmt(data.overview.totalStudents),
      sub: `${fmt(data.overview.activeEnrolments)} enrolled`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      module: "students",
    },
    {
      label: "Active Staff",
      value: fmt(data.overview.totalStaff),
      sub: `${data.overview.totalClasses} classes`,
      icon: GraduationCap,
      color: "text-green-600",
      bg: "bg-green-50",
      module: "staff",
    },
    {
      label: "Attendance (30d)",
      value: `${data.attendance.rate}%`,
      sub: `${fmt(data.attendance.present)} present / ${fmt(data.attendance.absent)} absent`,
      icon: ClipboardCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
      module: "attendance",
    },
    {
      label: "Pending Admissions",
      value: fmt(data.overview.pendingAdmissions),
      sub: "awaiting action",
      icon: Megaphone,
      color: "text-brand-red",
      bg: "bg-red-50",
      module: "admissions",
    },
    {
      label: "Fee Collection",
      value: fmtCurrency(data.financial.totalRevenue),
      sub: `${data.financial.collectionRate}% collection rate`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      module: "invoicing",
    },
    {
      label: "Outstanding Fees",
      value: fmtCurrency(data.financial.totalOwed),
      sub: `${fmt(data.overview.totalInvoices)} invoices`,
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
      module: "invoicing",
    },
  ].filter((stat) => isEnabled(stat.module));

  const quickActions = [
    {
      href: "/admin/students",
      icon: UserPlus,
      iconClass: "text-blue-600",
      bg: "bg-blue-50",
      label: "Add Student",
      module: "students",
    },
    {
      href: "/admin/attendance",
      icon: ClipboardCheck,
      iconClass: "text-amber-600",
      bg: "bg-amber-50",
      label: "Record Attendance",
      module: "attendance",
    },
    {
      href: "/admin/finance",
      icon: Receipt,
      iconClass: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "Create Invoice",
      module: "invoicing",
    },
    {
      href: "/admin/announcements",
      icon: Megaphone,
      iconClass: "text-brand-red",
      bg: "bg-red-50",
      label: "Post Announcement",
      module: "communication",
    },
    {
      href: "/admin/documents",
      icon: FileText,
      iconClass: "text-purple-600",
      bg: "bg-purple-50",
      label: "Generate Report Card",
      module: "reports",
    },
  ].filter((action) => isEnabled(action.module));

  const schoolName = branding.school?.name || branding.product.name;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome to the ${schoolName} admin portal.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-brand-gray">{stat.label}</p>
                <p className="text-2xl font-bold text-brand-dark">{stat.value}</p>
                <p className="text-xs text-brand-gray mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Admissions */}
        {isEnabled("admissions") && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-dark">Recent Admissions</h3>
            <Link href="/admin/admissions" className="text-sm text-brand-red hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recentActivity.admissions.length === 0 ? (
            <p className="text-sm text-brand-gray py-4">No admissions yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.admissions.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{a.parentName}</p>
                    <p className="text-xs text-brand-gray">Grade {a.grade} · {new Date(a.createdAt).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[a.status] || "bg-gray-100 text-gray-500"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        )}

        {/* Recent Payments */}
        {isEnabled("invoicing") && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-dark">Recent Payments</h3>
            <Link href="/admin/finance" className="text-sm text-brand-red hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recentActivity.payments.length === 0 ? (
            <p className="text-sm text-brand-gray py-4">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{p.studentName}</p>
                    <p className="text-xs text-brand-gray">{p.invoiceNumber} · {new Date(p.paidAt).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{fmtCurrency(p.amount)}</p>
                    <p className="text-xs text-brand-gray uppercase">{p.method}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        )}
      </div>

      {/* Quick Actions + Grade Distribution */}
      <div className="grid lg:grid-cols-3 gap-6">
        {quickActions.length > 0 && (
        <Card>
          <h3 className="font-semibold text-brand-dark mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center`}>
                  <action.icon className={`w-4 h-4 ${action.iconClass}`} />
                </div>
                <span className="text-sm font-medium text-brand-dark">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>
        )}

        {/* Grade Distribution */}
        {isEnabled("students") && (
        <Card className={quickActions.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <h3 className="font-semibold text-brand-dark mb-4">Students by Grade</h3>
          {data.gradeDistribution.length === 0 ? (
            <p className="text-sm text-brand-gray py-4">No grade data.</p>
          ) : (
            <div className="space-y-2">
              {data.gradeDistribution.map((g) => {
                const max = Math.max(...data.gradeDistribution.map((x) => x.count), 1);
                const pct = (g.count / max) * 100;
                return (
                  <div key={g.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-brand-gray w-20 truncate">{g.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-red transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-brand-dark w-8 text-right">{g.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        )}
      </div>
    </div>
  );
}
