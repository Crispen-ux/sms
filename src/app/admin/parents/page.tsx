"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, Users, Edit, Trash2, X, AlertCircle, CheckCircle, Phone, Mail, Eye } from "lucide-react";
import Link from "next/link";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  relationship: string | null;
  studentLinks: { id: string; student: { firstName: string; lastName: string; studentNumber: string | null }; isPrimary: boolean }[];
}

export default function ParentsPage() {
  const { toast } = useToast();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }) });
      const res = await fetch(`/api/parents?${params}`);
      const data = await res.json();
      setParents(data.parents);
      setTotalPages(data.totalPages);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/parents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Parent added");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/parents/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      setSuccess("Parent updated");
      setEditing(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    try {
      await fetch(`/api/parents/${id}`, { method: "DELETE" });
      toast("Parent deleted");
      fetchData();
    } catch { toast("Failed to delete", "error"); }
  };

  return (
    <div>
      <PageHeader
        title="Parents & Guardians"
        description="Manage parent and guardian records."
        action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Parent</Button>}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input type="text" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full" />
          </div>
        </div>

        {loading ? <LoadingState /> : parents.length === 0 ? (
          <EmptyState icon={<Users className="w-6 h-6 text-brand-gray" />} title="No parents found" description="Add your first parent/guardian to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Name</TableCell>
                <TableCell className="font-semibold text-brand-dark">Contact</TableCell>
                <TableCell className="font-semibold text-brand-dark">Relationship</TableCell>
                <TableCell className="font-semibold text-brand-dark">Children</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parents.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-brand-dark">{p.firstName} {p.lastName}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-xs text-brand-gray flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</p>
                      {p.email && <p className="text-xs text-brand-gray flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{p.relationship ? <Badge>{p.relationship}</Badge> : <span className="text-brand-gray">—</span>}</TableCell>
                  <TableCell>
                    {p.studentLinks.length === 0 ? (
                      <span className="text-brand-gray text-xs">No children linked</span>
                    ) : (
                      <div className="space-y-0.5">
                        {p.studentLinks.map((sl) => (
                          <div key={sl.id} className="flex items-center gap-1 text-xs">
                            <span className="text-brand-dark">{sl.student ? `${sl.student.firstName} ${sl.student.lastName}` : "—"}</span>
                            {sl.isPrimary && <Badge variant="success">Primary</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/parents/${p.id}`} className="p-2 hover:bg-brand-light rounded-lg"><Eye className="w-4 h-4 text-brand-gray" /></Link>
                      <button onClick={() => setEditing(p)} className="p-2 hover:bg-brand-light rounded-lg"><Edit className="w-4 h-4 text-brand-gray" /></button>
                      <button onClick={() => setConfirmDelete(p.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
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

      {(showCreate || editing) && (
        <ParentModal parent={editing} onSubmit={editing ? handleUpdate : handleCreate} onClose={() => { setShowCreate(false); setEditing(null); setError(""); }} />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Parent"
        message="Delete this parent record?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function ParentModal({ parent, onSubmit, onClose }: { parent: any; onSubmit: (d: any) => void; onClose: () => void }) {
  const [firstName, setFirstName] = useState(parent?.firstName || "");
  const [lastName, setLastName] = useState(parent?.lastName || "");
  const [phone, setPhone] = useState(parent?.phone || "");
  const [email, setEmail] = useState(parent?.email || "");
  const [relationship, setRelationship] = useState(parent?.relationship || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">{parent ? "Edit Parent" : "Add Parent"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ firstName, lastName, phone, email: email || undefined, relationship: relationship || undefined }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27..." required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
          <Select label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} options={[{ value: "Mother", label: "Mother" }, { value: "Father", label: "Father" }, { value: "Guardian", label: "Guardian" }, { value: "Other", label: "Other" }]} placeholder="Select" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{parent ? "Save" : "Add Parent"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
