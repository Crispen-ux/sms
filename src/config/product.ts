/**
 * Central product configuration.
 *
 * The product name, company identity, version and default brand colours are
 * defined HERE and can be overridden per deployment through environment
 * variables (.env) without touching source code.
 *
 * Both `PRODUCT_NAME` (server-side) and `NEXT_PUBLIC_PRODUCT_NAME`
 * (client-side) forms are supported. Values needed in the browser should use
 * the NEXT_PUBLIC_ prefix so they are inlined at build time.
 */

const PRODUCT_NAME =
  process.env.NEXT_PUBLIC_PRODUCT_NAME ?? process.env.PRODUCT_NAME ?? "Cretek SchoolOS";
const PRODUCT_VERSION =
  process.env.NEXT_PUBLIC_PRODUCT_VERSION ?? process.env.PRODUCT_VERSION ?? "1.0.0";
const COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME ?? process.env.COMPANY_NAME ?? "Cretek";
const COMPANY_WEBSITE =
  process.env.NEXT_PUBLIC_COMPANY_WEBSITE ?? process.env.COMPANY_WEBSITE ?? "https://cretekgroup.co.za";
const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? process.env.SUPPORT_EMAIL ?? "info@cretekgroup.co.za";
const PRODUCT_LOGO =
  process.env.NEXT_PUBLIC_PRODUCT_LOGO ?? process.env.PRODUCT_LOGO ?? "/favicon.svg";
const PRIMARY_COLOR =
  process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? process.env.PRIMARY_COLOR ?? "#D10000";
const SECONDARY_COLOR =
  process.env.NEXT_PUBLIC_SECONDARY_COLOR ?? process.env.SECONDARY_COLOR ?? "#1A1A1A";

export interface ProductConfig {
  /** e.g. "Cretek SchoolOS" */
  name: string;
  /** e.g. "1.0.0" — every deployment can identify the version it runs */
  version: string;
  /** e.g. "Cretek" */
  companyName: string;
  /** e.g. "https://cretekgroup.co.za" */
  companyWebsite: string;
  /** e.g. "info@cretekgroup.co.za" */
  supportEmail: string;
  /** Product logo shown on the marketing site and unbranded surfaces */
  logo: string;
  /** Default primary brand colour (overridable per school) */
  primaryColor: string;
  /** Default secondary brand colour (overridable per school) */
  secondaryColor: string;
}

export const PRODUCT: ProductConfig = {
  name: PRODUCT_NAME,
  version: PRODUCT_VERSION,
  companyName: COMPANY_NAME,
  companyWebsite: COMPANY_WEBSITE,
  supportEmail: SUPPORT_EMAIL,
  logo: PRODUCT_LOGO,
  primaryColor: PRIMARY_COLOR,
  secondaryColor: SECONDARY_COLOR,
};

/** "Cretek SchoolOS v1.0.0" */
export const PRODUCT_VERSION_LABEL = `${PRODUCT.name} v${PRODUCT.version}`;

/** Site URL used for SEO metadata, canonical URLs and the sitemap. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
