"use client";

import { useState, useEffect } from "react";
import { Card, Badge, LoadingState } from "@/components/ui";
import { Brain, AlertCircle, CheckCircle, Info, Lightbulb, TrendingUp } from "lucide-react";

interface AIInsight {
  type: "info" | "warning" | "success" | "tip";
  title: string;
  description: string;
  metric?: string;
}

interface AIData {
  insights: AIInsight[];
  metrics: {
    enrollmentByGrade: { grade: string; count: number }[];
    financialHealth: { totalInvoiced: number; totalCollected: number; overdueCount: number };
    attendanceTrend: { last7Days: { total: number; present: number; absent: number } };
    academicPerformance: { averagePercentage: number; gradeDistribution: Record<string, number> };
    admissionPipeline: { status: string; count: number }[];
  };
}

const INSIGHT_ICONS: Record<string, any> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  tip: Lightbulb,
};

const INSIGHT_COLORS: Record<string, string> = {
  info: "border-blue-200 bg-blue-50",
  warning: "border-amber-200 bg-amber-50",
  success: "border-green-200 bg-green-50",
  tip: "border-purple-200 bg-purple-50",
};

const INSIGHT_ICON_COLORS: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-amber-500",
  success: "text-green-500",
  tip: "text-purple-500",
};

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AIInsightsPage() {
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ai")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load AI insights"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;
  if (!data) return null;

  const { metrics } = data;
  const maxGradeCount = Math.max(...metrics.enrollmentByGrade.map((g) => g.count), 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-brand-red" />
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">AI School Intelligence</h1>
          <p className="text-sm text-brand-gray">Automated insights and recommendations</p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-brand-dark">Key Insights</h2>
        {data.insights.map((insight, idx) => {
          const Icon = INSIGHT_ICONS[insight.type] || Info;
          return (
            <Card key={idx} className={`border-l-4 ${INSIGHT_COLORS[insight.type]}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${INSIGHT_ICON_COLORS[insight.type]}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-brand-dark">{insight.title}</h3>
                    {insight.metric && <Badge>{insight.metric}</Badge>}
                  </div>
                  <p className="text-sm text-brand-gray mt-1">{insight.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{metrics.financialHealth.overdueCount}</p>
          <p className="text-xs text-brand-gray">Overdue Invoices</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{metrics.academicPerformance.averagePercentage}%</p>
          <p className="text-xs text-brand-gray">Avg Performance</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{metrics.attendanceTrend.last7Days.present}</p>
          <p className="text-xs text-brand-gray">Present (7 Days)</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{metrics.attendanceTrend.last7Days.absent}</p>
          <p className="text-xs text-brand-gray">Absent (7 Days)</p>
        </Card>
      </div>

      {/* Financial Health */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-red" />
          <h2 className="font-semibold text-brand-dark">Financial Health</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-brand-dark">{formatCurrency(metrics.financialHealth.totalInvoiced)}</p>
            <p className="text-xs text-brand-gray">Total Invoiced</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{formatCurrency(metrics.financialHealth.totalCollected)}</p>
            <p className="text-xs text-brand-gray">Collected</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">{formatCurrency(metrics.financialHealth.totalInvoiced - metrics.financialHealth.totalCollected)}</p>
            <p className="text-xs text-brand-gray">Outstanding</p>
          </div>
        </div>
      </Card>

      {/* Grade Distribution */}
      <Card className="mb-6">
        <h2 className="font-semibold text-brand-dark mb-4">Enrolment Distribution</h2>
        <div className="space-y-2">
          {metrics.enrollmentByGrade.map((g) => (
            <div key={g.grade} className="flex items-center gap-3">
              <span className="text-sm text-brand-dark w-20">{g.grade}</span>
              <div className="flex-1 bg-brand-light rounded-full h-4">
                <div className="bg-brand-red h-4 rounded-full flex items-center justify-end pr-2" style={{ width: `${(g.count / maxGradeCount) * 100}%` }}>
                  {g.count > 0 && <span className="text-[10px] text-white font-medium">{g.count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grade Distribution (Academic) */}
      <Card>
        <h2 className="font-semibold text-brand-dark mb-4">Academic Grade Distribution</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(metrics.academicPerformance.gradeDistribution).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => (
            <div key={grade} className="text-center">
              <p className="text-2xl font-bold text-brand-dark">{count}</p>
              <p className="text-sm font-medium text-brand-gray">{grade}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
