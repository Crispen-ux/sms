"use client";

import Link from "next/link";
import { PRODUCT, PRODUCT_VERSION_LABEL } from "@/config/product";
import { Mail, Globe, LogIn, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

const FOOTER_LINKS = [
  { label: "Modules", href: "/#modules" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Demo", href: "/#demo" },
  { label: "Contact", href: "/contact" },
  { label: "Portal Login", href: "/login" },
];

export default function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <footer className="relative bg-brand-dark text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link
                href="/"
                className="flex items-center gap-3 mb-5"
                aria-label={`${PRODUCT.name} — Home`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white font-extrabold text-lg"
                >
                  C
                </span>
                <span>
                  <span className="block font-bold text-white text-sm leading-tight">
                    {PRODUCT.name}
                  </span>
                  <span className="block text-[10px] text-white/50 font-medium tracking-widest uppercase">
                    by {PRODUCT.companyName}
                  </span>
                </span>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Complete School Management. Configured for Your School.
              </p>
              <p className="text-white/40 text-xs font-medium tracking-wide">
                {PRODUCT_VERSION_LABEL}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-5">
                {PRODUCT.companyName}
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Globe
                    className="w-4 h-4 text-brand-red shrink-0"
                    aria-hidden="true"
                  />
                  <a
                    href={PRODUCT.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-white text-sm transition-colors"
                    aria-label={`Visit ${PRODUCT.companyWebsite}`}
                  >
                    {PRODUCT.companyWebsite.replace(/^https?:\/\//, "")}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail
                    className="w-4 h-4 text-brand-red shrink-0"
                    aria-hidden="true"
                  />
                  <a
                    href={`mailto:${PRODUCT.supportEmail}`}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                    aria-label={`Email ${PRODUCT.supportEmail}`}
                  >
                    {PRODUCT.supportEmail}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <LogIn
                    className="w-4 h-4 text-brand-red shrink-0"
                    aria-hidden="true"
                  />
                  <Link
                    href="/login"
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    Portal Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-5">
                Talk to {PRODUCT.companyName}
              </h3>
              <p className="text-white/50 text-sm mb-5 leading-relaxed">
                Tell us which modules your school needs and we&apos;ll discuss
                deployment, configuration, training and support.
              </p>
              <Link
                href="/contact"
                className="btn-primary text-sm w-full justify-center"
              >
                Request a Demo / Quote
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/40 text-sm">
                &copy; {new Date().getFullYear()} {PRODUCT.companyName}. All
                rights reserved.
              </p>
              <p className="text-white/40 text-sm">{PRODUCT_VERSION_LABEL}</p>
            </div>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-5 z-40 w-12 h-12 bg-brand-dark rounded-full flex items-center justify-center shadow-lg transition-all duration-500 hover:bg-brand-red ${
          showTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5 text-white" aria-hidden="true" />
      </button>
    </>
  );
}
