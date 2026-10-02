/**
 * Central module registry for the school management product.
 *
 * - CORE modules are always enabled and cannot be turned off.
 * - OPTIONAL modules can be enabled/disabled per installation from
 *   System Configuration → Modules.
 *
 * This file is pure data + pure helpers so it can be imported safely from
 * both server and client code. Database access lives in `module-config.ts`.
 */

export type ModuleCategory =
  | "Core"
  | "Administration"
  | "Academics"
  | "Engagement"
  | "Finance"
  | "System";

export interface ModuleDefinition {
  /** Stable identifier — also stored in the database. */
  id: string;
  /** Display name. */
  name: string;
  /** Short description shown in the Modules admin screen and on the website. */
  description: string;
  category: ModuleCategory;
  /** Core modules are always on and cannot be disabled. */
  core: boolean;
  /** Other optional module ids that must be enabled for this module to work. */
  dependsOn: string[];
  /** Default state for new installations (existing installations without an explicit choice stay fully enabled). */
  defaultEnabled: boolean;
  /** Top-level paths (admin portal) owned by this module. */
  paths: string[];
}

export const MODULES: ModuleDefinition[] = [
  // ── Core ──────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    name: "Dashboard",
    description: "School overview, statistics, shortcuts and recent activity.",
    category: "Core",
    core: true,
    dependsOn: [],
    defaultEnabled: true,
    paths: [],
  },
  {
    id: "users",
    name: "Users & Invitations",
    description: "User accounts, roles and invitations.",
    category: "Core",
    core: true,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/users", "/admin/invitations"],
  },
  {
    id: "settings",
    name: "System Configuration",
    description: "School identity, branding, invoices, email and module configuration.",
    category: "Core",
    core: true,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/settings", "/admin/profile"],
  },

  // ── Administration ────────────────────────────────────────────────────
  {
    id: "students",
    name: "Student Management",
    description: "Student records, classes and enrolments.",
    category: "Administration",
    core: false,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/students", "/admin/enrolments", "/admin/classes", "/teacher/classes"],
  },
  {
    id: "admissions",
    name: "Admissions",
    description: "Admissions enquiries and onboarding of new learners.",
    category: "Administration",
    core: false,
    dependsOn: ["students"],
    defaultEnabled: true,
    paths: ["/admin/admissions"],
  },
  {
    id: "staff",
    name: "Staff Management",
    description: "Staff records, teaching staff and teacher assignments.",
    category: "Administration",
    core: false,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/staff", "/admin/teachers", "/admin/teacher-assignments"],
  },

  // ── Academics ─────────────────────────────────────────────────────────
  {
    id: "academics",
    name: "Academic Management",
    description: "Subjects, academics, assessments and results.",
    category: "Academics",
    core: false,
    dependsOn: ["students"],
    defaultEnabled: true,
    paths: [
      "/admin/academics",
      "/admin/assessments",
      "/admin/results",
      "/teacher/results",
      "/parent/results",
    ],
  },
  {
    id: "attendance",
    name: "Attendance",
    description: "Daily attendance registers for classes, staff and learners.",
    category: "Academics",
    core: false,
    dependsOn: ["students"],
    defaultEnabled: true,
    paths: ["/admin/attendance", "/teacher/attendance", "/parent/attendance"],
  },
  {
    id: "reports",
    name: "Reports & Documents",
    description: "Report cards, statements, invoices and generated documents.",
    category: "Academics",
    core: false,
    dependsOn: ["students", "academics"],
    defaultEnabled: true,
    paths: ["/admin/documents"],
  },

  // ── Engagement ────────────────────────────────────────────────────────
  {
    id: "parentCentre",
    name: "Parent Centre",
    description: "Parent and guardian records plus the parent portal.",
    category: "Engagement",
    core: false,
    dependsOn: ["students"],
    defaultEnabled: true,
    paths: ["/admin/parents", "/parent"],
  },
  {
    id: "communication",
    name: "Communication",
    description: "Announcements and messaging between staff and families.",
    category: "Engagement",
    core: false,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/messages", "/admin/announcements", "/teacher/messages", "/parent/messages"],
  },

  // ── Finance ───────────────────────────────────────────────────────────
  {
    id: "invoicing",
    name: "Invoicing & Fees",
    description: "Fee structures, invoices, payments and statements.",
    category: "Finance",
    core: false,
    dependsOn: ["students"],
    defaultEnabled: true,
    paths: ["/admin/finance", "/parent/invoices"],
  },
  {
    id: "accounting",
    name: "Accounting",
    description: "Expenses, income and the financial summary.",
    category: "Finance",
    core: false,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/accounting"],
  },
  {
    id: "shop",
    name: "School Shop",
    description: "Products, stock and orders (uniforms, stationery, extras).",
    category: "Finance",
    core: false,
    dependsOn: ["students"],
    defaultEnabled: true,
    paths: ["/admin/catalogue", "/parent/shop"],
  },

  // ── System ────────────────────────────────────────────────────────────
  {
    id: "insights",
    name: "Analytics & Insights",
    description: "Operational analytics and AI-generated school insights.",
    category: "System",
    core: false,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/analytics", "/admin/ai"],
  },
  {
    id: "audit",
    name: "Audit Log",
    description: "Record of who changed what across the system.",
    category: "System",
    core: false,
    dependsOn: [],
    defaultEnabled: true,
    paths: ["/admin/audit"],
  },
];

export const MODULE_CATEGORIES: ModuleCategory[] = [
  "Core",
  "Administration",
  "Academics",
  "Engagement",
  "Finance",
  "System",
];

export const CORE_MODULE_IDS = MODULES.filter((m) => m.core).map((m) => m.id);
export const OPTIONAL_MODULE_IDS = MODULES.filter((m) => !m.core).map((m) => m.id);

const MODULE_BY_ID = new Map(MODULES.map((m) => [m.id, m]));

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULE_BY_ID.get(id);
}

/** Modules that are on by default for a new/existing installation. */
export function getDefaultEnabledModuleIds(): string[] {
  return MODULES.filter((m) => m.defaultEnabled).map((m) => m.id);
}

/**
 * Normalises whatever is stored in the database into a complete list of
 * enabled module ids (core modules are always included).
 *
 * - `null` / `undefined` / `[]` → defaults (all default-enabled modules)
 * - otherwise → the stored list, plus core modules
 */
export function normaliseEnabledModules(
  stored: string[] | null | undefined
): string[] {
  const base =
    !stored || stored.length === 0 ? getDefaultEnabledModuleIds() : stored;
  const known = base.filter((id) => MODULE_BY_ID.has(id));
  return Array.from(new Set([...known, ...CORE_MODULE_IDS]));
}

/** Is the given module enabled for this installation? */
export function isModuleEnabled(
  moduleId: string,
  enabled: string[]
): boolean {
  const mod = MODULE_BY_ID.get(moduleId);
  if (!mod) return false;
  if (mod.core) return true;
  return enabled.includes(moduleId);
}

/**
 * Validates a requested module selection.
 * Returns a list of human-readable problems (empty array = valid).
 *
 * Rules:
 *  - core modules are always enabled (they cannot be turned off)
 *  - an enabled module must have all of its dependencies enabled
 */
export function validateModuleSelection(
  requestedIds: string[]
): { enabled: string[]; errors: string[] } {
  const enabled = Array.from(
    new Set([
      ...requestedIds.filter((id) => MODULE_BY_ID.has(id)),
      ...CORE_MODULE_IDS,
    ])
  );

  const errors: string[] = [];
  for (const id of enabled) {
    const mod = MODULE_BY_ID.get(id)!;
    for (const dep of mod.dependsOn) {
      if (!enabled.includes(dep)) {
        const depName = MODULE_BY_ID.get(dep)?.name ?? dep;
        errors.push(`${mod.name} requires ${depName} to be enabled.`);
      }
    }
  }

  return { enabled, errors: Array.from(new Set(errors)) };
}

// ── Path gating ─────────────────────────────────────────────────────────
// Maps a portal pathname to the module that owns it. Longest match wins.

const PATH_RULES: { prefix: string; moduleId: string; exact: boolean }[] = [];
for (const mod of MODULES) {
  for (const p of mod.paths) {
    PATH_RULES.push({ prefix: p, moduleId: mod.id, exact: p === "/parent" });
  }
}
PATH_RULES.sort((a, b) => b.prefix.length - a.prefix.length);

/** Returns the module id that owns a pathname, or null for core routes. */
export function moduleForPath(pathname: string): string | null {
  for (const rule of PATH_RULES) {
    if (rule.exact) {
      if (pathname === rule.prefix) return rule.moduleId;
    } else if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      return rule.moduleId;
    }
  }
  return null;
}

/** True when a user navigating to `pathname` would hit a disabled module. */
export function isPathBlocked(pathname: string, enabled: string[]): boolean {
  const moduleId = moduleForPath(pathname);
  if (!moduleId) return false;
  return !isModuleEnabled(moduleId, enabled);
}
