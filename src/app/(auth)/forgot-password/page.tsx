"use client";

import { useState, Suspense } from "react";
import { GraduationCap, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message || "If an account exists with that email, a reset link has been sent.");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D10000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D10000]/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Reset Password</h1>
          <p className="text-sm text-[#6B7280] mt-1">Enter your email to receive a reset link</p>
        </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 focus:border-[#D10000] transition-colors placeholder:text-[#9CA3AF]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D10000] hover:bg-[#A70000] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <a href="/login" className="hover:text-[#D10000] transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
          <div className="text-[#6B7280]">Loading...</div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
