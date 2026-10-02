"use client";

import { useState, useEffect } from "react";
import { Card, Badge, LoadingState } from "@/components/ui";
import { BarChart3, Users, GraduationCap, DollarSign, ClipboardCheck, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsData {
  overview: { totalStudents: number; totalStaff: number; totalParents: number; totalClasses: number; totalSubjects: number; activeEnrolments: number; pendingAdmissions: number; totalInvoices: number };
  financial: { totalRevenue: number; totalOwed: number; collectionRate: number };
  attendance: { total: number; present: number; absent: number; late: number; rate: number };
  gradeDistribution: { name: string; count: number }[];
  admissionSources: { source: string; count: number }[];
  recentActivity: { admissions: any[]; payments: any[] };
}

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;
  if (!data) return null;

  const maxGradeCount = Math.max(...data.gradeDistribution.map((g) => g.count), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Executive Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <GraduationCap className="w-6 h-6 text-brand-red mx-auto mb-1" />
          <p className="text-2xl font-bold text-brand-dark">{data.overview.totalStudents}</p>
          <p className="text-xs text-brand-gray">Students</p>
        </Card>
        <Card className="text-center">
          <Users className="w-6 h-6 text-brand-red mx-auto mb-1" />
          <p className="text-2xl font-bold text-brand-dark">{data.overview.totalStaff}</p>
          <p className="text-xs text-brand-gray">Staff</p>
        </Card>
        <Card className="text-center">
          <Users className="w-6 h-6 text-brand-red mx-auto mb-1" />
          <p className="text-2xl font-bold text-brand-dark">{data.overview.totalParents}</p>
          <p className="text-xs text-brand-gray">Parents</p>
        </Card>
        <Card className="text-center">
          <BarChart3 className="w-6 h-6 text-brand-red mx-auto mb-1" />
          <p className="text-2xl font-bold text-brand-dark">{data.overview.activeEnrolments}</p>
          <p className="text-xs text-brand-gray">Active Enrolments</p>
        </Card>
      </div>

      {/* Financial & Attendance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-brand-red" />
            <h2 className="font-semibold text-brand-dark">Financial Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Total Collected</span><span className="font-semibold text-green-600">{formatCurrency(data.financial.totalRevenue)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Outstanding</span><span className="font-semibold text-red-600">{formatCurrency(data.financial.totalOwed)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Collection Rate</span><span className="font-semibold text-brand-dark">{data.financial.collectionRate}%</span></div>
            <div className="w-full bg-brand-light rounded-full h-2"><div className="bg-brand-red h-2 rounded-full" style={{ width: `${data.financial.collectionRate}%` }} /></div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-brand-red" />
            <h2 className="font-semibold text-brand-dark">Attendance (30 Days)</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Present</span><span className="font-semibold text-green-600">{data.attendance.present}</span></div>
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Absent</span><span className="font-semibold text-red-600">{data.attendance.absent}</span></div>
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Late</span><span className="font-semibold text-amber-600">{data.attendance.late}</span></div>
            <div className="flex justify-between"><span className="text-sm text-brand-gray">Attendance Rate</span><span className="font-semibold text-brand-dark">{data.attendance.rate}%</span></div>
            <div className="w-full bg-brand-light rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.attendance.rate}%` }} /></div>
          </div>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card className="mb-6">
        <h2 className="font-semibold text-brand-dark mb-4">Enrolment by Grade</h2>
        <div className="space-y-2">
          {data.gradeDistribution.map((g) => (
            <div key={g.name} className="flex items-center gap-3">
              <span className="text-sm text-brand-dark w-20">{g.name}</span>
              <div className="flex-1 bg-brand-light rounded-full h-4">
                <div className="bg-brand-red h-4 rounded-full flex items-center justify-end pr-2" style={{ width: `${(g.count / maxGradeCount) * 100}%` }}>
                  {g.count > 0 && <span className="text-[10px] text-white font-medium">{g.count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-brand-dark mb-4">Recent Admissions</h2>
          {data.recentActivity.admissions.length === 0 ? (
            <p className="text-sm text-brand-gray">No recent admissions</p>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.admissions.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1 border-b border-brand-mid/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{a.parentName}</p>
                    <p className="text-xs text-brand-gray">{a.grade}</p>
                  </div>
                  <Badge variant={a.status === "NEW" ? "info" : a.status === "ENROLLED" ? "success" : "default"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-brand-dark mb-4">Recent Payments</h2>
          {data.recentActivity.payments.length === 0 ? (
            <p className="text-sm text-brand-gray">No recent payments</p>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b border-brand-mid/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{p.studentName}</p>
                    <p className="text-xs text-brand-gray">{p.invoiceNumber}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
