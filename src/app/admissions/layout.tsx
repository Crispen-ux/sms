import type { Metadata } from "next";
import { SITE_URL } from "@/config/product";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Submit an admissions enquiry and our team will get in touch with the next steps for enrolment.",
  openGraph: {
    title: "Admissions",
    description:
      "Submit an admissions enquiry and our team will get in touch with the next steps for enrolment.",
    type: "website",
    locale: "en_ZA",
  },
  alternates: {
    canonical: `${SITE_URL}/admissions`,
  },
};

export default function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
