"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, Users, Edit, Trash2, X, AlertCircle, CheckCircle, Mail, Phone, Eye } from "lucide-react";
import Link from "next/link";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  staffNumber: string | null;
  user: { email: string; role: string; active: boolean } | null;
  _count: { teacherClasses: number; teacherSubjects: number };
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }) });
      const res = await fetch(`/api/staff?${params}`);
      const data = await res.json();
      setStaff(data.staff);
      setTotalPages(data.totalPages);
    } catch { setError("Failed to load staff"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Staff member added");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/staff/${confirmDelete}`, { method: "DELETE" });
      toast("Staff member removed successfully");
      fetchData();
    } catch {
      toast("Failed to remove staff member", "error");
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage teaching and administrative staff."
        action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add Staff</Button>}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input type="text" placeholder="Search staff..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full" />
          </div>
        </div>

        {loading ? <LoadingState /> : staff.length === 0 ? (
          <EmptyState icon={<Users className="w-6 h-6 text-brand-gray" />} title="No staff members" description="Add your first staff member to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Name</TableCell>
                <TableCell className="font-semibold text-brand-dark">Position</TableCell>
                <TableCell className="font-semibold text-brand-dark">Contact</TableCell>
                <TableCell className="font-semibold text-brand-dark">Classes</TableCell>
                <TableCell className="font-semibold text-brand-dark">Account</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-brand-dark">{s.firstName} {s.lastName}</p>
                      {s.staffNumber && <p className="text-xs text-brand-gray">{s.staffNumber}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-brand-gray">{s.position || "—"}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {s.phone && <p className="text-xs text-brand-gray flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>}
                      {s.user?.email && <p className="text-xs text-brand-gray flex items-center gap-1"><Mail className="w-3 h-3" />{s.user.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{s._count.teacherClasses}</TableCell>
                  <TableCell>
                    {s.user ? <Badge variant={s.user.active ? "success" : "danger"}>{s.user.active ? "Linked" : "Inactive"}</Badge> : <Badge>No Account</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(s.position?.toLowerCase().includes("teacher") || s.user?.role === "TEACHER") && (
                        <Link href={`/admin/teachers/${s.id}`} className="p-2 hover:bg-brand-light rounded-lg"><Eye className="w-4 h-4 text-brand-gray" /></Link>
                      )}
                      <button onClick={() => setEditing(s)} className="p-2 hover:bg-brand-light rounded-lg"><Edit className="w-4 h-4 text-brand-gray" /></button>
                      <button onClick={() => setConfirmDelete(s.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
        <StaffModal
          staff={editing}
          onSubmit={editing ? async (d) => { await fetch(`/api/staff/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); setEditing(null); fetchData(); } : handleCreate}
          onClose={() => { setShowCreate(false); setEditing(null); setError(""); }}
        />
      )}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function StaffModal({ staff, onSubmit, onClose }: { staff: any; onSubmit: (d: any) => void; onClose: () => void }) {
  const [firstName, setFirstName] = useState(staff?.firstName || "");
  const [lastName, setLastName] = useState(staff?.lastName || "");
  const [phone, setPhone] = useState(staff?.phone || "");
  const [position, setPosition] = useState(staff?.position || "");
  const [staffNumber, setStaffNumber] = useState(staff?.staffNumber || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">{staff ? "Edit Staff" : "Add Staff"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ firstName, lastName, phone, position, staffNumber }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27..." />
          <Input label="Position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Teacher" />
          <Input label="Staff Number" value={staffNumber} onChange={(e) => setStaffNumber(e.target.value)} placeholder="e.g. TCH001" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{staff ? "Save" : "Add"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
