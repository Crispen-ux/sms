import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/auth/helpers";
import {
  MODULES,
  MODULE_CATEGORIES,
  getDefaultEnabledModuleIds,
} from "@/lib/modules";
import {
  getEnabledModuleIds,
  setEnabledModuleIds,
} from "@/lib/module-config";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/modules
 * Returns the module registry together with the modules enabled for this
 * installation.
 */
export async function GET() {
  // Any signed-in user may read which modules are enabled (navigation
  // filtering); changing them requires settings.write (see PUT below).
  const { error } = await apiAuth();
  if (error) return error;

  const enabled = await getEnabledModuleIds();

  return NextResponse.json({
    modules: MODULES,
    categories: MODULE_CATEGORIES,
    enabled,
    defaults: getDefaultEnabledModuleIds(),
  });
}

/**
 * PUT /api/modules
 * Body: { enabled: string[] }
 * Persists the module selection for this installation.
 * Dependencies are validated — invalid selections are rejected with a
 * clear message (e.g. "Invoicing & Fees requires Student Management to be enabled.").
 */
export async function PUT(request: NextRequest) {
  const { user, error } = await apiAuth("settings.write");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const requested = Array.isArray(body?.enabled) ? body.enabled : null;
  if (!requested) {
    return NextResponse.json(
      { error: "An 'enabled' array of module ids is required." },
      { status: 400 }
    );
  }

  try {
    const enabled = await setEnabledModuleIds(requested as string[]);

    await auditLog({
      userId: user.id,
      action: "modules.updated",
      resource: "modules",
      metadata: { enabled },
    });

    return NextResponse.json({ enabled });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Invalid module selection.",
      },
      { status: 400 }
    );
  }
}
