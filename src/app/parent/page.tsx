"use client";

import { useState, useEffect } from "react";
import { Card, Badge, LoadingState, Button } from "@/components/ui";
import {
  Users, ClipboardCheck, BookOpen, DollarSign, AlertCircle,
  GraduationCap, FileText, Download, Eye, ArrowRight, Receipt,
} from "lucide-react";
import Link from "next/link";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  gender: string | null;
  isPrimary: boolean;
  activeEnrolment: { grade: { name: string }; class: { name: string } | null; academicYear: { name: string } } | null;
}

function formatCurrency(amount: number) {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ParentDashboard() {
  const [data, setData] = useState<{ parent: any; children: Child[] } | null>(null);
  const [finance, setFinance] = useState<{ totalOutstanding: number; totalPaid: number; invoices: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/parent").then((r) => r.json()),
      fetch("/api/parent/invoices").then((r) => r.json()).catch(() => null),
    ])
      .then(([parentData, invoiceData]) => {
        setData(parentData);
        if (invoiceData) {
          const totalOutstanding = invoiceData.invoices?.reduce((sum: number, inv: any) => sum + (inv.balance || 0), 0) || 0;
          const totalPaid = invoiceData.invoices?.reduce((sum: number, inv: any) => sum + (inv.paid || 0), 0) || 0;
          setFinance({ totalOutstanding, totalPaid, invoices: invoiceData.invoices || [] });
        }
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your dashboard..." />;
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      <p className="text-sm text-red-700">{error}</p>
    </div>
  );
  if (!data) return null;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const activeChildren = data.children.filter((c) => c.activeEnrolment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{greeting}, {data.parent.firstName}</h1>
        <p className="text-brand-gray">{data.parent.relationship || "Parent"} · {data.children.length} child{data.children.length !== 1 ? "ren" : ""}</p>
      </div>

      {/* Family Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{data.children.length}</p>
          <p className="text-xs text-brand-gray">Children</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-green-600">{activeChildren.length}</p>
          <p className="text-xs text-brand-gray">Active Students</p>
        </Card>
        <Card padding className="text-center">
          <p className={`text-2xl font-bold ${finance && finance.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>
            {finance ? formatCurrency(finance.totalOutstanding) : "R0.00"}
          </p>
          <p className="text-xs text-brand-gray">Outstanding</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {finance ? formatCurrency(finance.totalPaid) : "R0.00"}
          </p>
          <p className="text-xs text-brand-gray">Paid This Year</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link href="/parent/attendance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer text-center py-4">
            <ClipboardCheck className="w-6 h-6 text-brand-red mx-auto mb-2" />
            <p className="font-medium text-brand-dark text-sm">Attendance</p>
          </Card>
        </Link>
        <Link href="/parent/results">
          <Card className="hover:shadow-md transition-shadow cursor-pointer text-center py-4">
            <BookOpen className="w-6 h-6 text-brand-red mx-auto mb-2" />
            <p className="font-medium text-brand-dark text-sm">Results</p>
          </Card>
        </Link>
        <Link href="/parent/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer text-center py-4">
            <DollarSign className="w-6 h-6 text-brand-red mx-auto mb-2" />
            <p className="font-medium text-brand-dark text-sm">Fees</p>
          </Card>
        </Link>
        <Link href="/parent/children">
          <Card className="hover:shadow-md transition-shadow cursor-pointer text-center py-4">
            <Users className="w-6 h-6 text-brand-red mx-auto mb-2" />
            <p className="font-medium text-brand-dark text-sm">My Children</p>
          </Card>
        </Link>
        <Card className="hover:shadow-md transition-shadow cursor-pointer text-center py-4 opacity-50">
          <FileText className="w-6 h-6 text-brand-gray mx-auto mb-2" />
          <p className="font-medium text-brand-gray text-sm">Documents</p>
        </Card>
      </div>

      {/* My Children */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-dark">My Children</h2>
          <Link href="/parent/children" className="text-sm text-brand-red hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.children.map((child) => (
            <Card key={child.id} padding>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center">
                    <span className="text-brand-red font-bold">{child.firstName.charAt(0)}{child.lastName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">{child.firstName} {child.lastName}</h3>
                    <p className="text-xs text-brand-gray">{child.studentNumber || "No student number"}</p>
                  </div>
                </div>
                {child.isPrimary && <Badge variant="success">Primary</Badge>}
              </div>

              {child.activeEnrolment ? (
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-brand-gray">Grade</span>
                    <span className="text-brand-dark font-medium">{child.activeEnrolment.grade.name}</span>
                  </div>
                  {child.activeEnrolment.class && (
                    <div className="flex justify-between">
                      <span className="text-brand-gray">Class</span>
                      <span className="text-brand-dark font-medium">{child.activeEnrolment.class.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-brand-gray">Year</span>
                    <span className="text-brand-dark font-medium">{child.activeEnrolment.academicYear.name}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-brand-gray mb-3">No active enrolment</p>
              )}

              <div className="flex gap-2 pt-3 border-t border-brand-mid/30">
                <Link href="/parent/results" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full" icon={<BookOpen className="w-3 h-3" />}>Results</Button>
                </Link>
                <Link href="/parent/attendance" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full" icon={<ClipboardCheck className="w-3 h-3" />}>Attendance</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      {finance && finance.invoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark">Recent Invoices</h2>
            <Link href="/parent/invoices" className="text-sm text-brand-red hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Card padding={false}>
            <div className="divide-y divide-brand-mid/30">
              {finance.invoices.slice(0, 3).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-brand-light/50">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{inv.invoiceNumber}</p>
                    <p className="text-xs text-brand-gray">{inv.student?.firstName} {inv.student?.lastName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-brand-dark">{formatCurrency(inv.totalAmount)}</p>
                    <Badge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "warning"}>
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
