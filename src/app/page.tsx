"use client";

import Link from "next/link";
import { useState } from "react";
import ProductTour from "@/components/ProductTour";
import { useInView } from "@/lib/useInView";
import { MODULES, MODULE_CATEGORIES } from "@/lib/modules";
import type { ModuleDefinition } from "@/lib/modules";
import { PRODUCT } from "@/config/product";
import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  CalendarCheck,
  Check,
  Circle,
  ClipboardList,
  Clock,
  Database,
  EyeOff,
  Globe,
  Info,
  Layers,
  Lock,
  Mail,
  Pencil,
  Puzzle,
  Receipt,
  Server,
  Settings,
  SlidersHorizontal,
  Users,
  Wrench,
} from "lucide-react";

/* ───────────────────────── helpers ───────────────────────── */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, inView] = useInView(0.12);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, tone = "red" }: { children: React.ReactNode; tone?: "red" | "light" }) {
  return (
    <p
      className={`text-eyebrow flex items-center gap-2 ${
        tone === "red" ? "text-brand-red" : "text-white/60"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-px w-6 ${tone === "red" ? "bg-brand-red" : "bg-white/40"}`}
      />
      {children}
    </p>
  );
}

const CATEGORY_META: Record<string, { icon: React.ElementType; blurb: string }> = {
  Administration: {
    icon: Users,
    blurb: "The records your front office and leadership team work with daily.",
  },
  Academics: {
    icon: ClipboardList,
    blurb: "Teaching, assessment, attendance and the documents that follow.",
  },
  Engagement: {
    icon: Mail,
    blurb: "How your school keeps parents and guardians in the loop.",
  },
  Finance: {
    icon: Receipt,
    blurb: "Fees, invoices, payments and the books behind them.",
  },
  System: {
    icon: SlidersHorizontal,
    blurb: "Insight and oversight across the whole installation.",
  },
};

const CHALLENGES = [
  {
    icon: Puzzle,
    title: "Too many disconnected systems",
    body: "Student records, fees, attendance and messaging each live in a different tool.",
  },
  {
    icon: Clock,
    title: "Administrative workload",
    body: "Staff spend hours assembling information that should already be at hand.",
  },
  {
    icon: Layers,
    title: "Scattered information",
    body: "Data sits across spreadsheets, inboxes and paper files with no single version.",
  },
  {
    icon: Pencil,
    title: "Manual processes",
    body: "Registers, reports and invoices are put together by hand, term after term.",
  },
  {
    icon: EyeOff,
    title: "Limited visibility",
    body: "It is hard to see what is happening across the school at a glance.",
  },
  {
    icon: Ban,
    title: "Functionality you never use",
    body: "Rigid packages ship features your school will never switch on.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: SlidersHorizontal,
    title: "Configure",
    body: "Choose the modules your school needs. The interface stays focused on the functions your staff actually use.",
  },
  {
    number: "02",
    icon: Server,
    title: "Deploy",
    body: "Your school gets its own dedicated installation and database, set up for your configuration.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Manage",
    body: "Cretek helps maintain, update and support the system as your school keeps working in it.",
  },
];

const HERO_TILES = [
  { id: "students", icon: Users },
  { id: "attendance", icon: CalendarCheck },
  { id: "academics", icon: ClipboardList },
  { id: "invoicing", icon: Receipt },
];

const QUOTE_FACTORS = [
  "Which modules your school requires",
  "Deployment and hosting arrangement",
  "Configuration and branding setup",
  "Training for your staff",
  "Ongoing maintenance and support",
];

/* ─────────── configurator (interactive module checklist) ─────────── */

const CORE_IDS = MODULES.filter((m) => m.core).map((m) => m.id);
const INITIAL_ENABLED = [
  ...CORE_IDS,
  "students",
  "staff",
  "academics",
  "attendance",
  "reports",
  "parentCentre",
  "insights",
];

function ModuleConfigurator() {
  const [enabled, setEnabled] = useState<string[]>(INITIAL_ENABLED);

  const toggle = (mod: ModuleDefinition) => {
    if (mod.core) return;
    setEnabled((prev) =>
      prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]
    );
  };

  return (
    <div className="rounded-3xl bg-white border border-brand-mid/60 shadow-editorial-lg overflow-hidden">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-brand-mid/60 bg-brand-light">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red text-white"
          >
            <Settings className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              Module configuration
            </p>
            <p className="text-xs text-brand-gray">Example setup — select to toggle</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-brand-dark bg-white border border-brand-mid rounded-full px-3 py-1.5 whitespace-nowrap">
          {enabled.length} of {MODULES.length} enabled
        </span>
      </div>

      {/* Category groups */}
      <div className="p-5 sm:p-6 space-y-6">
        {MODULE_CATEGORIES.map((category) => {
          const mods = MODULES.filter((m) => m.category === category);
          if (mods.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="text-eyebrow text-brand-gray mb-3">{category}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {mods.map((mod) => {
                  const on = enabled.includes(mod.id);
                  const inner = (
                    <>
                      <span
                        aria-hidden="true"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          on
                            ? "bg-brand-red border-brand-red text-white"
                            : "bg-white border-brand-mid text-brand-gray"
                        }`}
                      >
                        {on ? (
                          <Check className="w-3 h-3" strokeWidth={3} />
                        ) : (
                          <Circle className="w-2 h-2" strokeWidth={3} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-brand-dark truncate">
                          {mod.name}
                        </span>
                      </span>
                      {mod.core && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          Core
                        </span>
                      )}
                    </>
                  );

                  return mod.core ? (
                    <div
                      key={mod.id}
                      className="flex items-center gap-3 rounded-xl border border-brand-mid/60 bg-brand-light/70 px-3 py-2.5 cursor-not-allowed"
                      title="Core modules are always on"
                    >
                      {inner}
                    </div>
                  ) : (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggle(mod)}
                      aria-pressed={on}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                        on
                          ? "border-brand-red/40 bg-brand-red/5 hover:bg-brand-red/10"
                          : "border-brand-mid/60 bg-white hover:border-brand-gray/40"
                      }`}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-brand-light border-t border-brand-mid/60">
        <p className="text-xs text-brand-gray">
          Core modules stay on — everything else is your choice.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:text-brand-red-dark transition-colors"
        >
          Discuss your configuration
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function HomePage() {
  const heroTiles = HERO_TILES.flatMap(({ id, icon }) => {
    const mod = MODULES.find((m) => m.id === id);
    return mod ? [{ mod, icon }] : [];
  });
  const coreModules = MODULES.filter((m) => m.core);
  const gridCategories = MODULE_CATEGORIES.filter((c) => c !== "Core");

  return (
    <>
      {/* ── 1. HERO ─────────────────────────────────────────── */}
      <section aria-label="Introduction" className="relative overflow-hidden bg-brand-dark text-white">
        <div className="absolute inset-0 gradient-hero" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(209,0,0,0.25),transparent_50%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            {/* Copy */}
            <div className="animate-fade-up">
              <Eyebrow tone="light">{PRODUCT.name}</Eyebrow>
              <h1 className="text-display mt-6">
                Complete School Management.{" "}
                <span className="text-gradient">Configured for Your School.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl">
                A powerful school management platform that brings administration,
                academics, communication and school operations together in one
                configurable system.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="btn-primary justify-center">
                  Explore the Live Demo
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link href="/contact" className="btn-secondary justify-center">
                  Talk to {PRODUCT.companyName}
                </Link>
              </div>

              <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-white/60">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-red-light" aria-hidden="true" />
                  Dedicated installation per school
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-red-light" aria-hidden="true" />
                  Modules chosen per school
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-red-light" aria-hidden="true" />
                  Setup, training and support from {PRODUCT.companyName}
                </li>
              </ul>
            </div>

            {/* Interface preview */}
            <div className="relative lg:justify-self-end w-full max-w-md animate-fade-up delay-200">
              <div
                className="absolute -inset-8 bg-brand-red/20 blur-3xl rounded-full"
                aria-hidden="true"
              />
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2 shadow-editorial">
                <div className="flex items-center gap-1.5 px-3 py-2.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-3 text-[11px] text-white/50 font-medium truncate">
                    {PRODUCT.name} — Dashboard
                  </span>
                </div>
                <div className="rounded-xl bg-brand-dark/70 border border-white/5 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {heroTiles.map(({ mod, icon: Icon }) => (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3.5"
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/15 text-brand-red-light mb-3"
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <p className="text-sm font-semibold text-white truncate">
                          {mod.name}
                        </p>
                        <p className="text-[11px] text-white/45 mt-0.5">
                          {mod.category}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5">
                    <span className="text-[11px] text-white/50">Example configuration</span>
                    <span className="text-[11px] font-semibold text-white">
                      {MODULES.length} modules · {MODULE_CATEGORIES.length} categories
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM / SOLUTION ────────────────────────────── */}
      <section id="problem" aria-label="The problem we solve" className="scroll-mt-24 py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="text-editorial mt-5 text-brand-dark">
              Running a school should not mean running six systems.
            </h2>
            <p className="mt-5 text-brand-gray text-lg leading-relaxed">
              Schools are asked to do more every year, yet many still work across
              tools that were never designed to fit together. The result is more
              admin, not less.
            </p>
          </Reveal>

          <div className="mt-14 grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Challenges */}
            <Reveal>
              <ul className="grid sm:grid-cols-2 gap-5">
                {CHALLENGES.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-brand-mid/60 bg-brand-light/60 p-5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-brand-mid/60 text-brand-red mb-4"
                    >
                      <item.icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-semibold text-brand-dark text-[15px]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-brand-gray leading-relaxed">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Solution */}
            <Reveal delay={120}>
              <div className="rounded-3xl bg-brand-dark text-white p-7 sm:p-9 shadow-editorial-lg relative overflow-hidden">
                <div
                  className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-red/20 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative">
                  <Eyebrow tone="light">The solution</Eyebrow>
                  <h3 className="text-editorial mt-5">
                    One platform. Configure only what your school needs.
                  </h3>
                  <p className="mt-5 text-white/70 leading-relaxed">
                    {PRODUCT.name} brings administration, academics, communication
                    and finance into a single system. You decide which modules your
                    staff see, so the interface stays focused on the work in front of
                    them — and there is one place to look for the whole picture.
                  </p>
                  <ul className="mt-7 space-y-3">
                    {[
                      "Student, staff and class records in one place",
                      "Academics, attendance and reports connected to those records",
                      "Parent communication and finance alongside them",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-3 text-sm text-white/75">
                        <Check
                          className="w-4 h-4 text-brand-red-light mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#configure"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-brand-red-light transition-colors"
                  >
                    See how configuration works
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3. BUILT AROUND YOUR SCHOOL ──────────────────────── */}
      <section
        id="configure"
        aria-label="Built around your school"
        className="scroll-mt-24 py-20 lg:py-28 bg-brand-light relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <Eyebrow>Built around your school</Eyebrow>
              <h2 className="text-editorial mt-5 text-brand-dark">
                Not every school operates the same way.
              </h2>
              <p className="mt-5 text-lg text-brand-gray leading-relaxed">
                Enable the modules your school needs and keep the interface focused
                on the functions your staff actually use.
              </p>
              <p className="mt-4 text-brand-gray leading-relaxed">
                A small prep school and a large secondary school do not run on the
                same processes. {PRODUCT.name} is delivered as a configuration, not
                a fixed bundle: core capabilities are always on, and everything else
                is switched on for your installation only.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Modules in the registry", value: `${MODULES.length}` },
                  { label: "Categories", value: `${MODULE_CATEGORIES.length}` },
                  { label: "Core modules", value: `${coreModules.length}` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white border border-brand-mid/60 p-4"
                  >
                    <p className="text-2xl font-extrabold text-brand-dark">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link href="/contact" className="btn-outline mt-8">
                Talk through your requirements
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Reveal>

            <Reveal delay={120}>
              <ModuleConfigurator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT MODULES ───────────────────────────────── */}
      <section id="modules" aria-label="Product modules" className="scroll-mt-24 py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <Eyebrow>Product modules</Eyebrow>
            <h2 className="text-editorial mt-5 text-brand-dark">
              The modules your school can switch on.
            </h2>
            <p className="mt-5 text-lg text-brand-gray leading-relaxed">
              Every module below exists in the platform today. Core modules are
              always on; optional modules can be enabled per installation.
            </p>
          </Reveal>

          {/* Core note */}
          <Reveal className="mt-10">
            <div className="rounded-2xl border border-brand-dark/10 bg-brand-light p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-dark text-white"
              >
                <Lock className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <p className="text-eyebrow text-brand-gray">Core — always on</p>
                <p className="mt-2 text-brand-dark font-medium">
                  {coreModules.map((m) => m.name).join(" · ")}
                </p>
                <p className="mt-1.5 text-sm text-brand-gray">
                  These modules are included with every installation and cannot be
                  switched off.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Category cards */}
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridCategories.map((category, i) => {
              const mods = MODULES.filter((m) => m.category === category);
              const meta = CATEGORY_META[category];
              const Icon = meta?.icon ?? SlidersHorizontal;
              return (
                <Reveal key={category} delay={(i % 3) * 100}>
                  <article className="h-full rounded-2xl border border-brand-mid/60 bg-white p-6 transition-shadow duration-300 hover:shadow-editorial">
                    <header className="flex items-center gap-3 mb-5">
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red"
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-brand-dark">{category}</h3>
                        <p className="text-xs text-brand-gray">
                          {mods.length} module{mods.length === 1 ? "" : "s"} · optional
                        </p>
                      </div>
                    </header>
                    {meta && (
                      <p className="text-sm text-brand-gray mb-5">{meta.blurb}</p>
                    )}
                    <ul className="space-y-4">
                      {mods.map((mod) => (
                        <li
                          key={mod.id}
                          className="border-t border-brand-mid/50 pt-4 first:border-0 first:pt-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-sm text-brand-dark">
                              {mod.name}
                            </p>
                            <span className="shrink-0 rounded-full bg-brand-light border border-brand-mid/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
                              Optional
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-brand-gray leading-relaxed">
                            {mod.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ──────────────────────────────────── */}
      <section
        id="how-it-works"
        aria-label="How it works"
        className="scroll-mt-24 py-20 lg:py-28 bg-brand-light"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="text-editorial mt-5 text-brand-dark">
              From requirements to a running system.
            </h2>
            <p className="mt-5 text-lg text-brand-gray leading-relaxed">
              Three steps, guided by {PRODUCT.companyName} from the first
              conversation onwards.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 100} className="h-full">
                <div className="h-full rounded-2xl bg-white border border-brand-mid/60 p-7 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red text-white"
                    >
                      <step.icon className="w-5 h-5" />
                    </span>
                    <span className="text-3xl font-extrabold text-brand-mid">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-brand-gray leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. DEPLOYMENT / DATA POSITIONING ─────────────────── */}
      <section
        id="deployment"
        aria-label="Deployment and data"
        className="scroll-mt-24 py-20 lg:py-28 bg-brand-dark text-white relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(209,0,0,0.18),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <Eyebrow tone="light">Deployment</Eyebrow>
              <h2 className="text-editorial mt-5">
                Your school&rsquo;s system. Your school&rsquo;s environment.
              </h2>
              <p className="mt-5 text-lg text-white/70 leading-relaxed">
                Each school can have its own dedicated installation and database,
                rather than sharing a common SaaS environment with other
                organisations.
              </p>
              <p className="mt-4 text-white/60 leading-relaxed">
                That matters when your school is handling sensitive student and
                administrative information: your environment holds your school&rsquo;s
                data, and changes made for your school are made in your school&rsquo;s
                system.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  {
                    icon: Database,
                    title: "A database for your school",
                    body: "Your records live in your own database, not one shared across unrelated tenants.",
                  },
                  {
                    icon: Server,
                    title: "A dedicated installation",
                    body: "Your configuration, branding and modules are applied to your installation.",
                  },
                  {
                    icon: Settings,
                    title: "Controlled by your school",
                    body: "Roles and permissions decide which staff can see and change what.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-red-light"
                    >
                      <item.icon className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/60 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Environment comparison mock */}
            <Reveal delay={120}>
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-70">
                  <p className="text-eyebrow text-white/50">A shared SaaS environment</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {["School A", "School B", "School C"].map((label) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-white/50"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-white/40">
                    Many organisations, one common environment.
                  </p>
                </div>

                <div className="rounded-2xl border border-brand-red/40 bg-brand-red/10 p-6">
                  <p className="text-eyebrow text-brand-red-light">
                    {PRODUCT.name} deployment
                  </p>
                  <div className="mt-4 flex items-stretch gap-3">
                    <div className="flex-1 rounded-xl border border-white/15 bg-brand-dark/60 px-4 py-4 text-center">
                      <Server
                        className="w-5 h-5 mx-auto text-white/70"
                        aria-hidden="true"
                      />
                      <p className="mt-2 text-xs font-semibold text-white">
                        Dedicated installation
                      </p>
                    </div>
                    <div
                      className="flex items-center text-white/40"
                      aria-hidden="true"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="flex-1 rounded-xl border border-white/15 bg-brand-dark/60 px-4 py-4 text-center">
                      <Database
                        className="w-5 h-5 mx-auto text-white/70"
                        aria-hidden="true"
                      />
                      <p className="mt-2 text-xs font-semibold text-white">
                        Your school&rsquo;s database
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-white/60">
                    Your school&rsquo;s environment, only for your school.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 7. PRODUCT TOUR (animated) ──────────────────────── */}
      <section
        id="tour"
        aria-label="Product tour"
        className="scroll-mt-24 py-20 lg:py-28 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <Eyebrow>Product tour</Eyebrow>
            <h2 className="text-editorial mt-5 text-brand-dark">
              Sign in, and the school is at your fingertips.
            </h2>
            <p className="mt-5 text-lg text-brand-gray leading-relaxed">
              A quick look at what your staff see after they sign in — from the
              first login to the register, records and fees.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-12">
            <ProductTour />
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-8 flex items-start gap-2.5 rounded-xl border border-brand-mid bg-white px-5 py-4 text-sm text-brand-gray text-left max-w-2xl">
              <Info
                className="w-4 h-4 mt-0.5 shrink-0 text-brand-red"
                aria-hidden="true"
              />
              The interface adapts to each school&rsquo;s branding and to the
              modules it has enabled — what you see here is an illustration, and
              the{" "}
              <Link href="/login" className="font-semibold text-brand-red underline-offset-2 hover:underline">
                live demo
              </Link>{" "}
              uses your browser, so you can click through it yourself.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 8. DEMO CTA ──────────────────────────────────────── */}
      <section
        id="demo"
        aria-label="Live demo"
        className="scroll-mt-24 py-20 lg:py-28 bg-brand-cream"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-800">
              <Circle className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
              Demo environment
            </span>
            <h2 className="text-editorial mt-6 text-brand-dark">
              See the System in Action
            </h2>
            <p className="mt-5 text-lg text-brand-gray leading-relaxed max-w-2xl mx-auto">
              Let prospective schools explore the platform using a dedicated
              demonstration environment.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn-primary justify-center">
                Launch Live Demo
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="btn-outline justify-center">
                Request a guided walkthrough
              </Link>
            </div>

            <div className="mt-8 flex justify-center">
              <p className="flex items-start gap-2.5 rounded-xl border border-brand-mid bg-white px-5 py-4 text-sm text-brand-gray text-left max-w-xl">
                <Info
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-brand-dark">
                    Demo data is periodically reset.
                  </strong>{" "}
                  Do not enter real personal information.
                </span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 9. PRICING ───────────────────────────────────────── */}
      <section
        id="pricing"
        aria-label="Pricing"
        className="scroll-mt-24 py-20 lg:py-28 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="text-editorial mt-5 text-brand-dark">
                Pricing Built Around Your School
              </h2>
              <p className="mt-5 text-lg text-brand-gray leading-relaxed">
                Every school has different requirements, so we do not publish a
                fixed price list. Contact {PRODUCT.companyName} to discuss the
                modules you need, deployment, hosting, configuration, training,
                maintenance and support — and we will quote for your school.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="btn-primary justify-center">
                  Request a Quote
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <a
                  href={`mailto:${PRODUCT.supportEmail}`}
                  className="btn-outline justify-center"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Email a question
                </a>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-brand-mid/60 bg-brand-light p-7 sm:p-9">
                <h3 className="text-eyebrow text-brand-gray">What shapes your quote</h3>
                <ul className="mt-6 space-y-4">
                  {QUOTE_FACTORS.map((factor) => (
                    <li
                      key={factor}
                      className="flex items-start gap-3 rounded-xl bg-white border border-brand-mid/60 px-4 py-3.5"
                    >
                      <Check
                        className="w-4 h-4 text-brand-red mt-1 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-brand-dark">
                        {factor}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-brand-gray leading-relaxed">
                  No fixed prices are published — every quote is prepared for the
                  school that asked for it.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 10. CONTACT STRIP ─────────────────────────────────── */}
      <section
        id="contact"
        aria-label="Contact Cretek"
        className="scroll-mt-24 py-16 lg:py-20 bg-brand-red text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-eyebrow text-white/70">Contact</p>
              <h2 className="text-editorial mt-4">
                Talk to {PRODUCT.companyName} about {PRODUCT.name}.
              </h2>
              <p className="mt-4 text-white/80 max-w-xl leading-relaxed">
                Tell us about your school and what you need the system to cover —
                we will come back to you with a demonstration and a quote.
              </p>
            </div>

            <div className="lg:justify-self-end flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 items-start lg:items-stretch">
              <ul className="space-y-3 mr-2">
                <li>
                  <a
                    href={PRODUCT.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-white/85 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" aria-hidden="true" />
                    {PRODUCT.companyWebsite.replace(/^https?:\/\//, "")}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${PRODUCT.supportEmail}`}
                    className="flex items-center gap-2.5 text-sm text-white/85 hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    {PRODUCT.supportEmail}
                  </a>
                </li>
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-brand-dark hover:bg-brand-light transition-all duration-300 whitespace-nowrap"
              >
                Request a Demo / Quote
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
