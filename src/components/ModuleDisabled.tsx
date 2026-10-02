"use client";

import Link from "next/link";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { getModule } from "@/lib/modules";

/**
 * Shown when a user opens a portal route that belongs to a module that is
 * disabled for this installation. The module code stays intact — it simply
 * becomes available again when an administrator re-enables the module.
 */
export default function ModuleDisabled({
  moduleId,
  portalRoot,
  portalLabel,
}: {
  moduleId: string;
  portalRoot: string;
  portalLabel: string;
}) {
  const mod = getModule(moduleId);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldOff className="w-7 h-7 text-brand-gray" />
        </div>
        <h2 className="text-xl font-bold text-brand-dark mb-2">
          {mod?.name ?? "This module"} is turned off
        </h2>
        <p className="text-sm text-brand-gray mb-6">
          This feature is not enabled for this school. A school administrator
          can turn it on from{" "}
          <span className="font-medium text-brand-dark">
            System Configuration → Modules
          </span>
          .
        </p>
        <Link
          href={portalRoot}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-red text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {portalLabel}
        </Link>
      </div>
    </div>
  );
}
