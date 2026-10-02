"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth/neon-client";
import { PRODUCT } from "@/config/product";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<{ name: string; logoUrl: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((data) => setSchool(data?.school ?? null))
      .catch(() => setSchool(null));
  }, []);

  const schoolName = school?.name || PRODUCT.name;
  const demoBanner = process.env.NEXT_PUBLIC_DEMO_BANNER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        // Use callbackUrl if present (from middleware redirect), otherwise default to /admin
        // Use window.location.href to force full reload so session cookie is available
        window.location.href = callbackUrl || "/admin";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          {school?.logoUrl ? (
            <img
              src={school.logoUrl}
              alt={schoolName}
              className="w-14 h-14 object-contain mx-auto mb-4"
            />
          ) : (
            <div className="w-14 h-14 bg-[#D10000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D10000]/20">
              <span className="text-white text-2xl font-bold">{schoolName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{schoolName}</h1>
          <p className="text-sm text-[#6B7280] mt-1">Sign in to your portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB]">
          {demoBanner && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-5 text-center text-sm font-medium text-amber-900">
              {demoBanner}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 focus:border-[#D10000] transition-colors placeholder:text-[#9CA3AF]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1A1A1A]">Password</label>
                <a href="/forgot-password" className="text-xs text-[#D10000] hover:text-[#A70000] transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 focus:border-[#D10000] transition-colors placeholder:text-[#9CA3AF]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D10000] hover:bg-[#A70000] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {authClient && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-[#9CA3AF]">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => authClient!.signIn.social({ provider: "google" })}
                className="w-full flex items-center justify-center gap-2.5 border border-[#D1D5DB] rounded-xl py-2.5 px-4 text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <a href="/" className="hover:text-[#D10000] transition-colors">
            &larr; Back to website
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
          <div className="text-[#6B7280]">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
