"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Users,
  LogOut,
  Menu,
  Bell,
  User,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { useModules } from "@/lib/useModules";
import { useBranding } from "@/lib/useBranding";
import { moduleForPath } from "@/lib/modules";
import ModuleDisabled from "@/components/ModuleDisabled";
import DemoBanner from "@/components/DemoBanner";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon; module?: string }[] = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { label: "My Classes", href: "/teacher/classes", icon: BookOpen, module: "students" },
  { label: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck, module: "attendance" },
  { label: "Results", href: "/teacher/results", icon: Users, module: "academics" },
  { label: "Messages", href: "/teacher/messages", icon: MessageSquare, module: "communication" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const { enabled, isEnabled } = useModules();
  const branding = useBranding();

  const schoolName = branding.school?.name || branding.product.name;
  const schoolLogo = branding.school?.logoUrl;
  const visibleNav = NAV_ITEMS.filter((item) =>
    item.module ? isEnabled(item.module) : true
  );
  const blockedModuleId = enabled ? moduleForPath(pathname) : null;
  const isBlocked = !!blockedModuleId && !isEnabled(blockedModuleId);

  return (
    <div className="min-h-screen bg-brand-light">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-brand-dark text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-5 border-b border-white/10">
            <Link href="/teacher" className="flex items-center gap-3">
              {schoolLogo ? (
                <img src={schoolLogo} alt={schoolName} className="w-8 h-8 rounded-lg object-contain bg-white" />
              ) : (
                <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{schoolName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{schoolName}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Teacher Portal</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/teacher" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-brand-red text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-white/10">
            <Link href="/teacher" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all mb-1">
              <User className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm">{user?.name || "Teacher"}</p>
                <p className="text-[10px] text-white/40">{ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}</p>
              </div>
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <DemoBanner />
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-brand-mid/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-brand-light rounded-xl">
              <Menu className="w-5 h-5 text-brand-dark" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-brand-light rounded-xl">
                <Bell className="w-5 h-5 text-brand-dark" />
              </button>
              <div className="w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center">
                <span className="text-brand-red text-sm font-semibold">{(user?.name || "T").charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          {isBlocked && blockedModuleId ? (
            <ModuleDisabled
              moduleId={blockedModuleId}
              portalRoot="/teacher"
              portalLabel="Dashboard"
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
