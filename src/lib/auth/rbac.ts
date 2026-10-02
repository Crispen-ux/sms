import { UserRole } from "@prisma/client";

// ─── Permission Definitions ─────────────────────────────

export const PERMISSIONS = {
  // Students
  "students.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "ADMISSIONS_OFFICER"],
  "students.write": ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  "students.delete": ["SUPER_ADMIN"],

  // Staff
  "staff.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],
  "staff.write": ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  "staff.delete": ["SUPER_ADMIN"],

  // Classes
  "classes.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  "classes.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],

  // Attendance
  "attendance.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  "attendance.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"],
  "attendance.approve": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],

  // Academics
  "academics.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  "academics.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"],
  "academics.approve": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],

  // Assessments
  "assessments.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  "assessments.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"],

  // Marks
  "marks.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  "marks.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"],
  "marks.approve": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],

  // Finance
  "finance.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT"],
  "finance.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT"],
  "finance.reports": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT", "PRINCIPAL"],

  // Accounting
  "accounting.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT"],
  "accounting.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT"],
  "accounting.reports": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ACCOUNTANT", "PRINCIPAL"],

  // Admissions
  "admissions.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "ADMISSIONS_OFFICER"],
  "admissions.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "ADMISSIONS_OFFICER"],
  "admissions.decide": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],

  // Users
  "users.read": ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  "users.write": ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  "users.delete": ["SUPER_ADMIN"],

  // Reports
  "reports.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],
  "reports.generate": ["SUPER_ADMIN", "SCHOOL_ADMIN"],

  // Settings
  "settings.read": ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  "settings.write": ["SUPER_ADMIN", "SCHOOL_ADMIN"],

  // Announcements
  "announcements.read": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  "announcements.write": ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ─── Role Helpers ───────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return (allowedRoles as readonly string[]).includes(role);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRolePermissions(role: UserRole): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((p) => hasPermission(role, p));
}

// ─── Role Hierarchy ─────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  SCHOOL_ADMIN: 80,
  PRINCIPAL: 70,
  ACCOUNTANT: 60,
  ADMISSIONS_OFFICER: 50,
  TEACHER: 40,
  PARENT: 20,
  STUDENT: 10,
};

export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

// ─── Role Display ───────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  ADMISSIONS_OFFICER: "Admissions Officer",
  PARENT: "Parent",
  STUDENT: "Student",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700",
  SCHOOL_ADMIN: "bg-blue-50 text-blue-700",
  PRINCIPAL: "bg-indigo-50 text-indigo-700",
  TEACHER: "bg-green-50 text-green-700",
  ACCOUNTANT: "bg-emerald-50 text-emerald-700",
  ADMISSIONS_OFFICER: "bg-amber-50 text-amber-700",
  PARENT: "bg-sky-50 text-sky-700",
  STUDENT: "bg-gray-50 text-gray-700",
};
