"use client";

import { useEffect, useState } from "react";
import { PRODUCT } from "@/config/product";

export interface BrandingSchool {
  name: string;
  logoUrl: string | null;
  accentColor: string;
  secondaryColor: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
}

export interface Branding {
  product: {
    name: string;
    version: string;
    companyName: string;
    website: string;
    supportEmail: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  school: BrandingSchool | null;
}

const CACHE_MS = 60_000;

let cache: { data: Branding; at: number } | null = null;
let inflight: Promise<Branding> | null = null;

async function fetchBranding(): Promise<Branding> {
  const res = await fetch("/api/branding");
  if (!res.ok) throw new Error("Unable to load branding");
  return res.json();
}

function load(): Promise<Branding> {
  if (cache && Date.now() - cache.at < CACHE_MS) return Promise.resolve(cache.data);
  if (!inflight) {
    inflight = fetchBranding()
      .then((data) => {
        cache = { data, at: Date.now() };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

const FALLBACK: Branding = {
  product: {
    name: PRODUCT.name,
    version: PRODUCT.version,
    companyName: PRODUCT.companyName,
    website: PRODUCT.companyWebsite,
    supportEmail: PRODUCT.supportEmail,
    logo: PRODUCT.logo,
    primaryColor: PRODUCT.primaryColor,
    secondaryColor: PRODUCT.secondaryColor,
  },
  school: null,
};

/**
 * Product + school branding for this installation, cached across components.
 * Falls back to product defaults if the request fails.
 */
export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(cache?.data ?? FALLBACK);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setBranding(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return branding;
}
