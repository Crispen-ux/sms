"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Filter, Edit, Trash2, X,
  AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight, BarChart3,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  outstandingBalances: number;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  reference: string | null;
  vendor: string | null;
  notes: string | null;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpensesResponse {
  expenses: Expense[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { value: "SALARIES", label: "Salaries" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  SALARIES: "bg-blue-50 text-blue-700",
  UTILITIES: "bg-amber-50 text-amber-700",
  MAINTENANCE: "bg-orange-50 text-orange-700",
  SUPPLIES: "bg-green-50 text-green-700",
  TRANSPORT: "bg-purple-50 text-purple-700",
  OTHER: "bg-gray-50 text-gray-700",
};

// ─── Helpers ────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Page ───────────────────────────────────────────────

export default function AccountingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/accounting/summary");
      const data = await res.json();
      setSummary(data);
      setMonthlyTrend(data.monthlyTrend || []);
      setCategoryBreakdown(data.categoryBreakdown || []);
    } catch {
      setError("Failed to load accounting summary");
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/expenses?${params}`);
      const data: ExpensesResponse = await res.json();
      setExpenses(data.expenses);
      setTotalExpenses(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load expenses");
    } finally {
      setExpensesLoading(false);
    }
  }, [page, categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchExpenses()]);
      setLoading(false);
    };
    load();
  }, [fetchSummary, fetchExpenses]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDeleteExpense = async () => {
    if (!confirmDeleteExpense) return;
    try {
      const res = await fetch(`/api/expenses/${confirmDeleteExpense}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      toast("Expense deleted successfully");
      fetchExpenses();
      fetchSummary();
    } catch {
      toast("Failed to delete expense", "error");
    }
    setConfirmDeleteExpense(null);
  };

  const handleSaveExpense = async (data: any) => {
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save expense");
      }
      setSuccess(editingExpense ? "Expense updated" : "Expense created");
      setShowExpenseModal(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchSummary();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div>
      <PageHeader
        title="Accounting"
        description="Financial overview, expense tracking, and reporting."
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading accounting data..." />
      ) : (
        <>
          {/* ── Summary Cards ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              title="Total Income"
              value={summary?.totalIncome ?? 0}
              icon={<ArrowUpRight className="w-5 h-5 text-green-600" />}
              trend="up"
              bgColor="bg-green-50"
            />
            <SummaryCard
              title="Total Expenses"
              value={summary?.totalExpenses ?? 0}
              icon={<ArrowDownRight className="w-5 h-5 text-red-600" />}
              trend="down"
              bgColor="bg-red-50"
            />
            <SummaryCard
              title="Net Profit"
              value={summary?.netProfit ?? 0}
              icon={<TrendingUp className="w-5 h-5 text-brand-red" />}
              trend={(summary?.netProfit ?? 0) >= 0 ? "up" : "down"}
              bgColor="bg-brand-light"
            />
            <SummaryCard
              title="Outstanding Balances"
              value={summary?.outstandingBalances ?? 0}
              icon={<DollarSign className="w-5 h-5 text-amber-600" />}
              trend="neutral"
              bgColor="bg-amber-50"
            />
          </div>

          {/* ── Monthly Trend ───────────────────────────────── */}
          {monthlyTrend.length > 0 && (
            <Card className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-brand-red" />
                <h2 className="text-lg font-semibold text-brand-dark">Monthly Trend</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-semibold text-brand-dark">Month</TableCell>
                    <TableCell className="font-semibold text-brand-dark text-right">Income</TableCell>
                    <TableCell className="font-semibold text-brand-dark text-right">Expenses</TableCell>
                    <TableCell className="font-semibold text-brand-dark text-right">Net</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTrend.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium text-brand-dark">{row.month}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(row.income)}</TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">{formatCurrency(row.expenses)}</TableCell>
                      <TableCell className={`text-right font-semibold ${row.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(row.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* ── Expense Breakdown by Category ──────────────── */}
          {categoryBreakdown.length > 0 && (
            <Card className="mb-8">
              <h2 className="text-lg font-semibold text-brand-dark mb-4">Expense Breakdown by Category</h2>
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center gap-4">
                    <div className="w-32">
                      <Badge className={CATEGORY_COLORS[item.category] || "bg-gray-50 text-gray-700"}>
                        {EXPENSE_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="h-2.5 bg-brand-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-red rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-28 text-right">
                      <span className="text-sm font-semibold text-brand-dark">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xs text-brand-gray">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Expenses Table ─────────────────────────────── */}
          <Card padding={false}>
            <div className="p-4 border-b border-brand-mid/30 flex flex-wrap items-end gap-4">
              <div className="w-44">
                <Select
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  options={[
                    { value: "ALL", label: "All Categories" },
                    ...EXPENSE_CATEGORIES,
                  ]}
                />
              </div>
              <div className="w-40">
                <Input
                  label="From"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-40">
                <Input
                  label="To"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
              <div className="ml-auto">
                <Button
                  onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
                  icon={<Plus className="w-4 h-4" />}
                  size="sm"
                >
                  Add Expense
                </Button>
              </div>
            </div>

            {expensesLoading ? (
              <LoadingState message="Loading expenses..." />
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="w-6 h-6 text-brand-gray" />}
                title="No expenses found"
                description="Record your first expense to start tracking finances."
                action={
                  <Button onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }} icon={<Plus className="w-4 h-4" />} size="sm">
                    Add Expense
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-semibold text-brand-dark">Date</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Description</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Category</TableCell>
                    <TableCell className="font-semibold text-brand-dark text-right">Amount</TableCell>
                    <TableCell className="font-semibold text-brand-dark">Reference</TableCell>
                    <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-brand-gray text-sm">{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-brand-dark">{expense.description}</p>
                        {expense.vendor && <p className="text-xs text-brand-gray">{expense.vendor}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge className={CATEGORY_COLORS[expense.category] || "bg-gray-50 text-gray-700"}>
                          {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-brand-dark">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-brand-gray text-sm">{expense.reference || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingExpense(expense); setShowExpenseModal(true); }}
                            className="p-2 hover:bg-brand-light rounded-lg"
                            title="Edit expense"
                          >
                            <Edit className="w-4 h-4 text-brand-gray" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteExpense(expense.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-brand-mid/30">
                <span className="text-sm text-brand-gray">
                  Page {page} of {totalPages} ({totalExpenses} total)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* ── Expense Modal ──────────────────────────────── */}
          {showExpenseModal && (
            <ExpenseModal
              expense={editingExpense}
              onSubmit={handleSaveExpense}
              onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
            />
          )}
          <ConfirmModal
            open={confirmDeleteExpense !== null}
            title="Delete Expense"
            message="Are you sure you want to delete this expense? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={handleDeleteExpense}
            onCancel={() => setConfirmDeleteExpense(null)}
          />
        </>
      )}
    </div>
  );
}

// ─── Summary Card ───────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon,
  trend,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  bgColor: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-brand-gray mb-1">{title}</p>
          <p className="text-2xl font-bold text-brand-dark">{formatCurrency(value)}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${bgColor}`}>{icon}</div>
      </div>
    </Card>
  );
}

// ─── Expense Modal ──────────────────────────────────────

function ExpenseModal({
  expense,
  onSubmit,
  onClose,
}: {
  expense: Expense | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState(expense?.category || "SALARIES");
  const [date, setDate] = useState(expense?.date?.split("T")[0] || new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState(expense?.reference || "");
  const [vendor, setVendor] = useState(expense?.vendor || "");
  const [notes, setNotes] = useState(expense?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      description,
      amount: Number(amount),
      category,
      date,
      reference: reference || undefined,
      vendor: vendor || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">
            {expense ? "Edit Expense" : "New Expense"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Office supplies for admin"
            required
          />
          <Input
            label="Amount (ZAR)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min={0.01}
            step={0.01}
            required
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={EXPENSE_CATEGORIES}
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Invoice or receipt number"
          />
          <Input
            label="Vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Supplier or vendor name"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-dark">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full px-4 py-2.5 bg-brand-light rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving..." : expense ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
