"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useInView } from "@/lib/useInView";
import { PRODUCT } from "@/config/product";
import {
  BarChart3,
  CalendarCheck,
  Check,
  LayoutDashboard,
  Receipt,
  Search,
  Settings,
  Users,
} from "lucide-react";

/**
 * Animated product tour for the marketing page: sign in → dashboard →
 * student records → attendance → invoicing, then loops.
 *
 * Purely decorative (the real product can be tried on the live demo), so the
 * window itself is aria-hidden and the captions below carry the meaning.
 * Honours prefers-reduced-motion: no auto-playing, frames switch on click.
 */

const STEP_MS = 4600;

const STEPS = [
  {
    id: "login",
    label: "Sign in",
    path: "/login",
    caption:
      "Each staff member signs in with their own account — roles decide what every person can see and change.",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin",
    caption:
      "The school at a glance: enrolment, today's attendance, fees outstanding and what has just happened.",
  },
  {
    id: "students",
    label: "Student records",
    path: "/admin/students",
    caption:
      "Search, filter and open a learner's complete record — enrolment, guardians, results and documents.",
  },
  {
    id: "attendance",
    label: "Attendance",
    path: "/admin/attendance",
    caption:
      "Mark the register in seconds and see the week's pattern without assembling a single spreadsheet.",
  },
  {
    id: "finance",
    label: "Fees & invoicing",
    path: "/admin/finance",
    caption:
      "Raise invoices, record payments and see exactly what is outstanding, per learner and per grade.",
  },
] as const;

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Students" },
  { icon: CalendarCheck, label: "Attendance" },
  { icon: Receipt, label: "Invoicing" },
  { icon: BarChart3, label: "Insights" },
  { icon: Settings, label: "Settings" },
];

const TYPED_EMAIL = "principal@springfield.edu";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

function useCountUp(target: number, still: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (still) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, still]);

  return still ? target : value;
}

/* ───────────────────────── frames ───────────────────────── */

function WindowChrome({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-mid/60 bg-brand-light px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-mid/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-mid/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-mid/30" />
      </span>
      <span className="ml-2 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-brand-gray">
        {path}
      </span>
    </div>
  );
}

function LoginFrame({ still }: { still: boolean }) {
  const sequence = TYPED_EMAIL.length + 8 + 6;
  const [frame, setFrame] = useState(still ? sequence : 0);

  useEffect(() => {
    if (still) return;
    const id = setInterval(() => {
      setFrame((f) => (f >= sequence ? f : f + 1));
    }, 60);
    return () => clearInterval(id);
  }, [still, sequence]);

  const typed = TYPED_EMAIL.slice(0, Math.min(frame, TYPED_EMAIL.length));
  const dots = "•".repeat(
    Math.max(0, Math.min(8, frame - TYPED_EMAIL.length))
  );
  const emailDone = frame >= TYPED_EMAIL.length;
  const passwordDone = frame >= TYPED_EMAIL.length + 8;
  const submitting = frame >= TYPED_EMAIL.length + 8 + 4;

  return (
    <div className="flex h-full items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-mid/60 bg-white p-6 shadow-editorial animate-scale-in">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-sm font-extrabold text-white">
            {PRODUCT.name.charAt(0)}
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              {PRODUCT.name}
            </p>
            <p className="text-xs text-brand-gray">Sign in to your school</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gray">
              Email
            </span>
            <div className="mt-1 flex h-10 items-center rounded-lg border border-brand-mid bg-white px-3 text-sm text-brand-dark">
              <span className="truncate">{typed}</span>
              {!emailDone && (
                <span
                  className="ml-px h-4 w-px bg-brand-red tour-caret"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gray">
              Password
            </span>
            <div className="mt-1 flex h-10 items-center rounded-lg border border-brand-mid bg-white px-3 text-sm text-brand-dark">
              <span>{dots}</span>
              {emailDone && !passwordDone && (
                <span
                  className="ml-px h-4 w-px bg-brand-red tour-caret"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </div>

        <div
          className={`mt-5 flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-colors ${
            submitting ? "bg-brand-dark" : "bg-brand-red"
          } ${passwordDone && !submitting ? "animate-pulse-glow" : ""}`}
        >
          {submitting ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-brand-gray">
          Roles decide what each person sees after signing in.
        </p>
      </div>
    </div>
  );
}

function AppShell({
  activeNav,
  path,
  children,
}: {
  activeNav: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full bg-brand-light">
      <aside className="hidden w-44 shrink-0 flex-col border-r border-brand-mid/60 bg-white sm:flex">
        <div className="flex items-center gap-2.5 border-b border-brand-mid/50 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red text-xs font-extrabold text-white">
            {PRODUCT.name.charAt(0)}
          </span>
          <span className="truncate text-xs font-semibold text-brand-dark">
            My School
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.map((item) => {
            const on = item.label === activeNav;
            return (
              <span
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  on
                    ? "bg-brand-red text-white"
                    : "text-brand-gray hover:bg-brand-light"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
            );
          })}
        </nav>
        <div className="border-t border-brand-mid/50 p-3 text-[10px] text-brand-gray">
          v{PRODUCT.version}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-brand-mid/60 bg-white px-4 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">
            PA
          </span>
          <span className="truncate text-xs font-semibold text-brand-dark">
            Principal Admin
          </span>
          <span className="ml-auto hidden truncate rounded-md bg-brand-light px-2 py-1 text-[10px] text-brand-gray sm:block">
            {path}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  still,
}: {
  label: string;
  value: number;
  suffix?: string;
  still: boolean;
}) {
  const n = useCountUp(value, still);
  return (
    <div className="rounded-xl border border-brand-mid/60 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold text-brand-dark">
        {n.toLocaleString("en-ZA")}
        {suffix ? <span className="text-sm font-bold">{suffix}</span> : null}
      </p>
    </div>
  );
}

function DashboardFrame({ still }: { still: boolean }) {
  const bars = [46, 62, 54, 71, 66, 88, 79];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const activity = [
    { who: "Grade 8A", what: "attendance register submitted", time: "2 min" },
    { who: "INV-2027-0142", what: "marked as paid", time: "14 min" },
    { who: "M. Adams", what: "guardian details updated", time: "1 hr" },
  ];

  return (
    <AppShell activeNav="Dashboard" path="/admin">
      <div className="flex h-full flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Learners" value={512} still={still} />
          <StatCard label="Staff" value={44} still={still} />
          <StatCard label="Attendance" value={96} suffix="%" still={still} />
          <StatCard label="Fees due" value={84300} still={still} />
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-5">
          <div className="rounded-xl border border-brand-mid/60 bg-white p-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-dark">
                Attendance this week
              </p>
              <span className="text-[10px] text-brand-gray">%</span>
            </div>
            <div className="mt-3 flex h-[calc(100%-2rem)] items-end gap-2">
              {bars.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`w-full rounded-t-md bg-brand-red/85 ${
                      still ? "" : "tour-bar"
                    }`}
                    style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                  />
                  <span className="text-[9px] text-brand-gray">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand-mid/60 bg-white p-3 lg:col-span-2">
            <p className="text-xs font-semibold text-brand-dark">
              Recent activity
            </p>
            <ul className="mt-2.5 space-y-2">
              {activity.map((row, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 ${still ? "" : "tour-row"}`}
                  style={{ animationDelay: `${300 + i * 140}ms` }}
                >
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red"
                    aria-hidden="true"
                  />
                  <p className="text-[11px] leading-snug text-brand-gray">
                    <span className="font-semibold text-brand-dark">
                      {row.who}
                    </span>{" "}
                    {row.what} · {row.time} ago
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const LEARNERS = [
  { name: "Thandi Mokoena", grade: "Grade 8A", guardian: "R. Mokoena", status: "Active" },
  { name: "Sipho Nkosi", grade: "Grade 10B", guardian: "P. Nkosi", status: "Active" },
  { name: "Lerato Dlamini", grade: "Grade 7A", guardian: "T. Dlamini", status: "Active" },
  { name: "Joshua Adams", grade: "Grade 9C", guardian: "M. Adams", status: "Pending" },
  { name: "Aisha Patel", grade: "Grade 11A", guardian: "N. Patel", status: "Active" },
];

function StudentsFrame({ still }: { still: boolean }) {
  return (
    <AppShell activeNav="Students" path="/admin/students">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-brand-mid bg-white px-3 text-xs text-brand-gray">
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Search learners, guardians, admission no…</span>
          </div>
          <span className="hidden h-8 items-center rounded-lg bg-brand-red px-3 text-xs font-semibold text-white sm:flex">
            Add learner
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-brand-mid/60 bg-white">
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.7fr] gap-2 border-b border-brand-mid/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
            <span>Learner</span>
            <span>Class</span>
            <span>Guardian</span>
            <span>Status</span>
          </div>
          <ul>
            {LEARNERS.map((l, i) => (
              <li
                key={l.name}
                className={`grid grid-cols-[1.4fr_0.8fr_1fr_0.7fr] items-center gap-2 border-b border-brand-mid/40 px-3 py-2.5 ${
                  still ? "" : "tour-row"
                }`}
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[9px] font-bold text-white">
                    {l.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <span className="truncate text-xs font-medium text-brand-dark">
                    {l.name}
                  </span>
                </span>
                <span className="truncate text-xs text-brand-gray">
                  {l.grade}
                </span>
                <span className="truncate text-xs text-brand-gray">
                  {l.guardian}
                </span>
                <span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      l.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {l.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

const PUPILS = [
  "T. Mokoena",
  "S. Nkosi",
  "L. Dlamini",
  "J. Adams",
  "A. Patel",
  "K. Zulu",
  "B. van Wyk",
  "N. Sithole",
  "D. Fourie",
  "Z. Khumalo",
  "P. Jacobs",
  "R. Naidoo",
];

function AttendanceFrame({ still }: { still: boolean }) {
  const C = 2 * Math.PI * 34;
  const present = useCountUp(96, still);

  return (
    <AppShell activeNav="Attendance" path="/admin/attendance">
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-h-0 overflow-hidden rounded-xl border border-brand-mid/60 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-mid/50 px-3 py-2">
            <p className="text-xs font-semibold text-brand-dark">
              Grade 8A · Period 1
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Register open
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-1.5 p-3">
            {PUPILS.map((name, i) => (
              <li
                key={name}
                className={`flex items-center justify-between rounded-lg border border-brand-mid/50 bg-brand-light px-2.5 py-1.5 ${
                  still ? "" : "tour-row"
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="truncate text-[11px] font-medium text-brand-dark">
                  {name}
                </span>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-brand-mid/60 bg-white p-3">
            <svg viewBox="0 0 80 80" className="h-16 w-16 shrink-0 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--color-brand-light)"
                strokeWidth="9"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--color-brand-red)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={C}
                className={still ? "" : "tour-ring"}
                style={
                  {
                    "--tour-from": C,
                    "--tour-to": C * (1 - 0.96),
                    strokeDashoffset: still ? C * (1 - 0.96) : undefined,
                  } as React.CSSProperties
                }
              />
            </svg>
            <div>
              <p className="text-xl font-extrabold text-brand-dark">
                {present}%
              </p>
              <p className="text-[11px] text-brand-gray">present today</p>
            </div>
          </div>

          <div className="rounded-xl border border-brand-mid/60 bg-white p-3">
            <p className="text-xs font-semibold text-brand-dark">This week</p>
            <ul className="mt-2 space-y-1.5">
              {[
                { d: "Mon", v: 97 },
                { d: "Tue", v: 95 },
                { d: "Wed", v: 98 },
                { d: "Thu", v: 96 },
              ].map((row) => (
                <li key={row.d} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] text-brand-gray">
                    {row.d}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-light">
                    <span
                      className={`block h-full rounded-full bg-brand-red ${still ? "" : "tour-fill"}`}
                      style={{ "--tour-w": `${row.v}%` } as React.CSSProperties}
                    />
                  </span>
                  <span className="w-7 text-right text-[10px] font-semibold text-brand-dark">
                    {row.v}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const INVOICES = [
  { no: "INV-2027-0142", who: "T. Mokoena · Grade 8A", amount: "R 4 850", status: "Paid" },
  { no: "INV-2027-0143", who: "S. Nkosi · Grade 10B", amount: "R 5 200", status: "Paid" },
  { no: "INV-2027-0144", who: "L. Dlamini · Grade 7A", amount: "R 4 850", status: "Due" },
  { no: "INV-2027-0145", who: "J. Adams · Grade 9C", amount: "R 5 100", status: "Overdue" },
  { no: "INV-2027-0146", who: "A. Patel · Grade 11A", amount: "R 5 600", status: "Due" },
];

function FinanceFrame({ still }: { still: boolean }) {
  const collected = useCountUp(78, still);

  return (
    <AppShell activeNav="Invoicing" path="/admin/finance">
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-h-0 overflow-hidden rounded-xl border border-brand-mid/60 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-mid/50 px-3 py-2">
            <p className="text-xs font-semibold text-brand-dark">
              Term 1 invoices
            </p>
            <span className="text-[10px] text-brand-gray">2027</span>
          </div>
          <ul>
            {INVOICES.map((inv, i) => (
              <li
                key={inv.no}
                className={`flex items-center gap-3 border-b border-brand-mid/40 px-3 py-2.5 ${
                  still ? "" : "tour-row"
                }`}
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-brand-dark">
                    {inv.no}
                  </span>
                  <span className="block truncate text-[10px] text-brand-gray">
                    {inv.who}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-bold text-brand-dark">
                  {inv.amount}
                </span>
                <span className="w-16 shrink-0 text-right">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : inv.status === "Due"
                          ? "bg-brand-light text-brand-gray"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-brand-mid/60 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
              Collected this term
            </p>
            <p className="mt-1 text-xl font-extrabold text-brand-dark">
              {collected}%
            </p>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-brand-light">
              <span
                className={`block h-full rounded-full bg-brand-red ${still ? "" : "tour-fill"}`}
                style={{ "--tour-w": "78%" } as React.CSSProperties}
              />
            </span>
            <p className="mt-2 text-[10px] text-brand-gray">
              R 1 214 600 of R 1 557 200 billed
            </p>
          </div>

          <div className="rounded-xl border border-brand-mid/60 bg-white p-3">
            <p className="text-xs font-semibold text-brand-dark">
              Outstanding
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              {[
                ["On time", "68%", "bg-emerald-500"],
                ["Due soon", "22%", "bg-amber-400"],
                ["Overdue", "10%", "bg-red-500"],
              ].map(([label, value, color]) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${color}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-brand-gray">{label}</span>
                  <span className="font-semibold text-brand-dark">{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ───────────────────────── component ───────────────────────── */

export default function ProductTour() {
  const [ref, inView] = useInView(0.25);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const still = useReducedMotion();

  useEffect(() => {
    if (!inView || paused || still) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [inView, paused, still]);

  const step = STEPS[active];

  const frame =
    active === 0 ? (
      <LoginFrame still={still} />
    ) : active === 1 ? (
      <DashboardFrame still={still} />
    ) : active === 2 ? (
      <StudentsFrame still={still} />
    ) : active === 3 ? (
      <AttendanceFrame still={still} />
    ) : (
      <FinanceFrame still={still} />
    );

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Mock application window */}
      <div className="overflow-hidden rounded-2xl border border-brand-mid/70 bg-white shadow-editorial">
        <WindowChrome path={`${PRODUCT.name} — ${step.path}`} />
        <div
          className="h-[360px] sm:h-[420px] lg:h-[460px]"
          aria-hidden="true"
        >
          <div key={step.id} className="h-full animate-fade-in">
            {frame}
          </div>
        </div>
      </div>

      {/* Captions + controls */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-eyebrow text-brand-red">
            Step {active + 1} of {STEPS.length} · {step.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-gray">
            {step.caption}
          </p>
        </div>

        <div className="flex shrink-0 gap-2" aria-label="Product tour steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === active}
              aria-label={`Show step ${i + 1}: ${s.label}`}
              onClick={() => setActive(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === active ? "w-7 bg-brand-red" : "w-2.5 bg-brand-mid/60 hover:bg-brand-mid"
              }`}
            />
          ))}
        </div>
      </div>

      {!still && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-brand-light">
          <div
            key={step.id}
            className="h-full rounded-full bg-brand-red tour-progress"
            style={{ "--tour-dur": `${STEP_MS}ms` } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
}
