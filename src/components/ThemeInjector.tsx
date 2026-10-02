"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PRODUCT } from "@/config/product";
import { useBranding } from "@/lib/useBranding";

/**
 * Applies installation branding (school + product) as CSS custom properties.
 *
 * Portal and authentication surfaces use the school's own colours/logo;
 * the public product website stays on the product's default brand colours.
 * Every `brand-*` Tailwind utility follows these variables, so branding is
 * fully configuration-driven — no source changes required per customer.
 */

const SCHOOL_PATHS = [
  "/admin",
  "/teacher",
  "/parent",
  "/student",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

function toHex(color: string): string | null {
  const c = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    return (
      "#" +
      c
        .slice(1)
        .split("")
        .map((ch) => ch + ch)
        .join("")
        .toLowerCase()
    );
  }
  return null;
}

function shift(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((num >> 16) & 255) + amount);
  const g = clamp(((num >> 8) & 255) + amount);
  const b = clamp((num & 255) + amount);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

function applyColors(
  primary?: string | null,
  secondary?: string | null,
  fallbackToProduct = false
) {
  const root = document.documentElement;
  const p = primary ? toHex(primary) : null;
  const s = secondary ? toHex(secondary) : null;
  const productPrimary = toHex(PRODUCT.primaryColor);
  const productSecondary = toHex(PRODUCT.secondaryColor);

  const base = fallbackToProduct ? productPrimary : p;
  if (base) {
    root.style.setProperty("--brand-primary", base);
    root.style.setProperty("--brand-primary-dark", shift(base, -42));
    root.style.setProperty("--brand-primary-light", shift(base, 44));
  }
  const baseSecondary = fallbackToProduct ? productSecondary : s;
  if (baseSecondary) root.style.setProperty("--brand-secondary", baseSecondary);
}

function applyFavicon(logoUrl: string | null | undefined) {
  const link =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
    document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
  if (!link) return;
  link.href = logoUrl || "/favicon.svg";
}

export default function ThemeInjector() {
  const pathname = usePathname() || "/";
  const branding = useBranding();

  useEffect(() => {
    const isSchoolSurface = SCHOOL_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isSchoolSurface) {
      // Product surface: product default colours and favicon.
      applyColors(null, null, true);
      applyFavicon(null);
      return;
    }

    if (branding.school) {
      applyColors(branding.school.accentColor, branding.school.secondaryColor);
      applyFavicon(branding.school.logoUrl);
    }
  }, [pathname, branding]);

  return null;
}
