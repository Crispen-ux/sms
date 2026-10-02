"use client";

import { useState, useEffect } from "react";
import { Card, Select, Badge, LoadingState, Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui";
import { AlertCircle, DollarSign } from "lucide-react";

interface InvoiceItem { description: string; amount: number; quantity: number; }
interface Payment { amount: number; method: string; reference: string | null; paidAt: string; }
interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: string;
  dueDate: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
}

interface StudentInvoices {
  student: { id: string; firstName: string; lastName: string };
  totalOwed: number;
  invoices: Invoice[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  PARTIAL: "info",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "default",
};

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ParentInvoicesPage() {
  const [data, setData] = useState<StudentInvoices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [viewing, setViewing] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch("/api/parent/invoices")
      .then((r) => r.json())
      .then((d) => {
        setData(d.students || []);
        if (d.students?.length > 0) setSelectedStudent(d.students[0].student.id);
      })
      .catch(() => setError("Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;

  const current = data.find((d) => d.student.id === selectedStudent);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Invoices</h1>

      {data.length === 0 ? (
        <Card><p className="text-brand-gray text-center py-8">No invoices found.</p></Card>
      ) : (
        <>
          {data.length > 1 && (
            <Card className="mb-6">
              <Select
                label="Select Child"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={data.map((d) => ({ value: d.student.id, label: `${d.student.firstName} ${d.student.lastName}` }))}
              />
            </Card>
          )}

          {current && (
            <>
              <Card className="mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-brand-red" />
                  <div>
                    <p className="text-sm text-brand-gray">Total Outstanding</p>
                    <p className={`text-2xl font-bold ${current.totalOwed > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(current.totalOwed)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card padding={false}>
                {current.invoices.length === 0 ? (
                  <p className="text-brand-gray text-center py-8">No invoices yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell className="font-semibold text-brand-dark">Invoice #</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Amount</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Paid</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Balance</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                        <TableCell className="font-semibold text-brand-dark">Due Date</TableCell>
                        <TableCell>{" "}</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {current.invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm text-brand-dark">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-brand-dark">{formatCurrency(inv.totalAmount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(inv.totalPaid)}</TableCell>
                          <TableCell className={inv.balance > 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(inv.balance)}</TableCell>
                          <TableCell><Badge variant={STATUS_COLORS[inv.status] as any || "default"}>{inv.status}</Badge></TableCell>
                        <TableCell className="text-brand-gray text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-ZA") : "—"}</TableCell>
                        <TableCell><button onClick={() => setViewing(inv)} className="text-brand-red text-xs hover:underline">View</button></TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* Invoice detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewing(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-brand-dark">{viewing.invoiceNumber}</h2>
              <button onClick={() => setViewing(null)} className="text-brand-gray hover:text-brand-dark">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-brand-light rounded-xl p-4 mb-4">
              <div><p className="text-xs text-brand-gray">Total</p><p className="font-bold">{formatCurrency(viewing.totalAmount)}</p></div>
              <div><p className="text-xs text-brand-gray">Paid</p><p className="font-bold text-green-600">{formatCurrency(viewing.totalPaid)}</p></div>
              <div><p className="text-xs text-brand-gray">Balance</p><p className={`font-bold ${viewing.balance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(viewing.balance)}</p></div>
            </div>

            <p className="text-sm font-medium mb-2">Items</p>
            {viewing.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1 border-b border-brand-mid/20">
                <span>{item.description} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                <span>{formatCurrency(item.amount * item.quantity)}</span>
              </div>
            ))}

            {viewing.payments.length > 0 && (
              <>
                <p className="text-sm font-medium mt-4 mb-2">Payment History</p>
                {viewing.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-brand-mid/20">
                    <div>
                      <span className="text-brand-dark">{formatCurrency(p.amount)}</span>
                      <span className="text-brand-gray ml-2">{p.method}</span>
                      {p.reference && <span className="text-brand-gray ml-2">({p.reference})</span>}
                    </div>
                    <span className="text-brand-gray">{new Date(p.paidAt).toLocaleDateString("en-ZA")}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
