"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Search, AlertCircle, CheckCircle, Eye, Trash2, X, Phone, Mail, Calendar, ExternalLink } from "lucide-react";

interface Admission {
  id: string;
  parentName: string;
  phone: string;
  email: string | null;
  childName: string | null;
  grade: string;
  preferredContact: string;
  schoolVisitRequested: boolean;
  message: string | null;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
  CONTACTED: { label: "Contacted", color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
  IN_PROGRESS: { label: "In Progress", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  ACCEPTED: { label: "Accepted", color: "text-green-700", bg: "bg-green-100 border-green-200" },
  ENROLLED: { label: "Enrolled", color: "text-green-700", bg: "bg-green-100 border-green-200" },
  CLOSED: { label: "Closed", color: "text-gray-700", bg: "bg-gray-100 border-gray-200" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  AI_ASSISTANT: "AI Assistant",
  WHATSAPP: "WhatsApp",
  PHONE: "Phone",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  OTHER: "Other",
};

const STATUS_FLOW = ["NEW", "CONTACTED", "IN_PROGRESS", "ACCEPTED", "ENROLLED", "CLOSED"];

export default function AdmissionsAdminPage() {
  const { toast } = useToast();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewing, setViewing] = useState<Admission | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(sourceFilter !== "ALL" && { source: sourceFilter }),
      });
      const res = await fetch(`/api/admissions?${params}`);
      const data = await res.json();
      setAdmissions(data.admissions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { setError("Failed to load admissions"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, sourceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusUpdate = async (id: string, status: string, notes?: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSuccess(`Status updated to ${STATUS_CONFIG[status]?.label || status}`);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to update status"); setTimeout(() => setError(""), 3000); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    try {
      await fetch(`/api/admissions/${id}`, { method: "DELETE" });
      toast("Admission deleted");
      fetchData();
    } catch { toast("Failed to delete", "error"); }
  };

  const advanceStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  // Count by status for the summary
  const statusCounts = admissions.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader
        title="Admissions"
        description={`Manage admission enquiries. ${total} total applications.`}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Status summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {STATUS_FLOW.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
            className={`p-3 rounded-xl border text-center transition-all ${statusFilter === s ? "ring-2 ring-brand-red/20 border-brand-red" : "border-brand-mid/30 hover:border-brand-mid/50"}`}
          >
            <p className="text-lg font-bold text-brand-dark">{statusCounts[s] || 0}</p>
            <p className="text-[10px] text-brand-gray uppercase tracking-wider">{STATUS_CONFIG[s]?.label || s}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Parent, child, phone, email..."
            />
          </div>
          <div className="w-40">
            <Select
              label="Source"
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              options={[
                { value: "ALL", label: "All Sources" },
                ...Object.entries(SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l })),
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { value: "ALL", label: "All Statuses" },
                ...STATUS_FLOW.map((s) => ({ value: s, label: STATUS_CONFIG[s]?.label || s })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? <LoadingState /> : admissions.length === 0 ? (
          <EmptyState icon={<Search className="w-6 h-6 text-brand-gray" />} title="No admissions found" description="No enquiries match your filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Parent</TableCell>
                <TableCell className="font-semibold text-brand-dark">Child</TableCell>
                <TableCell className="font-semibold text-brand-dark">Grade</TableCell>
                <TableCell className="font-semibold text-brand-dark">Contact</TableCell>
                <TableCell className="font-semibold text-brand-dark">Source</TableCell>
                <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                <TableCell className="font-semibold text-brand-dark">Date</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.map((a) => {
                const next = advanceStatus(a.status);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-brand-dark">{a.parentName}</TableCell>
                    <TableCell className="text-brand-gray">{a.childName || "—"}</TableCell>
                    <TableCell><Badge variant="info">{a.grade}</Badge></TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs text-brand-gray flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</p>
                        {a.email && <p className="text-xs text-brand-gray flex items-center gap-1"><Mail className="w-3 h-3" />{a.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge>{SOURCE_LABELS[a.source] || a.source}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[a.status]?.color.includes("green") ? "success" : STATUS_CONFIG[a.status]?.color.includes("red") ? "danger" : "default"}>
                        {STATUS_CONFIG[a.status]?.label || a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-brand-gray text-sm">{new Date(a.createdAt).toLocaleDateString("en-ZA")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewing(a)} className="p-2 hover:bg-brand-light rounded-lg" title="View details"><Eye className="w-4 h-4 text-brand-gray" /></button>
                        {next && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, next)}
                            disabled={updating === a.id}
                            className="p-2 hover:bg-green-50 rounded-lg"
                            title={`Advance to ${STATUS_CONFIG[next]?.label}`}
                          >
                            <ExternalLink className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button onClick={() => setConfirmDelete(a.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {/* Detail modal */}
      {viewing && (
        <AdmissionDetailModal
          admission={viewing}
          onStatusUpdate={handleStatusUpdate}
          onClose={() => setViewing(null)}
          updating={updating === viewing.id}
        />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Admission"
        message="Delete this admission record?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function AdmissionDetailModal({ admission, onStatusUpdate, onClose, updating }: {
  admission: Admission;
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
  onClose: () => void;
  updating: boolean;
}) {
  const [notes, setNotes] = useState(admission.notes || "");

  const advanceStatusLocal = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const next = advanceStatusLocal(admission.status);
  const prev = STATUS_FLOW[STATUS_FLOW.indexOf(admission.status) - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">Admission Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-gray mb-1">Parent Name</p>
              <p className="text-sm font-medium text-brand-dark">{admission.parentName}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">Child Name</p>
              <p className="text-sm font-medium text-brand-dark">{admission.childName || "Not provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-gray mb-1">Phone</p>
              <p className="text-sm font-medium text-brand-dark">{admission.phone}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">Email</p>
              <p className="text-sm font-medium text-brand-dark">{admission.email || "Not provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-brand-gray mb-1">Grade</p>
              <Badge variant="info">{admission.grade}</Badge>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">Source</p>
              <Badge>{SOURCE_LABELS[admission.source] || admission.source}</Badge>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">Preferred Contact</p>
              <p className="text-sm text-brand-dark capitalize">{admission.preferredContact}</p>
            </div>
          </div>

          {admission.schoolVisitRequested && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-sm text-blue-700 font-medium">School Visit Requested</p>
            </div>
          )}

          {admission.message && (
            <div>
              <p className="text-xs text-brand-gray mb-1">Message</p>
              <p className="text-sm text-brand-dark bg-brand-light rounded-xl p-3">{admission.message}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-brand-gray mb-1 block">Notes (internal)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-brand-mid/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
              rows={3}
              placeholder="Add internal notes..."
            />
          </div>

          <div className="flex items-center justify-between text-xs text-brand-gray pt-2 border-t border-brand-mid/20">
            <span>Created: {new Date(admission.createdAt).toLocaleString("en-ZA")}</span>
            <span>ID: {admission.id.slice(0, 12)}...</span>
          </div>

          <div className="flex gap-2 pt-2">
            {prev && (
              <Button variant="outline" size="sm" onClick={() => onStatusUpdate(admission.id, prev, notes)} disabled={updating}>
                ← {STATUS_CONFIG[prev]?.label}
              </Button>
            )}
            {next && (
              <Button size="sm" onClick={() => onStatusUpdate(admission.id, next, notes)} disabled={updating}>
                {STATUS_CONFIG[next]?.label} →
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
