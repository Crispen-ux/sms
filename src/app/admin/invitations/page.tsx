"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Badge,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Mail, Plus, Trash2, Copy, CheckCircle, AlertCircle, Send } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy: { name: string; email: string };
}

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "Teacher",
  PARENT: "Parent",
  SCHOOL_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
};

export default function InvitationsPage() {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invitations");
      const data = await res.json();
      setInvitations(data.invitations);
    } catch {
      setError("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data: { email: string; role: string }) => {
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSuccess("Invitation created");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    try {
      await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      toast("Invitation cancelled");
      fetchData();
    } catch {
      toast("Failed to cancel", "error");
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendEmail = async (invitationId: string) => {
    try {
      const res = await fetch("/api/email/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Invitation email sent");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to send email");
      setTimeout(() => setError(""), 3000);
    }
  };

  const pending = invitations.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date());
  const accepted = invitations.filter((i) => i.acceptedAt);
  const expired = invitations.filter((i) => !i.acceptedAt && new Date(i.expiresAt) <= new Date());

  return (
    <div>
      <PageHeader
        title="Invitations"
        description="Invite teachers, parents, or admins to create accounts."
        action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Send Invitation</Button>}
      />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-brand-dark">{pending.length}</p>
          <p className="text-xs text-brand-gray">Pending</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{accepted.length}</p>
          <p className="text-xs text-brand-gray">Accepted</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{expired.length}</p>
          <p className="text-xs text-brand-gray">Expired</p>
        </Card>
      </div>

      {/* Invitation List */}
      <Card padding={false}>
        {loading ? <LoadingState /> : invitations.length === 0 ? (
          <EmptyState icon={<Mail className="w-6 h-6 text-brand-gray" />} title="No invitations" description="Send your first invitation to get started." />
        ) : (
          <div className="divide-y divide-brand-mid/20">
            {invitations.map((inv) => {
              const isExpired = !inv.acceptedAt && new Date(inv.expiresAt) <= new Date();
              const isAccepted = !!inv.acceptedAt;
              return (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-brand-dark truncate">{inv.email}</p>
                      <Badge>{ROLE_LABELS[inv.role] || inv.role}</Badge>
                      {isAccepted ? <Badge variant="success">Accepted</Badge> : isExpired ? <Badge variant="danger">Expired</Badge> : <Badge variant="info">Pending</Badge>}
                    </div>
                    <p className="text-xs text-brand-gray mt-0.5">
                      Invited by {inv.invitedBy.name} · {new Date(inv.createdAt).toLocaleDateString("en-ZA")}
                      {isAccepted ? ` · Accepted ${new Date(inv.acceptedAt!).toLocaleDateString("en-ZA")}` : ` · Expires ${new Date(inv.expiresAt).toLocaleDateString("en-ZA")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {!isAccepted && !isExpired && (
                      <>
                        <button onClick={() => handleSendEmail(inv.id)} className="p-2 hover:bg-brand-light rounded-lg" title="Send email"><Send className="w-4 h-4 text-brand-red" /></button>
                        <button onClick={() => copyLink(inv.token)} className="p-2 hover:bg-brand-light rounded-lg" title="Copy invite link">
                          {copied === inv.token ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-brand-gray" />}
                        </button>
                        <button onClick={() => setConfirmDelete(inv.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Cancel"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCreate && <CreateModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} />}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Cancel Invitation"
        message="Cancel this invitation?"
        confirmLabel="Cancel"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CreateModal({ onSubmit, onClose }: { onSubmit: (d: any) => void; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEACHER");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-lg font-semibold text-brand-dark mb-6">Send Invitation</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ email, role }); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-brand-dark mb-1 block">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-brand-mid/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-dark mb-1 block">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-brand-mid/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20">
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
              <option value="SCHOOL_ADMIN">School Admin</option>
              <option value="PRINCIPAL">Principal</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Send Invitation</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
