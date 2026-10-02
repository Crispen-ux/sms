"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, DollarSign, Edit, Trash2, X, AlertCircle, CheckCircle, CreditCard, FileText, Mail, Repeat, Bell, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";

type Tab = "fees" | "invoices" | "payments" | "recurring";

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  active: boolean;
  grade: { name: string };
  academicYear: { name: string; active: boolean };
  _count: { invoices: number };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  student: { firstName: string; lastName: string; studentNumber: string | null };
  academicYear: { name: string };
  items: { description: string; amount: number; quantity: number }[];
}

interface Grade { id: string; name: string; }
interface AcademicYear { id: string; name: string; active: boolean; }
interface Student { id: string; firstName: string; lastName: string; studentNumber: string | null; }

const STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  PARTIAL: "info",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "default",
};

const FREQ_LABELS: Record<string, string> = {
  ONCE_OFF: "Once-off",
  MONTHLY: "Monthly",
  TERM: "Per Term",
  ANNUAL: "Annual",
};

const PAYMENT_METHODS = [
  { value: "EFT", label: "EFT" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "DEBIT_ORDER", label: "Debit Order" },
  { value: "OTHER", label: "Other" },
];

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("invoices");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <div>
      <PageHeader title="Finance" description="Manage fee structures, invoices, and payments." />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-brand-light rounded-xl p-1 w-fit">
        {([["invoices", "Invoices", FileText], ["fees", "Fee Structures", DollarSign], ["payments", "Record Payment", CreditCard], ["recurring", "Recurring", Repeat]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white text-brand-dark shadow-sm" : "text-brand-gray hover:text-brand-dark"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "fees" && <FeesTab setError={setError} setSuccess={setSuccess} />}
      {tab === "invoices" && <InvoicesTab setError={setError} setSuccess={setSuccess} />}
      {tab === "payments" && <PaymentsTab setError={setError} setSuccess={setSuccess} />}
      {tab === "recurring" && <RecurringTab setError={setError} setSuccess={setSuccess} />}
    </div>
  );
}

function FeesTab({ setError, setSuccess }: { setError: (s: string) => void; setSuccess: (s: string) => void }) {
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [confirmDeleteFee, setConfirmDeleteFee] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, gRes, yRes] = await Promise.all([
        fetch("/api/fee-structures?limit=200"),
        fetch("/api/grades?limit=100"),
        fetch("/api/academic-years?limit=100"),
      ]);
      setFees((await fRes.json()).fees);
      setGrades((await gRes.json()).grades);
      setYears((await yRes.json()).years);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/fee-structures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Fee structure created");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteFee(null);
    try {
      await fetch(`/api/fee-structures/${id}`, { method: "DELETE" });
      toast("Fee structure deleted");
      fetchData();
    } catch { toast("Failed to delete", "error"); }
  };

  return (
    <Card padding={false}>
      <div className="p-4 border-b border-brand-mid/30 flex justify-between items-center">
        <p className="text-sm text-brand-gray">{fees.length} fee structures</p>
        <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />} size="sm">Add Fee</Button>
      </div>

      {loading ? <LoadingState /> : fees.length === 0 ? (
        <EmptyState icon={<DollarSign className="w-6 h-6 text-brand-gray" />} title="No fee structures" description="Create fee structures to start invoicing." />
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableCell className="font-semibold text-brand-dark">Name</TableCell>
            <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
            <TableCell className="font-semibold text-brand-dark">Amount</TableCell>
            <TableCell className="font-semibold text-brand-dark">Frequency</TableCell>
            <TableCell className="font-semibold text-brand-dark">Year</TableCell>
            <TableCell className="font-semibold text-brand-dark">Status</TableCell>
            <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
          </TableRow></TableHeader>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium text-brand-dark">{f.name}</TableCell>
                <TableCell><Badge variant="info">{f.grade.name}</Badge></TableCell>
                <TableCell className="text-brand-dark font-semibold">{formatCurrency(Number(f.amount))}</TableCell>
                <TableCell><Badge>{FREQ_LABELS[f.frequency] || f.frequency}</Badge></TableCell>
                <TableCell className="text-brand-gray">{f.academicYear.name}</TableCell>
                <TableCell>{f.active ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge>}</TableCell>
                <TableCell className="text-right">
                  <button onClick={() => setConfirmDeleteFee(f.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <FeeModal grades={grades} years={years} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />}

      <ConfirmModal
        open={confirmDeleteFee !== null}
        title="Delete Fee Structure"
        message="Delete this fee structure?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDeleteFee!)}
        onCancel={() => setConfirmDeleteFee(null)}
      />
    </Card>
  );
}

function InvoicesTab({ setError, setSuccess }: { setError: (s: string) => void; setSuccess: (s: string) => void }) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }), ...(statusFilter !== "ALL" && { status: statusFilter }) });
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices);
      setTotalPages(data.totalPages);
    } catch { setError("Failed to load invoices"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch overdue count
  useEffect(() => {
    fetch("/api/invoices/reminders")
      .then((r) => r.json())
      .then((d) => setOverdueCount(d.total || 0))
      .catch(() => {});
  }, []);

  const handleSendReminders = async () => {
    if (!confirm(`Send payment reminders to all ${overdueCount} overdue invoices?`)) return;
    setSendingReminders(true);
    try {
      const res = await fetch("/api/invoices/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Reminders sent: ${data.sent} of ${data.total} invoices`);
      setTimeout(() => setSuccess(""), 4000);
      fetchData();
    } catch (e: any) {
      setError(e.message || "Failed to send reminders");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSendingReminders(false);
    }
  };

  const handleExportInvoices = () => {
    const rows = invoices.map((inv) => ({
      "Invoice Number": inv.invoiceNumber,
      "Student": inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "—",
      "Total Amount": inv.totalAmount,
      "Paid": inv.totalPaid,
      "Balance": inv.balance,
      "Status": inv.status,
      "Due Date": inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-ZA") : "",
      "Created": new Date(inv.createdAt).toLocaleDateString("en-ZA"),
    }));
    downloadCSV(rows, "invoices");
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteInvoice(null);
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      toast("Invoice deleted");
      fetchData();
    } catch { toast("Failed to delete", "error"); }
  };

  const handleEmailInvoice = async (invoiceId: string) => {
    const to = prompt("Enter recipient email address:");
    if (!to) return;
    try {
      const res = await fetch("/api/email/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Invoice emailed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to send email");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Invoice #, student name..." />
          </div>
          <div className="w-40">
            <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "PARTIAL", label: "Partial" },
                { value: "PAID", label: "Paid" },
                { value: "OVERDUE", label: "Overdue" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />
          </div>
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />} size="sm">New Invoice</Button>
          <Button variant="outline" onClick={handleExportInvoices} icon={<Download className="w-4 h-4" />} size="sm">Export CSV</Button>
          {overdueCount > 0 && (
            <Button
              variant="outline"
              onClick={handleSendReminders}
              disabled={sendingReminders}
              icon={<Bell className="w-4 h-4" />}
              size="sm"
            >
              {sendingReminders ? "Sending..." : `Remind (${overdueCount})`}
            </Button>
          )}
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingState /> : invoices.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6 text-brand-gray" />} title="No invoices" description="Create your first invoice to get started." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableCell className="font-semibold text-brand-dark">Invoice #</TableCell>
              <TableCell className="font-semibold text-brand-dark">Student</TableCell>
              <TableCell className="font-semibold text-brand-dark">Amount</TableCell>
              <TableCell className="font-semibold text-brand-dark">Paid</TableCell>
              <TableCell className="font-semibold text-brand-dark">Balance</TableCell>
              <TableCell className="font-semibold text-brand-dark">Status</TableCell>
              <TableCell className="font-semibold text-brand-dark">Due</TableCell>
              <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm text-brand-dark">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <p className="font-medium text-brand-dark">{inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "—"}</p>
                    {inv.student.studentNumber && <p className="text-xs text-brand-gray">{inv.student.studentNumber}</p>}
                  </TableCell>
                  <TableCell className="text-brand-dark">{formatCurrency(inv.totalAmount)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(inv.totalPaid)}</TableCell>
                  <TableCell className={inv.balance > 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(inv.balance)}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[inv.status] as any || "default"}>{inv.status}</Badge></TableCell>
                  <TableCell className="text-brand-gray text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-ZA") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewing(inv)} className="p-2 hover:bg-brand-light rounded-lg"><FileText className="w-4 h-4 text-brand-gray" /></button>
                      <button onClick={() => handleEmailInvoice(inv.id)} className="p-2 hover:bg-brand-light rounded-lg" title="Email invoice"><Mail className="w-4 h-4 text-brand-red" /></button>
                      <button onClick={() => setConfirmDeleteInvoice(inv.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-mid/30">
            <span className="text-sm text-brand-gray">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && <CreateInvoiceModal onSubmit={async (data) => {
        const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        setSuccess("Invoice created");
        setShowCreate(false);
        fetchData();
      }} onClose={() => setShowCreate(false)} setError={setError} />}

      {viewing && <InvoiceDetailModal invoice={viewing} onClose={() => { setViewing(null); fetchData(); }} setError={setError} setSuccess={setSuccess} />}

      <ConfirmModal
        open={confirmDeleteInvoice !== null}
        title="Delete Invoice"
        message="Delete this invoice?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDeleteInvoice!)}
        onCancel={() => setConfirmDeleteInvoice(null)}
      />
    </>
  );
}

function PaymentsTab({ setError, setSuccess }: { setError: (s: string) => void; setSuccess: (s: string) => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("EFT");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/invoices?limit=200&status=PENDING");
        const partial = await fetch("/api/invoices?limit=200&status=PARTIAL");
        const overdue = await fetch("/api/invoices?limit=200&status=OVERDUE");
        const pData = await res.json();
        const ppData = await partial.json();
        const oData = await overdue.json();
        setInvoices([...pData.invoices, ...ppData.invoices, ...oData.invoices]);
      } catch { setError("Failed to load invoices"); }
      finally { setLoading(false); }
    };
    fetchPending();
  }, []);

  const selectedInv = invoices.find((i) => i.id === selectedInvoice);

  const handleRecord = async () => {
    if (!selectedInvoice || !amount) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method, reference: reference || undefined, notes: notes || undefined }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess(`Payment of ${formatCurrency(Number(amount))} recorded`);
      setSelectedInvoice("");
      setAmount("");
      setReference("");
      setNotes("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      {loading ? <LoadingState /> : invoices.length === 0 ? (
        <EmptyState icon={<CreditCard className="w-6 h-6 text-brand-gray" />} title="No outstanding invoices" description="All invoices are paid or there are no invoices yet." />
      ) : (
        <div className="space-y-4">
          <Select label="Select Invoice" value={selectedInvoice} onChange={(e) => { setSelectedInvoice(e.target.value); setAmount(""); }} options={invoices.map((i) => ({ value: i.id, label: `${i.invoiceNumber} — ${i.student ? `${i.student.firstName} ${i.student.lastName}` : "Unknown"} (${formatCurrency(i.balance)} outstanding)` }))} placeholder="Select an invoice" />

          {selectedInv && (
            <div className="bg-brand-light rounded-xl p-4">
              <p className="text-sm text-brand-gray">Outstanding balance</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedInv.balance)}</p>
            </div>
          )}

          <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min={0.01} step={0.01} />
          <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)} options={PAYMENT_METHODS} />
          <Input label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. EFT reference number" />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />

          <Button onClick={handleRecord} disabled={saving || !selectedInvoice || !amount} icon={<CreditCard className="w-4 h-4" />} className="w-full">
            {saving ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function FeeModal({ grades, years, onSubmit, onClose }: { grades: Grade[]; years: AcademicYear[]; onSubmit: (d: any) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");

  const activeYear = years.find((y) => y.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Fee Structure</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, gradeId, academicYearId: academicYearId || activeYear?.id, amount: Number(amount), frequency }); }} className="space-y-4">
          <Input label="Fee Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tuition Fees" required />
          <Select label="Grade" value={gradeId} onChange={(e) => setGradeId(e.target.value)} options={grades.map((g) => ({ value: g.id, label: g.name }))} placeholder="Select grade" required />
          <Select label="Academic Year" value={academicYearId || (activeYear?.id ?? "")} onChange={(e) => setAcademicYearId(e.target.value)} options={years.map((y) => ({ value: y.id, label: `${y.name}${y.active ? " (Active)" : ""}` }))} />
          <Input label="Amount (ZAR)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} step={0.01} required />
          <Select label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} options={Object.entries(FREQ_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ onSubmit, onClose, setError }: { onSubmit: (d: any) => Promise<void>; onClose: () => void; setError: (s: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [studentId, setStudentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", amount: 0, quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/students?limit=500").then((r) => r.json()),
      fetch("/api/academic-years?limit=100").then((r) => r.json()),
    ]).then(([sData, yData]) => {
      setStudents(sData.students);
      setYears(yData.years);
    });
  }, []);

  const activeYear = years.find((y) => y.active);

  const handleItemChange = (idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, { description: "", amount: 0, quantity: 1 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => sum + item.amount * (item.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await onSubmit({ studentId, academicYearId: academicYearId || activeYear?.id, dueDate: dueDate || undefined, items }); } catch (err: any) { setError(err.message); } finally { setSaving(false); } }} className="space-y-4">
          <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)} options={students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}${s.studentNumber ? ` (${s.studentNumber})` : ""}` }))} placeholder="Select student" required />
          <Select label="Academic Year" value={academicYearId || (activeYear?.id ?? "")} onChange={(e) => setAcademicYearId(e.target.value)} options={years.map((y) => ({ value: y.id, label: `${y.name}${y.active ? " (Active)" : ""}` }))} />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

          <div>
            <p className="text-sm font-medium text-brand-dark mb-2">Invoice Items</p>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} className="w-full border border-brand-mid/30 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div className="w-24">
                  <input type="number" placeholder="Amount" value={item.amount || ""} onChange={(e) => handleItemChange(idx, "amount", Number(e.target.value))} min={0} step={0.01} className="w-full border border-brand-mid/30 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div className="w-16">
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))} min={1} className="w-full border border-brand-mid/30 rounded-lg px-3 py-2 text-sm" />
                </div>
                {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem} icon={<Plus className="w-3 h-3" />}>Add Item</Button>
            <p className="text-right text-sm font-semibold text-brand-dark mt-2">Total: {formatCurrency(total)}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Creating..." : "Create Invoice"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceDetailModal({ invoice, onClose, setError, setSuccess }: { invoice: Invoice; onClose: () => void; setError: (s: string) => void; setSuccess: (s: string) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${invoice.id}`).then((r) => r.json()).then((data) => {
      setPayments(data.payments || []);
      setLoading(false);
    });
  }, [invoice.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">{invoice.invoiceNumber}</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-brand-gray">Student</p><p className="text-sm font-medium">{invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : "—"}</p></div>
            <div><p className="text-xs text-brand-gray">Status</p><Badge variant={STATUS_COLORS[invoice.status] as any}>{invoice.status}</Badge></div>
          </div>
          <div className="grid grid-cols-3 gap-4 bg-brand-light rounded-xl p-4">
            <div><p className="text-xs text-brand-gray">Total</p><p className="font-bold">{formatCurrency(invoice.totalAmount)}</p></div>
            <div><p className="text-xs text-brand-gray">Paid</p><p className="font-bold text-green-600">{formatCurrency(invoice.totalPaid)}</p></div>
            <div><p className="text-xs text-brand-gray">Balance</p><p className={`font-bold ${invoice.balance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(invoice.balance)}</p></div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Items</p>
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1 border-b border-brand-mid/20">
                <span>{item.description} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                <span>{formatCurrency(item.amount * item.quantity)}</span>
              </div>
            ))}
          </div>

          {payments.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Payment History</p>
              {payments.map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm py-1 border-b border-brand-mid/20">
                  <div>
                    <span className="text-brand-dark">{formatCurrency(p.amount)}</span>
                    <span className="text-brand-gray ml-2">{p.method}</span>
                    {p.reference && <span className="text-brand-gray ml-2">({p.reference})</span>}
                  </div>
                  <span className="text-brand-gray">{new Date(p.paidAt).toLocaleDateString("en-ZA")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecurringInvoice {
  id: string;
  active: boolean;
  nextDueDate: string | null;
  lastGeneratedAt: string | null;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; studentNumber: string | null };
  feeStructure: { id: string; name: string; amount: number; frequency: string; grade: { name: string } };
  academicYear: { id: string; name: string };
}

function RecurringTab({ setError, setSuccess }: { setError: (s: string) => void; setSuccess: (s: string) => void }) {
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recurring-invoices");
      const { recurringInvoices } = await res.json();
      setRecurring(recurringInvoices || []);
    } catch { setError("Failed to load recurring invoices"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/recurring-invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, active: !active } : r));
      setSuccess(`Recurring invoice ${!active ? "activated" : "deactivated"}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to toggle status"); setTimeout(() => setError(""), 3000); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/recurring-invoices/generate", { method: "POST" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setSuccess(`Generated ${data.count || 0} invoices`);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message || "Failed to generate"); setTimeout(() => setError(""), 3000); }
    finally { setGenerating(false); }
  };

  const handleCreate = async (data: { feeStructureId: string; studentId: string; academicYearId: string; nextDueDate: string }) => {
    try {
      const res = await fetch("/api/recurring-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Recurring invoice created");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  return (
    <>
      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30 flex justify-between items-center">
          <p className="text-sm text-brand-gray">{recurring.length} recurring invoices</p>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={generating} icon={<Repeat className="w-4 h-4" />} variant="outline" size="sm">
              {generating ? "Generating..." : "Generate Now"}
            </Button>
            <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />} size="sm">Create Recurring</Button>
          </div>
        </div>

        {loading ? <LoadingState /> : recurring.length === 0 ? (
          <EmptyState icon={<Repeat className="w-6 h-6 text-brand-gray" />} title="No recurring invoices" description="Set up recurring billing schedules for students." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableCell className="font-semibold text-brand-dark">Student</TableCell>
              <TableCell className="font-semibold text-brand-dark">Fee Structure</TableCell>
              <TableCell className="font-semibold text-brand-dark">Amount</TableCell>
              <TableCell className="font-semibold text-brand-dark">Frequency</TableCell>
              <TableCell className="font-semibold text-brand-dark">Last Generated</TableCell>
              <TableCell className="font-semibold text-brand-dark">Next Due</TableCell>
              <TableCell className="font-semibold text-brand-dark">Status</TableCell>
              <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
            </TableRow></TableHeader>
            <TableBody>
              {recurring.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium text-brand-dark">{r.student ? `${r.student.firstName} ${r.student.lastName}` : "—"}</p>
                    {r.student?.studentNumber && <p className="text-xs text-brand-gray">{r.student.studentNumber}</p>}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-brand-dark">{r.feeStructure.name}</p>
                    <Badge variant="info" className="mt-0.5">{r.feeStructure.grade.name}</Badge>
                  </TableCell>
                  <TableCell className="text-brand-dark font-semibold">{formatCurrency(Number(r.feeStructure.amount))}</TableCell>
                  <TableCell><Badge>{FREQ_LABELS[r.feeStructure.frequency] || r.feeStructure.frequency}</Badge></TableCell>
                  <TableCell className="text-brand-gray text-sm">{r.lastGeneratedAt ? new Date(r.lastGeneratedAt).toLocaleDateString("en-ZA") : "—"}</TableCell>
                  <TableCell className="text-brand-gray text-sm">{r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString("en-ZA") : "—"}</TableCell>
                  <TableCell>
                    <button onClick={() => handleToggle(r.id, r.active)} className="focus:outline-none">
                      {r.active ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge>}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => handleToggle(r.id, r.active)} className="p-2 hover:bg-brand-light rounded-lg" title={r.active ? "Deactivate" : "Activate"}>
                      {r.active ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-brand-gray" />}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showCreate && <CreateRecurringModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} setError={setError} />}
    </>
  );
}

function CreateRecurringModal({ onSubmit, onClose, setError }: { onSubmit: (d: any) => void; onClose: () => void; setError: (s: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [studentId, setStudentId] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/students?limit=500").then((r) => r.json()),
      fetch("/api/fee-structures?limit=200").then((r) => r.json()),
      fetch("/api/academic-years?limit=100").then((r) => r.json()),
    ]).then(([sData, fData, yData]) => {
      setStudents(sData.students);
      setFees(fData.fees);
      setYears(yData.years);
    });
  }, []);

  const activeYear = years.find((y) => y.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Recurring Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await onSubmit({ feeStructureId, studentId, academicYearId: academicYearId || activeYear?.id, nextDueDate }); } finally { setSaving(false); } }} className="space-y-4">
          <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)} options={students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}${s.studentNumber ? ` (${s.studentNumber})` : ""}` }))} placeholder="Select student" required />
          <Select label="Fee Structure" value={feeStructureId} onChange={(e) => setFeeStructureId(e.target.value)} options={fees.filter((f) => f.active).map((f) => ({ value: f.id, label: `${f.name} — ${formatCurrency(Number(f.amount))} (${FREQ_LABELS[f.frequency] || f.frequency})` }))} placeholder="Select fee structure" required />
          <Select label="Academic Year" value={academicYearId || (activeYear?.id ?? "")} onChange={(e) => setAcademicYearId(e.target.value)} options={years.map((y) => ({ value: y.id, label: `${y.name}${y.active ? " (Active)" : ""}` }))} />
          <Input label="Next Due Date" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
