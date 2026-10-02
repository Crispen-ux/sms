import type { Metadata } from "next";
import { PRODUCT, SITE_URL } from "@/config/product";

const pageTitle = "Contact";
const pageDescription = `Request a demo or quote for ${PRODUCT.name}, the configurable school management platform. Email ${PRODUCT.supportEmail} or send an enquiry about modules, deployment, training and support.`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: `${pageTitle} | ${PRODUCT.name}`,
    description: pageDescription,
    type: "website",
    locale: "en_ZA",
    url: `${SITE_URL}/contact`,
    siteName: PRODUCT.name,
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
