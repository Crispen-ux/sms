"use client";

import { useState } from "react";
import Link from "next/link";
import { MODULES, MODULE_CATEGORIES } from "@/lib/modules";
import { PRODUCT } from "@/config/product";
import {
  ArrowRight,
  Check,
  Globe,
  Info,
  LogIn,
  Mail,
  Send,
} from "lucide-react";

const coreModules = MODULES.filter((m) => m.core);

const inputClasses =
  "w-full px-4 py-2.5 bg-brand-light border border-transparent rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red/30 transition-all";

function FieldLabel({
  htmlFor,
  children,
  required = false,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-brand-dark">
        {children}
        {required && (
          <span className="text-brand-red ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <span className="text-xs text-brand-gray">{hint}</span>}
    </div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const toggleModule = (id: string) =>
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !school.trim() || !email.trim() || !message.trim()) {
      setError("Please complete your name, school name, email and message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);

    const selectedNames = MODULES.filter((m) => modules.includes(m.id)).map(
      (m) => m.name
    );

    const body = [
      `Name: ${name.trim()}`,
      `School: ${school.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim() || "-"}`,
      "",
      "Modules of interest:",
      selectedNames.length > 0
        ? selectedNames.map((n) => `- ${n}`).join("\n")
        : "- Not specified yet",
      "",
      "Message:",
      message.trim(),
      "",
      `— Sent from the ${PRODUCT.name} website`,
    ].join("\n");

    const subject = `Demo / Quote request — ${school.trim()}`;
    const href = `mailto:${PRODUCT.supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    setStatus(
      "Opening your email application with the details filled in — press send there to complete your request."
    );
    window.location.href = href;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-dark text-white">
        <div className="absolute inset-0 gradient-hero" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 lg:pt-40 lg:pb-20">
          <p className="text-eyebrow text-white/60 flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-white/40" />
            Contact {PRODUCT.companyName}
          </p>
          <h1 className="text-display mt-6 max-w-3xl">Request a Demo or Quote</h1>
          <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-2xl">
            Tell us about your school and which parts of {PRODUCT.name} you would
            like to see. We will arrange a demonstration and come back to you with a
            quote for your requirements.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a href="#enquiry-form" className="btn-primary justify-center">
              Send an enquiry
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <Link href="/login" className="btn-secondary justify-center">
              Explore the Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Form + direct contact */}
      <section className="py-16 lg:py-24 bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
            {/* Enquiry form */}
            <div className="lg:col-span-3">
              <div
                id="enquiry-form"
                className="scroll-mt-28 rounded-3xl bg-white border border-brand-mid/60 shadow-editorial p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-brand-dark">
                      Send an enquiry
                    </h2>
                    <p className="mt-1 text-sm text-brand-gray">
                      Fields marked <span className="text-brand-red">*</span> are
                      required.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-light border border-brand-mid/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-gray">
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    {PRODUCT.supportEmail}
                  </span>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <FieldLabel htmlFor="contact-name" required>
                        Full name
                      </FieldLabel>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={`mt-1.5 ${inputClasses}`}
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="contact-school" required>
                        School name
                      </FieldLabel>
                      <input
                        id="contact-school"
                        name="school"
                        type="text"
                        autoComplete="organization"
                        required
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="Your school"
                        className={`mt-1.5 ${inputClasses}`}
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="contact-email" required>
                        Email address
                      </FieldLabel>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.co.za"
                        className={`mt-1.5 ${inputClasses}`}
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="contact-phone" hint="Optional">
                        Phone number
                      </FieldLabel>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="012 345 6789"
                        className={`mt-1.5 ${inputClasses}`}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <FieldLabel htmlFor="contact-message" required>
                      Message
                    </FieldLabel>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what your school needs — number of learners, modules you are interested in, timelines, or anything else."
                      className={`mt-1.5 resize-y ${inputClasses}`}
                    />
                  </div>

                  {/* Module selection */}
                  <fieldset className="mt-7">
                    <legend className="text-sm font-medium text-brand-dark p-0">
                      Modules you are interested in
                      <span className="text-brand-gray font-normal"> (optional)</span>
                    </legend>
                    <p className="mt-1 text-xs text-brand-gray">
                      Core modules are part of every installation and are always
                      included.
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-eyebrow text-brand-gray mb-2">Core</p>
                        <div className="flex flex-wrap gap-2">
                          {coreModules.map((mod) => (
                            <span
                              key={mod.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand-light border border-brand-mid/60 px-3 py-1.5 text-xs font-medium text-brand-gray"
                            >
                              <Check
                                className="w-3.5 h-3.5 text-brand-red"
                                aria-hidden="true"
                              />
                              {mod.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {MODULE_CATEGORIES.filter((c) => c !== "Core").map(
                        (category) => (
                          <div key={category}>
                            <p className="text-eyebrow text-brand-gray mb-2">
                              {category}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {MODULES.filter((m) => m.category === category).map(
                                (mod) => {
                                  const on = modules.includes(mod.id);
                                  return (
                                    <label
                                      key={mod.id}
                                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer text-sm transition-all duration-200 ${
                                        on
                                          ? "border-brand-red/40 bg-brand-red/5"
                                          : "border-brand-mid/60 bg-white hover:border-brand-gray/40"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        name="modules"
                                        value={mod.id}
                                        checked={on}
                                        onChange={() => toggleModule(mod.id)}
                                        className="h-4 w-4 shrink-0 rounded border-brand-mid accent-brand-red focus:ring-brand-red/30"
                                      />
                                      <span className="text-brand-dark font-medium truncate">
                                        {mod.name}
                                      </span>
                                    </label>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </fieldset>

                  {error && (
                    <p
                      role="alert"
                      className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}

                  <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      type="submit"
                      className="btn-primary justify-center sm:w-auto"
                    >
                      Send request
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <p className="text-xs text-brand-gray leading-relaxed">
                      Submitting opens your email application with everything
                      pre-filled. Nothing is sent until you press send.
                    </p>
                  </div>

                  <p role="status" aria-live="polite" className="sr-only">
                    {status}
                  </p>

                  {status && (
                    <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-light border border-brand-mid/60 px-4 py-3 text-sm text-brand-gray">
                      <Info
                        className="w-4 h-4 shrink-0 mt-0.5 text-brand-red"
                        aria-hidden="true"
                      />
                      {status}
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* Direct contact options */}
            <aside className="lg:col-span-2 space-y-5">
              <div className="rounded-3xl bg-brand-dark text-white p-6 sm:p-7">
                <h2 className="text-lg font-semibold">Contact us directly</h2>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  Prefer to skip the form? Reach {PRODUCT.companyName} through any
                  of these channels.
                </p>

                <ul className="mt-6 space-y-3">
                  <li>
                    <a
                      href={`mailto:${PRODUCT.supportEmail}`}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 hover:border-brand-red/40 hover:bg-white/10 transition-all"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/20 text-brand-red-light"
                      >
                        <Mail className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wider text-white/50">
                          Email
                        </span>
                        <span className="block text-sm font-semibold truncate">
                          {PRODUCT.supportEmail}
                        </span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={PRODUCT.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 hover:border-brand-red/40 hover:bg-white/10 transition-all"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/20 text-brand-red-light"
                      >
                        <Globe className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wider text-white/50">
                          Website
                        </span>
                        <span className="block text-sm font-semibold truncate">
                          {PRODUCT.companyWebsite.replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 hover:border-brand-red/40 hover:bg-white/10 transition-all"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/20 text-brand-red-light"
                      >
                        <LogIn className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wider text-white/50">
                          Existing school
                        </span>
                        <span className="block text-sm font-semibold">
                          Portal Login
                        </span>
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl bg-white border border-brand-mid/60 p-6 sm:p-7">
                <h2 className="text-lg font-semibold text-brand-dark">
                  What happens next
                </h2>
                <ol className="mt-5 space-y-4">
                  {[
                    {
                      title: "We reply to your enquiry",
                      body: `A member of the ${PRODUCT.companyName} team gets back to you using the details you provide.`,
                    },
                    {
                      title: "We walk you through the system",
                      body: "You see the modules that matter to your school in a dedicated demonstration environment.",
                    },
                    {
                      title: "You receive a quote",
                      body: "Pricing reflects your modules, deployment, configuration, training and support.",
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-white text-xs font-bold"
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm text-brand-gray leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
