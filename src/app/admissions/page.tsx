"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useInView } from "@/lib/useInView";
import { SITE } from "@/lib/constants";
import { PRODUCT } from "@/config/product";
import AdmissionsForm from "@/components/AdmissionsForm";
import {
  Search,
  MessageSquare,
  Phone,
  MapPin,
  Eye,
  FileText,
  PartyPopper,
} from "lucide-react";

interface SchoolIdentity {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
}

const processSteps = [
  {
    icon: Search,
    title: "Enquire",
    desc: "Tell us about your child and your family's needs.",
  },
  {
    icon: MessageSquare,
    title: "Speak With Our Team",
    desc: "Our admissions team helps you with the next steps.",
  },
  {
    icon: Eye,
    title: "Visit the School",
    desc: "Arrange a school visit to meet our team and see our classrooms.",
  },
  {
    icon: FileText,
    title: "Apply",
    desc: "Complete the required application process and submit documents.",
  },
  {
    icon: PartyPopper,
    title: "Get Enrolled",
    desc: "Welcome aboard. Your child's journey begins.",
  },
];

function AdmissionsContent() {
  const searchParams = useSearchParams();
  const preselectedGrade = searchParams.get("grade") || undefined;
  const source = searchParams.get("source") || undefined;

  const [school, setSchool] = useState<SchoolIdentity | null>(null);

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((data) => setSchool(data?.school ?? null))
      .catch(() => setSchool(null));
  }, []);

  const schoolName = school?.name || PRODUCT.name;
  const phone = school?.phone || SITE.phone;
  const email = school?.email || PRODUCT.supportEmail;
  const whatsappLink = school?.phone
    ? `https://wa.me/${school.phone.replace(/\D/g, "")}`
    : SITE.whatsappLink;
  const address = school
    ? [school.address, school.city].filter(Boolean).join(", ")
    : null;  const [heroRef, heroInView] = useInView(0.1);
  const [processRef, processInView] = useInView(0.1);
  const [formRef, formInView] = useInView(0.1);
  const [contactRef, contactInView] = useInView(0.15);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        ref={heroRef}
        className="hero-section relative min-h-[100vh] flex items-center overflow-hidden bg-[#D10000]"
      >
        {/* Decorative accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div
            className={`max-w-2xl text-left transition-all duration-700 ${
              heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {school?.logoUrl && (
              <img
                src={school.logoUrl}
                alt={schoolName}
                className="h-14 w-auto mb-6 bg-white rounded-xl p-2"
              />
            )}
            <span className="text-eyebrow text-white tracking-[0.2em] mb-4 block">
              Admissions Enquiry
            </span>
            <h1 className="text-display text-white mb-6">
              Start Your Child&apos;s Journey
            </h1>
            <p className="text-xl text-white mb-8">
              Interested in joining {schoolName}? Tell us a little about your
              child and our team will help you with the next steps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#enquiry-form"
                className="btn-primary"
              >
                Start Your Enquiry
              </a>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section ref={processRef} className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
              How Admissions Works
            </h2>
            <p className="text-brand-gray max-w-xl mx-auto">
              A simple, straightforward process to welcome your child.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {processSteps.map((step, i) => (
              <div
                key={step.title}
                className={`text-center transition-all duration-700 ${
                  processInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="relative inline-block mb-4">
                  <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center mx-auto">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-dark text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-brand-dark text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-brand-gray leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section id="enquiry-form" ref={formRef} className="py-20 bg-brand-light scroll-mt-20">
        <div
          className={`mx-auto max-w-2xl px-6 transition-all duration-700 ${
            formInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
              Start Your Enquiry
            </h2>
            <p className="text-brand-gray max-w-lg mx-auto">
              Tell us about your child and we&apos;ll get back to you with the next
              steps.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-brand-mid/30">
            <AdmissionsForm
              preselectedGrade={preselectedGrade}
              source={source}
              phone={phone || undefined}
              whatsappLink={whatsappLink || undefined}
            />
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section ref={contactRef} className="py-20 bg-brand-dark text-white">
        <div className="mx-auto max-w-5xl px-6">
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              contactInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Prefer to Talk Directly?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Our admissions team is ready to answer your questions.
            </p>
            {address && (
              <p className="text-white/40 text-sm mt-3">{address}</p>
            )}
          </div>
          <div
            className={`grid sm:grid-cols-3 gap-6 transition-all duration-700 ${
              contactInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-center transition-all group"
              >
                <div className="w-12 h-12 bg-[#25D366]/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#25D366]/30 transition-colors">
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                </div>
                <p className="font-semibold mb-1">WhatsApp Us</p>
                <p className="text-sm text-white/50">Quick responses</p>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-center transition-all group"
              >
                <div className="w-12 h-12 bg-brand-red/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-red/30 transition-colors">
                  <Phone className="w-5 h-5 text-brand-red-light" />
                </div>
                <p className="font-semibold mb-1">Call Us</p>
                <p className="text-sm text-white/50">{phone}</p>
              </a>
            )}
            <a
              href={`mailto:${email}`}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-center transition-all group"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/15 transition-colors">
                <MapPin className="w-5 h-5 text-white/70" />
              </div>
              <p className="font-semibold mb-1">Email Us</p>
              <p className="text-sm text-white/50">{email}</p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-brand-gray">Loading...</div>
        </div>
      }
    >
      <AdmissionsContent />
    </Suspense>
  );
}
