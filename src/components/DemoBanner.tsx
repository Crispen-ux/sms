"use client";

/**
 * Optional banner shown across all portals when this installation is a
 * demonstration environment. Configure NEXT_PUBLIC_DEMO_BANNER in .env,
 * e.g. "DEMO ENVIRONMENT — demo data is reset nightly. Do not enter real
 * personal information."
 *
 * Renders nothing when the variable is not set (i.e. every real school
 * installation).
 */
export default function DemoBanner() {
  const text = process.env.NEXT_PUBLIC_DEMO_BANNER;
  if (!text) return null;

  return (
    <div
      role="status"
      className="bg-amber-400 text-amber-950 text-xs font-semibold text-center px-4 py-2 tracking-wide"
    >
      {text}
    </div>
  );
}
