"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  PageHeader,
  Button,
  Input,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  EmptyState,
  LoadingState,
  ConfirmModal,
  useToast,
} from "@/components/ui";
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/auth/rbac";
import type { UserRole } from "@prisma/client";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: "INVITED" | "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search && { search }),
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setSuccess("User created successfully");
      setShowCreate(false);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setSuccess("User updated successfully");
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    try {
      await fetch(`/api/users/${confirmDeactivate}`, { method: "DELETE" });
      toast("User deactivated successfully");
      fetchUsers();
    } catch {
      toast("Failed to deactivate user", "error");
    }
    setConfirmDeactivate(null);
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage admin, teacher, and parent accounts."
        action={
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
            Add User
          </Button>
        }
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

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-brand-gray" />}
            title="No users found"
            description={search ? "Try a different search term." : "Create your first user to get started."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Name</TableCell>
                <TableCell className="font-semibold text-brand-dark">Email</TableCell>
                <TableCell className="font-semibold text-brand-dark">Role</TableCell>
                <TableCell className="font-semibold text-brand-dark">Status</TableCell>
                <TableCell className="font-semibold text-brand-dark">Last Login</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <span className="font-medium text-brand-dark">{u.name || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-brand-gray">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      u.status === "ACTIVE" ? "success" :
                      u.status === "INVITED" ? "info" :
                      u.status === "PENDING_ACTIVATION" ? "warning" :
                      "danger"
                    }>
                      {u.status === "ACTIVE" ? "Active" :
                       u.status === "INVITED" ? "Invited" :
                       u.status === "PENDING_ACTIVATION" ? "Pending" :
                       u.status === "SUSPENDED" ? "Suspended" :
                       "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-brand-gray text-sm">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-2 hover:bg-brand-light rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-brand-gray" />
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(u.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate"
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
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {(showCreate || editingUser) && (
        <UserModal
          user={editingUser}
          onSubmit={editingUser ? handleUpdate : handleCreate}
          onClose={() => { setShowCreate(false); setEditingUser(null); setError(""); }}
        />
      )}
      <ConfirmModal
        open={confirmDeactivate !== null}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? They will no longer be able to log in."
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmDeactivate(null)}
      />
    </div>
  );
}

function UserModal({
  user,
  onSubmit,
  onClose,
}: {
  user: User | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role || "TEACHER");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data: any = { name, email, role };
    if (!user && password) data.password = password;
    if (user && password) data.password = password;
    onSubmit(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">
            {user ? "Edit User" : "Create User"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={user ? "New Password (leave blank to keep)" : "Password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!user}
            minLength={user ? undefined : 8}
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {user ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
