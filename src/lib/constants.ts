import { PRODUCT } from "@/config/product";

/**
 * Public site constants for the Cretek SchoolOS product website.
 *
 * `SITE` keeps its original shape (every key the old school site used is
 * still present) so any remaining importers keep compiling — school-specific
 * values have simply been neutralised.
 */
export const SITE = {
  name: PRODUCT.name,
  tagline: "Complete School Management. Configured for Your School.",
  subtitle:
    "A configurable school management platform for administration, academics, communication and finance.",
  phone: "",
  whatsappLink: "",
  address: "",
  addressLine2: "",
  city: "",
  email: PRODUCT.supportEmail,
  grades: "",
  curriculum: "",
  fees: {
    gradeRRto7: "",
    grade8to11: "",
    registration: "",
    sportsLevy: "",
  },
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Modules", href: "/#modules" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Demo", href: "/#demo" },
  { label: "Contact", href: "/contact" },
];
