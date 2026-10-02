"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [invitation, setInvitation] = useState<{ email: string; role: string } | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((data) => setSchoolName(data?.school?.name ?? null))
      .catch(() => setSchoolName(null));
  }, []);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setVerifying(false);
      return;
    }

    fetch(`/api/invitations/accept/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setInvitation({ email: data.email, role: data.role });
        } else {
          setError(data.error || "Invalid invitation");
        }
      })
      .catch(() => setError("Failed to verify invitation"))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="flex items-center gap-3 text-[#6B7280]">
          <Loader2 className="w-5 h-5 animate-spin" />
          Verifying invitation...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D10000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D10000]/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Create Account</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            You&apos;ve been invited to join {schoolName || "your school"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {invitation ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
                <input
                  type="email"
                  value={invitation.email}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 focus:border-[#D10000] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 focus:border-[#D10000] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat your password"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 focus:border-[#D10000] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D10000] hover:bg-[#A70000] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          ) : !error ? null : (
            <div className="text-center py-4">
              <p className="text-sm text-[#6B7280]">This invitation link is invalid or has expired.</p>
            </div>
          )}
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <a href="/login" className="hover:text-[#D10000] transition-colors">
            &larr; Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
          <div className="text-[#6B7280]">Loading...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
