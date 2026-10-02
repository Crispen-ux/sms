"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, PageHeader, Button, Input, Badge } from "@/components/ui";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/auth/rbac";
import { AlertCircle, CheckCircle, Lock, User } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = session?.user as any;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your account settings."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-brand-red" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-dark">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-brand-gray">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-brand-mid/30">
              <span className="text-sm text-brand-gray">Role</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user?.role as keyof typeof ROLE_COLORS] || "bg-gray-50 text-gray-700"}`}>
                {ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-brand-mid/30">
              <span className="text-sm text-brand-gray">Email</span>
              <span className="text-sm font-medium text-brand-dark">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-brand-gray">Account Status</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-dark" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-dark">Change Password</h3>
              <p className="text-xs text-brand-gray">Update your account password</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              hint="At least 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
