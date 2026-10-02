"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@/components/ui";
import { Layers, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  MODULE_CATEGORIES,
  type ModuleDefinition,
} from "@/lib/modules";
import { invalidateModules } from "@/lib/useModules";

interface ModulesPayload {
  modules: ModuleDefinition[];
  categories: string[];
  enabled: string[];
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 ${
        checked ? "bg-brand-red" : "bg-brand-mid"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/**
 * System Configuration → Modules
 *
 * Enable/disable the optional modules for THIS installation. Changes apply
 * to navigation, the dashboard and direct access immediately — no source
 * changes required. Dependencies between modules are enforced by the API.
 */
export default function ModulesSection() {
  const [data, setData] = useState<ModulesPayload | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload: ModulesPayload) => {
        setData(payload);
        setSelected(payload.enabled);
      })
      .catch(() => setError("Failed to load modules"))
      .finally(() => setLoading(false));
  }, []);

  const isOn = (id: string) => selected.includes(id);

  const toggle = (mod: ModuleDefinition) => {
    if (mod.core) return;
    setError("");
    setSuccess("");
    setSelected((prev) =>
      prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: selected }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save modules");
      setSelected(body.enabled);
      invalidateModules();
      setSuccess("Module configuration updated. Navigation and dashboards now reflect the change.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save modules");
      setTimeout(() => setError(""), 6000);
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    data !== null &&
    selected.length === data.enabled.length &&
    selected.every((id) => data.enabled.includes(id));

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-3 py-8 text-brand-gray text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading modules...
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-red-500 py-4">{error || "Failed to load modules"}</p>
      </Card>
    );
  }

  const byCategory = MODULE_CATEGORIES.map((category) => ({
    category,
    modules: data.modules.filter((m) => m.category === category),
  })).filter((group) => group.modules.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-3 mb-1">
          <Layers className="w-5 h-5 text-brand-red mt-0.5" />
          <div>
            <h3 className="font-semibold text-brand-dark">Modules</h3>
            <p className="text-sm text-brand-gray">
              Choose which parts of {data.modules.length > 0 ? "the system" : ""} this school
              uses. Disabled modules disappear from navigation and dashboards and can be
              re-enabled at any time — no data is removed.
            </p>
          </div>
        </div>
      </Card>

      {byCategory.map((group) => (
        <Card key={group.category}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-gray mb-4">
            {group.category}
          </h4>
          <div className="divide-y divide-brand-mid/60">
            {group.modules.map((mod) => {
              const on = mod.core ? true : isOn(mod.id);
              return (
                <div
                  key={mod.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-brand-dark">{mod.name}</p>
                      {mod.core && (
                        <Badge variant="default" className="text-[10px]">
                          <span className="inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Core
                          </span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-brand-gray mt-0.5">{mod.description}</p>
                    {mod.dependsOn.length > 0 && (
                      <p className="text-[11px] text-brand-gray/70 mt-1">
                        Requires:{" "}
                        {mod.dependsOn
                          .map((d) => data.modules.find((m) => m.id === d)?.name ?? d)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <Toggle
                    checked={on}
                    disabled={mod.core || saving}
                    onChange={() => toggle(mod)}
                    label={`Toggle ${mod.name}`}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || dirty}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              Save Module Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
