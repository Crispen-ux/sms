import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import ThemeInjector from "@/components/ThemeInjector";
import { ToastProvider } from "@/components/ui";
import { PRODUCT, SITE_URL } from "@/config/product";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PRODUCT.name} | School Management System`,
    template: `%s | ${PRODUCT.name}`,
  },
  description:
    "A configurable school management platform for student administration, academics, staff, communication, finance and everyday school operations.",
  keywords: [
    "school management system",
    "school administration software",
    "student information system",
    "school management platform",
    "school software South Africa",
    "attendance tracking",
    "school invoicing",
    "parent communication",
  ],
  openGraph: {
    title: `${PRODUCT.name} | School Management System`,
    description:
      "A configurable school management platform for student administration, academics, staff, communication, finance and everyday school operations.",
    url: siteUrl,
    siteName: PRODUCT.name,
    type: "website",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRODUCT.name} | School Management System`,
    description:
      "A configurable school management platform for student administration, academics, staff, communication, finance and everyday school operations.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "A configurable school management platform for student administration, academics, staff, communication, finance and everyday school operations.",
  url: siteUrl,
  softwareVersion: PRODUCT.version,
  author: {
    "@type": "Organization",
    name: PRODUCT.companyName,
    url: PRODUCT.companyWebsite,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "ZAR",
    description: "Pricing is quoted per school — contact us for a tailored quote.",
  },
};

/**
 * Injects product-level colour overrides from the environment before paint
 * so there is no flash of default colours on branded deployments.
 */
const colorBootstrap = `
(function () {
  try {
    var root = document.documentElement;
    var p = ${JSON.stringify(PRODUCT.primaryColor)};
    var s = ${JSON.stringify(PRODUCT.secondaryColor)};
    if (p) root.style.setProperty("--brand-primary", p);
    if (s) root.style.setProperty("--brand-secondary", s);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script dangerouslySetInnerHTML={{ __html: colorBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Providers>
          <ToastProvider>
            <ThemeInjector />
            <LayoutWrapper>{children}</LayoutWrapper>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
