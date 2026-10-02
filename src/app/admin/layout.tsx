"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  DollarSign,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  FileText,
  ShoppingBag,
  Award,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { useModules } from "@/lib/useModules";
import { useBranding } from "@/lib/useBranding";
import { moduleForPath } from "@/lib/modules";
import ModuleDisabled from "@/components/ModuleDisabled";
import DemoBanner from "@/components/DemoBanner";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    module: "users",
  },
  {
    label: "Invitations",
    href: "/admin/invitations",
    icon: Megaphone,
    module: "users",
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    module: "students",
  },
  {
    label: "Parents",
    href: "/admin/parents",
    icon: Users,
    module: "parentCentre",
  },
  {
    label: "Enrolments",
    href: "/admin/enrolments",
    icon: FileText,
    module: "students",
  },
  {
    label: "Staff",
    href: "/admin/staff",
    icon: Users,
    module: "staff",
  },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: Award,
    module: "staff",
  },
  {
    label: "Assignments",
    href: "/admin/teacher-assignments",
    icon: BookOpen,
    module: "staff",
  },
  {
    label: "Classes",
    href: "/admin/classes",
    icon: BookOpen,
    module: "students",
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: ClipboardCheck,
    module: "attendance",
  },
  {
    label: "Academics",
    href: "/admin/academics",
    icon: BookOpen,
    module: "academics",
  },
  {
    label: "Assessments",
    href: "/admin/assessments",
    icon: FileText,
    module: "academics",
  },
  {
    label: "Results",
    href: "/admin/results",
    icon: ClipboardCheck,
    module: "academics",
  },
  {
    label: "Finance",
    href: "/admin/finance",
    icon: DollarSign,
    module: "invoicing",
  },
  {
    label: "Accounting",
    href: "/admin/accounting",
    icon: DollarSign,
    module: "accounting",
  },
  {
    label: "Documents",
    href: "/admin/documents",
    icon: FileText,
    module: "reports",
  },
  {
    label: "Catalogue",
    href: "/admin/catalogue",
    icon: ShoppingBag,
    module: "shop",
  },
  {
    label: "Admissions",
    href: "/admin/admissions",
    icon: Megaphone,
    module: "admissions",
  },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    module: "communication",
  },
  {
    label: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
    module: "communication",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: LayoutDashboard,
    module: "insights",
  },
  {
    label: "AI Insights",
    href: "/admin/ai",
    icon: Settings,
    module: "insights",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    module: "settings",
  },
  {
    label: "Audit Log",
    href: "/admin/audit",
    icon: FileText,
    module: "audit",
  },
];

// ─── Notification Bell Component ────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
      setNotifications(data.notifications || []);
    } catch {}
  };

  const toggle = async () => {
    if (!open) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
    setOpen(!open);
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 hover:bg-brand-light rounded-xl">
        <Bell className="w-5 h-5 text-brand-dark" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-brand-dark text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-red hover:underline">Mark all read</button>
              )}
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="p-8 text-center text-sm text-brand-gray">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-brand-gray">No notifications</div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div key={n.id} className={`p-4 border-b last:border-0 ${n.read ? "" : "bg-brand-red/5"}`}>
                    <p className="text-sm font-medium text-brand-dark">{n.title}</p>
                    <p className="text-xs text-brand-gray mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-brand-gray/50 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("en-ZA")} {new Date(n.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-brand-dark text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-8 h-8 rounded-lg object-contain bg-white"
                />
              ) : (
                <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {schoolName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{schoolName}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Admin Portal</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {visibleNav.map((item) => {
              // Dashboard ("/admin") must match exactly — every admin route
              // starts with "/admin/", otherwise it stays highlighted everywhere.
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-red text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-white/10">
            <Link
              href="/admin/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all mb-1"
            >
              <User className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm">{user?.name || "User"}</p>
                <p className="text-[10px] text-white/40">{ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}</p>
              </div>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <DemoBanner />
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-brand-mid/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-brand-light rounded-xl"
            >
              <Menu className="w-5 h-5 text-brand-dark" />
            </button>

            <div className="hidden lg:flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-brand-gray" />
              <input
                type="text"
                placeholder="Search students, classes..."
                className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link href="/admin/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center">
                  <span className="text-brand-red text-sm font-semibold">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-brand-dark hidden sm:block">
                  {user?.name || "User"}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {isBlocked && blockedModuleId ? (
            <ModuleDisabled
              moduleId={blockedModuleId}
              portalRoot="/admin"
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
