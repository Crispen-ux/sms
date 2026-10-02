import { db } from "@/lib/db";
import {
  MODULES,
  normaliseEnabledModules,
  validateModuleSelection,
} from "@/lib/modules";

/** Short-lived in-process cache so every request doesn't hit the database. */
let cache: { ids: string[]; at: number } | null = null;
const TTL_MS = 15_000;

/** Persisted module selection is stored on the School row. */
export async function getEnabledModuleIds(force = false): Promise<string[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.ids;

  const school = await db.school.findFirst({
    select: { enabledModules: true },
  });
  const ids = normaliseEnabledModules(school?.enabledModules ?? null);
  cache = { ids, at: Date.now() };
  return ids;
}

export function clearModuleCache() {
  cache = null;
}

/**
 * Persists a new module selection after validating dependencies.
 * Throws an Error with a human-readable message when invalid.
 */
export async function setEnabledModuleIds(
  requestedIds: string[]
): Promise<string[]> {
  const { enabled, errors } = validateModuleSelection(requestedIds);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const school = await db.school.findFirst({ select: { id: true } });
  if (!school) throw new Error("No school configured");

  // Store only optional modules — core modules are always enabled.
  const optional = enabled.filter(
    (id) => !MODULES.find((m) => m.id === id)?.core
  );

  await db.school.update({
    where: { id: school.id },
    data: { enabledModules: optional },
  });
  clearModuleCache();
  return enabled;
}
