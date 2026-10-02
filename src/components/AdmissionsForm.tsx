"use client";

import { useState, useEffect } from "react";
import { SITE } from "@/lib/constants";
import {
  Send,
  CheckCircle,
  MessageSquare,
  Phone,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";

const GRADES = [
  "Grade RR",
  "Grade R",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
];

interface FormState {
  parentName: string;
  phone: string;
  email: string;
  childName: string;
  grade: string;
  preferredContact: string;
  schoolVisit: boolean;
  message: string;
  source: string;
  honeypot: string;
}

interface FormErrors {
  parentName?: string;
  phone?: string;
  grade?: string;
  email?: string;
}

const INITIAL: FormState = {
  parentName: "",
  phone: "",
  email: "",
  childName: "",
  grade: "",
  preferredContact: "whatsapp",
  schoolVisit: false,
  message: "",
  source: "website",
  honeypot: "",
};

export default function AdmissionsForm({
  preselectedGrade,
  source,
  phone,
  whatsappLink,
}: {
  preselectedGrade?: string;
  source?: string;
  phone?: string;
  whatsappLink?: string;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const contactPhone = phone || SITE.phone;
  const contactWhatsApp = whatsappLink || SITE.whatsappLink;

  useEffect(() => {
    if (preselectedGrade) {
      setForm((prev) => ({ ...prev, grade: preselectedGrade }));
    }
  }, [preselectedGrade]);

  useEffect(() => {
    if (source) {
      setForm((prev) => ({ ...prev, source }));
    }
  }, [source]);

  const validate = (f: FormState): FormErrors => {
    const e: FormErrors = {};
    if (!f.parentName.trim()) e.parentName = "Please enter your name.";
    if (!f.phone.trim()) {
      e.phone = "Please enter your phone number.";
    } else {
      const cleaned = f.phone.replace(/[\s\-\(\)\+]/g, "");
      if (!/^(0[6-8]\d{8}|27[6-8]\d{8})$/.test(cleaned)) {
        e.phone = "Please enter a valid South African phone number.";
      }
    }
    if (!f.grade) e.grade = "Please select a grade.";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      e.email = "Please enter a valid email address.";
    }
    return e;
  };

  const handleChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field as string]) {
      const newErrors = validate({ ...form, [field]: value });
      setErrors(newErrors);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate(form);
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (form.honeypot) return;

    const newErrors = validate(form);
    setErrors(newErrors);
    setTouched({
      parentName: true,
      phone: true,
      grade: true,
      email: true,
    });

    if (Object.keys(newErrors).length > 0) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: form.parentName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          childName: form.childName.trim() || undefined,
          grade: form.grade,
          preferredContact: form.preferredContact,
          schoolVisitRequested: form.schoolVisit,
          message: form.message.trim() || undefined,
          source: form.source,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-brand-mid/30 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-brand-dark mb-3">
          Thank You!
        </h3>
        <p className="text-brand-gray mb-8 max-w-md mx-auto">
          Thank you for your enquiry. Our admissions team will
          review it and get in touch with you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {contactWhatsApp && (
            <a
              href={contactWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Admissions
            </a>
          )}
          {contactPhone && (
            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call the School
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot */}
      <div className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.honeypot}
          onChange={(e) => handleChange("honeypot", e.target.value)}
        />
      </div>

      {/* Error banner */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>
            <p className="text-xs text-red-600 mt-1">
              {contactWhatsApp ? (
                <>
                  Please try again or contact the school directly on{" "}
                  <a href={contactWhatsApp} className="underline" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                  .
                </>
              ) : (
                "Please try again or contact the school directly."
              )}
            </p>
          </div>
        </div>
      )}

      {/* Parent Name */}
      <div>
        <label htmlFor="parentName" className="block text-sm font-medium text-brand-dark mb-2">
          Parent / Guardian Full Name <span className="text-brand-red">*</span>
        </label>
        <input
          id="parentName"
          type="text"
          value={form.parentName}
          onChange={(e) => handleChange("parentName", e.target.value)}
          onBlur={() => handleBlur("parentName")}
          placeholder="e.g. Thabo Mokoena"
          className={`w-full px-4 py-3 bg-brand-light rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 transition-all ${
            touched.parentName && errors.parentName
              ? "ring-red-300 focus:ring-red-300"
              : "focus:ring-brand-red/20"
          }`}
        />
        {touched.parentName && errors.parentName && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.parentName}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-brand-dark mb-2">
          WhatsApp / Mobile Number <span className="text-brand-red">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder="e.g. 082 815 4388"
          className={`w-full px-4 py-3 bg-brand-light rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 transition-all ${
            touched.phone && errors.phone
              ? "ring-red-300 focus:ring-red-300"
              : "focus:ring-brand-red/20"
          }`}
        />
        {touched.phone && errors.phone && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-2">
          Email Address <span className="text-brand-gray font-normal">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          placeholder="e.g. thabo@example.com"
          className={`w-full px-4 py-3 bg-brand-light rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 transition-all ${
            touched.email && errors.email
              ? "ring-red-300 focus:ring-red-300"
              : "focus:ring-brand-red/20"
          }`}
        />
        {touched.email && errors.email && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Child Name */}
      <div>
        <label htmlFor="childName" className="block text-sm font-medium text-brand-dark mb-2">
          Child&apos;s First Name <span className="text-brand-gray font-normal">(optional)</span>
        </label>
        <input
          id="childName"
          type="text"
          value={form.childName}
          onChange={(e) => handleChange("childName", e.target.value)}
          placeholder="e.g. Lerato"
          className="w-full px-4 py-3 bg-brand-light rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
        />
      </div>

      {/* Grade */}
      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-brand-dark mb-2">
          Grade Applying For <span className="text-brand-red">*</span>
        </label>
        <select
          id="grade"
          value={form.grade}
          onChange={(e) => handleChange("grade", e.target.value)}
          onBlur={() => handleBlur("grade")}
          className={`w-full px-4 py-3 bg-brand-light rounded-xl text-sm text-brand-dark focus:outline-none focus:ring-2 transition-all appearance-none ${
            !form.grade ? "text-brand-gray/50" : ""
          } ${touched.grade && errors.grade ? "ring-red-300 focus:ring-red-300" : "focus:ring-brand-red/20"}`}
        >
          <option value="" disabled>
            Select a grade
          </option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {touched.grade && errors.grade && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.grade}
          </p>
        )}
      </div>

      {/* Preferred Contact */}
      <div>
        <span className="block text-sm font-medium text-brand-dark mb-3">
          Preferred Contact Method
        </span>
        <div className="flex gap-3">
          {[
            { value: "whatsapp", label: "WhatsApp" },
            { value: "phone", label: "Phone" },
            { value: "email", label: "Email" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                form.preferredContact === opt.value
                  ? "border-brand-red bg-brand-red/5 text-brand-red"
                  : "border-brand-mid/50 bg-white text-brand-gray hover:border-brand-red/30"
              }`}
            >
              <input
                type="radio"
                name="preferredContact"
                value={opt.value}
                checked={form.preferredContact === opt.value}
                onChange={(e) => handleChange("preferredContact", e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* School Visit */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={form.schoolVisit}
            onChange={(e) => handleChange("schoolVisit", e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 rounded border-2 border-brand-mid/50 peer-checked:border-brand-red peer-checked:bg-brand-red transition-colors flex items-center justify-center">
            {form.schoolVisit && (
              <CheckCircle className="w-3 h-3 text-white" />
            )}
          </div>
        </div>
        <span className="text-sm text-brand-dark">
          I&apos;d like to arrange a school visit
        </span>
      </label>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-brand-dark mb-2">
          Message <span className="text-brand-gray font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          value={form.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder="How can we help?"
          rows={3}
          className="w-full px-4 py-3 bg-brand-light rounded-xl text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all resize-none"
        />
      </div>

      {/* Privacy */}
      <p className="text-xs text-brand-gray">
        Your information will be used to respond to your
        enquiry. We do not share your data with third parties.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 disabled:hover:bg-brand-red text-white font-semibold px-6 py-4 rounded-xl transition-all text-sm"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending enquiry...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Start Admissions Enquiry
          </>
        )}
      </button>
    </form>
  );
}
