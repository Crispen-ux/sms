import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("accounting.read");
  if (error) return error;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalIncome, totalExpenses, outstanding, expenseBreakdown, monthlyData] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true } }),
    db.expense.aggregate({ _sum: { amount: true } }),
    db.$queryRaw`
      SELECT COALESCE(SUM(i."totalAmount"), 0) - COALESCE((
        SELECT COALESCE(SUM(p."amount"), 0)
        FROM "Payment" p
        WHERE p."invoiceId" IN (
          SELECT id FROM "Invoice" WHERE status IN ('PENDING', 'OVERDUE')
        )
      ), 0) AS outstanding
      FROM "Invoice" i
      WHERE i.status IN ('PENDING', 'OVERDUE')
    `,
    db.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    db.$queryRaw`
      SELECT
        TO_CHAR(d.date, 'YYYY-MM') AS month,
        COALESCE(p.income, 0) AS income,
        COALESCE(e.expenses, 0) AS expenses
      FROM generate_series(
        ${sixMonthsAgo}::date,
        ${now}::date,
        '1 month'::interval
      ) AS d(date)
      LEFT JOIN LATERAL (
        SELECT SUM(pay."amount") AS income
        FROM "Payment" pay
        WHERE TO_CHAR(pay."paidAt", 'YYYY-MM') = TO_CHAR(d.date, 'YYYY-MM')
      ) p ON true
      LEFT JOIN LATERAL (
        SELECT SUM(ex."amount") AS expenses
        FROM "Expense" ex
        WHERE TO_CHAR(ex."date", 'YYYY-MM') = TO_CHAR(d.date, 'YYYY-MM')
      ) e ON true
      ORDER BY d.date ASC
    `,
  ]);

  const incomeTotal = Number(totalIncome._sum.amount ?? 0);
  const expensesTotal = Number(totalExpenses._sum.amount ?? 0);
  const outstandingTotal = Number((outstanding as any)?.[0]?.outstanding ?? 0);

  const monthlyTrend = (monthlyData as any[]).map((m) => ({
    month: m.month,
    income: Number(m.income ?? 0),
    expenses: Number(m.expenses ?? 0),
    net: Number(m.income ?? 0) - Number(m.expenses ?? 0),
  }));

  return NextResponse.json({
    totalIncome: incomeTotal,
    totalExpenses: expensesTotal,
    net: incomeTotal - expensesTotal,
    outstanding: outstandingTotal,
    expenseBreakdown: expenseBreakdown.map((e) => ({
      category: e.category,
      total: Number(e._sum.amount ?? 0),
    })),
    monthlyTrend,
  });
}
