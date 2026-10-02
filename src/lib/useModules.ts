"use client";

import { useEffect, useState } from "react";
import { MODULES } from "@/lib/modules";

/**
 * Client-side access to this installation's enabled modules.
 *
 * The result is cached in-module so multiple layouts/components share a
 * single request. Call `invalidateModules()` after changing the selection
 * so subsequent mounts pick up the new state.
 */

const CACHE_MS = 15_000;

let cache: { enabled: string[]; at: number } | null = null;
let inflight: Promise<string[]> | null = null;

async function fetchEnabled(): Promise<string[]> {
  const res = await fetch("/api/modules");
  if (!res.ok) throw new Error("Unable to load modules");
  const data = await res.json();
  return Array.isArray(data.enabled) ? data.enabled : [];
}

function load(): Promise<string[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return Promise.resolve(cache.enabled);
  }
  if (!inflight) {
    inflight = fetchEnabled()
      .then((enabled) => {
        cache = { enabled, at: Date.now() };
        return enabled;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function invalidateModules() {
  cache = null;
}

export function useModules(): {
  enabled: string[] | null;
  isEnabled: (moduleId: string) => boolean;
  loading: boolean;
} {
  const [enabled, setEnabled] = useState<string[] | null>(cache?.enabled ?? null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((ids) => {
        if (!cancelled) setEnabled(ids);
      })
      .catch(() => {
        // On failure assume everything is enabled so navigation never
        // disappears; the next mount will retry.
        if (!cancelled) setEnabled((prev) => prev ?? MODULES.map((m) => m.id));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isEnabled = (moduleId: string) => {
    if (!enabled) return true; // while loading, render the full navigation
    return enabled.includes(moduleId);
  };

  return { enabled, isEnabled, loading: enabled === null };
}
