import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { hasPermission, type Permission, hasMinRole } from "@/lib/auth/rbac";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: (session.user as any).id as string,
    email: session.user.email!,
    name: session.user.name ?? null,
    role: (session.user as any).role as UserRole,
  };
}

/**
 * Require authentication. Returns the user or throws/redirects.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Require a specific permission. Returns the user or throws.
 */
export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Require a minimum role level. Returns the user or throws.
 */
export async function requireRole(minRole: UserRole): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasMinRole(user.role, minRole)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * API route helper: returns auth user or sends error response.
 */
export async function apiAuth(permission?: Permission) {
  try {
    if (permission) {
      return { user: await requirePermission(permission), error: null };
    }
    return { user: await requireAuth(), error: null };
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") {
      return {
        user: null,
        error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
      };
    }
    if (e.message === "FORBIDDEN") {
      return {
        user: null,
        error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
      };
    }
    return {
      user: null,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}
