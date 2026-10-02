"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card, PageHeader, Button, Input, Badge,
} from "@/components/ui";
import {
  Save, Building2, Palette, Mail, FileText, Settings2,
  Upload, X, CheckCircle, AlertCircle, Loader2,
  CreditCard, GraduationCap, Shield, Bell, Trash2, Image, Layers,
} from "lucide-react";
import ModulesSection from "./ModulesSection";
import { PRODUCT } from "@/config/product";

// ─── Types ──────────────────────────────────────────────

interface SchoolSettings {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  accentColor: string;
  secondaryColor: string;
  fontFamily: string;
  invoicePrefix: string;
  invoiceNotes: string | null;
  invoiceTerms: string | null;
  currency: string;
  currencySymbol: string;
  emailSignature: string | null;
  emailFooter: string | null;
  principalName: string | null;
  principalTitle: string | null;
}

type Tab = "general" | "branding" | "modules" | "email" | "invoices" | "reports" | "system";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "modules", label: "Modules", icon: Layers },
  { id: "email", label: "Email Templates", icon: Mail },
  { id: "invoices", label: "Invoice Templates", icon: CreditCard },
  { id: "reports", label: "Report Cards", icon: GraduationCap },
  { id: "system", label: "System", icon: Settings2 },
];

const FONTS = [
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "'Segoe UI', system-ui, sans-serif", label: "Segoe UI" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
];

const COLORS = [
  { value: "#D10000", label: "Brand Red" },
  { value: "#1E40AF", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#D97706", label: "Amber" },
  { value: "#0891B2", label: "Cyan" },
  { value: "#1A1A1A", label: "Dark" },
  { value: "#6B7280", label: "Gray" },
];

// ─── Page ───────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        setError("Failed to load settings");
      }
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Settings saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save settings");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const res = await fetch("/api/settings/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: dataUri }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        const { logoUrl } = await res.json();
        setSettings((s) => (s ? { ...s, logoUrl } : s));
        setSuccess("Logo uploaded successfully");
        setTimeout(() => setSuccess(""), 3000);
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setError(e.message || "Failed to upload logo");
      setTimeout(() => setError(""), 3000);
      setUploadingLogo(false);
    }
    e.target.value = "";
  };

  const handleRemoveLogo = async () => {
    try {
      await fetch("/api/settings/logo", { method: "DELETE" });
      setSettings((s) => (s ? { ...s, logoUrl: null } : s));
      setSuccess("Logo removed");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to remove logo");
      setTimeout(() => setError(""), 3000);
    }
  };

  const updateField = (field: keyof SchoolSettings, value: string) => {
    setSettings((s) => (s ? { ...s, [field]: value } : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-brand-gray">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage school information, branding, and document templates."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-light rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-gray hover:text-brand-dark"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── General Tab ───────────────────────────────── */}
      {activeTab === "general" && (
        <Card>
          <div className="p-5 border-b border-brand-mid/30">
            <h2 className="text-lg font-semibold text-brand-dark">School Information</h2>
            <p className="text-sm text-brand-gray mt-1">Basic information about your school.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="School Name" value={settings.name} onChange={(e) => updateField("name", e.target.value)} required />
              <Input label="Phone" value={settings.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="+27" />
              <Input label="Email" type="email" value={settings.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="school@example.co.za" />
              <Input label="Website" value={settings.website || ""} onChange={(e) => updateField("website", e.target.value)} placeholder="https://www.yourschool.co.za" />
            </div>
            <Input label="Street Address" value={settings.address || ""} onChange={(e) => updateField("address", e.target.value)} />
            <Input label="City" value={settings.city || ""} onChange={(e) => updateField("city", e.target.value)} placeholder="Johannesburg" />
          </div>
        </Card>
      )}

      {/* ── Branding Tab ──────────────────────────────── */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">School Logo</h2>
              <p className="text-sm text-brand-gray mt-1">Upload your school logo. Used on documents, invoices, and email headers.</p>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-brand-mid/40 flex items-center justify-center bg-brand-light/50 overflow-hidden shrink-0">
                  {settings.logoUrl ? (
                    <div className="relative w-full h-full group">
                      <img src={settings.logoUrl} alt="School Logo" className="w-full h-full object-contain p-2" />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 p-1 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="w-8 h-8 text-brand-gray/40 mx-auto mb-2" />
                      <p className="text-xs text-brand-gray/60">No logo</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {uploadingLogo ? "Uploading..." : settings.logoUrl ? "Replace Logo" : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-brand-gray mt-2">PNG, JPG or SVG. Max 2MB. Recommended: 400x400px</p>
                  {settings.logoUrl && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="mt-2 text-red-500 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Remove Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Colors & Typography */}
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">Colors & Typography</h2>
              <p className="text-sm text-brand-gray mt-1">Customize the look and feel of documents and emails.</p>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-2">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => updateField("accentColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-brand-mid/30 cursor-pointer"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => updateField("accentColor", c.value)}
                          className={`w-7 h-7 rounded-lg border-2 transition-all ${
                            settings.accentColor === c.value ? "border-brand-dark scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-brand-mid/30 cursor-pointer"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => updateField("secondaryColor", c.value)}
                          className={`w-7 h-7 rounded-lg border-2 transition-all ${
                            settings.secondaryColor === c.value ? "border-brand-dark scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-2">Document Font</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateField("fontFamily", e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 bg-brand-light rounded-xl text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-brand-mid/30 bg-white">
                <p className="text-xs text-brand-gray mb-2 uppercase tracking-wide">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: settings.accentColor }}>P</div>
                  <div>
                    <p className="font-semibold" style={{ color: settings.secondaryColor, fontFamily: settings.fontFamily }}>{settings.name || "Your School"}</p>
                    <p className="text-sm text-brand-gray" style={{ fontFamily: settings.fontFamily }}>Excellence in Education</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Email Templates Tab ───────────────────────── */}
      {activeTab === "modules" && <ModulesSection />}

      {activeTab === "email" && (
        <div className="space-y-6">
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">Email Signature</h2>
              <p className="text-sm text-brand-gray mt-1">Appended to the bottom of all outgoing emails.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">Signature</label>
                <textarea
                  value={settings.emailSignature || ""}
                  onChange={(e) => updateField("emailSignature", e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-brand-light rounded-xl text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all resize-none"
                  placeholder="Kind regards,&#10;Your Name&#10;Your School Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">Email Footer</label>
                <Input
                  value={settings.emailFooter || ""}
                  onChange={(e) => updateField("emailFooter", e.target.value)}
                  placeholder="Your School Name · Street Address, City"
                />
              </div>
            </div>
          </Card>

          {/* Email Preview */}
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">Email Preview</h2>
              <p className="text-sm text-brand-gray mt-1">How your emails will look to recipients.</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-brand-mid/30 overflow-hidden max-w-lg">
                <div className="p-6 text-center" style={{ backgroundColor: settings.accentColor }}>
                  <p className="text-white font-semibold text-lg">{settings.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">Notification</p>
                </div>
                <div className="p-6">
                  <p className="text-sm text-brand-dark mb-3">Dear Parent,</p>
                  <p className="text-sm text-brand-gray mb-4">This is a sample notification email from {settings.name}.</p>
                  <div className="text-center my-4">
                    <span className="inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: settings.accentColor }}>
                      View Details
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4 text-center text-xs text-brand-gray border-t border-brand-mid/20" style={{ backgroundColor: "#F9FAFB" }}>
                  <p className="whitespace-pre-line">{settings.emailFooter || settings.address || settings.name || "Your School"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Invoice Templates Tab ─────────────────────── */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">Invoice Settings</h2>
              <p className="text-sm text-brand-gray mt-1">Configure how invoices appear and behave.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Invoice Prefix"
                  value={settings.invoicePrefix}
                  onChange={(e) => updateField("invoicePrefix", e.target.value)}
                  placeholder="INV"
                />
                <Input
                  label="Currency Code"
                  value={settings.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  placeholder="ZAR"
                />
                <Input
                  label="Currency Symbol"
                  value={settings.currencySymbol}
                  onChange={(e) => updateField("currencySymbol", e.target.value)}
                  placeholder="R"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">Invoice Notes</label>
                <textarea
                  value={settings.invoiceNotes || ""}
                  onChange={(e) => updateField("invoiceNotes", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-brand-light rounded-xl text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all resize-none"
                  placeholder="Payment is due within 30 days..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">Terms & Conditions</label>
                <textarea
                  value={settings.invoiceTerms || ""}
                  onChange={(e) => updateField("invoiceTerms", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-brand-light rounded-xl text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all resize-none"
                  placeholder="Late payments may incur..."
                />
              </div>
            </div>
          </Card>

          {/* Invoice Preview */}
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">Invoice Preview</h2>
              <p className="text-sm text-brand-gray mt-1">See how your invoices will look.</p>
            </div>
            <div className="p-5">
              <div className="rounded-2xl overflow-hidden bg-white max-w-2xl shadow-sm border border-brand-mid/20">
                {/* Header Bar */}
                <div className="flex items-center justify-between rounded-t-2xl overflow-hidden" style={{ backgroundColor: settings.secondaryColor }}>
                  <div className="flex items-center gap-3 px-8 py-6">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: settings.accentColor }}>
                        {settings.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-base">{settings.name}</p>
                      <p className="text-white/40 text-[10px]">{settings.phone || "Phone"} · {settings.email || "Email"}</p>
                    </div>
                  </div>
                  <div className="px-10 py-6">
                    <p className="text-3xl font-extrabold text-white tracking-widest">INVOICE</p>
                  </div>
                </div>
                {/* Accent Bar */}
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${settings.accentColor} 0%, ${settings.accentColor} 60%, transparent 100%)` }}></div>

                <div className="flex">
                  {/* Left */}
                  <div className="flex-1 px-8 py-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: settings.accentColor }}>Invoice To</p>
                    <p className="font-bold text-base text-brand-dark">Student Name</p>
                    <p className="text-[11px] text-brand-gray mt-0.5">Student #STU-001</p>
                    <div className="mt-5">
                      <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-1">Contact</p>
                      <p className="text-[11px] text-brand-gray">{settings.phone || "+27 82 815 4388"}</p>
                      <p className="text-[11px] text-brand-gray">{settings.email || "school@example.co.za"}</p>
                    </div>
                  </div>
                  {/* Right */}
                  <div className="w-[250px]">
                    <div className="px-6 py-5 border-l-2" style={{ borderColor: settings.accentColor, backgroundColor: "#F7FAFC" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: settings.accentColor }}>Invoice Details</p>
                      <p className="text-[10px] text-brand-gray uppercase tracking-wider">Invoice No</p>
                      <p className="text-xs font-bold text-brand-dark mb-2">{settings.invoicePrefix}-202609-0001</p>
                      <p className="text-[10px] text-brand-gray uppercase tracking-wider">Due Date</p>
                      <p className="text-xs font-semibold text-brand-gray mb-2">15 Oct, 2026</p>
                      <p className="text-[10px] text-brand-gray uppercase tracking-wider">Status</p>
                      <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-bold text-white bg-amber-500">PENDING</span>
                    </div>
                    <div className="px-6 py-4 border-l-2" style={{ borderColor: settings.secondaryColor, backgroundColor: "#F7FAFC" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: settings.secondaryColor }}>Payment Methods</p>
                      <p className="text-[10px] text-brand-gray uppercase tracking-wider">Account No</p>
                      <p className="text-[11px] font-semibold text-brand-gray">{settings.phone || "+27 82 815 4388"}</p>
                      <p className="text-[10px] text-brand-gray uppercase tracking-wider mt-1">Account Name</p>
                      <p className="text-[11px] font-semibold text-brand-gray">{settings.name}</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="px-8">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: settings.secondaryColor }}>
                        <th className="text-left text-white p-2.5 uppercase tracking-wider text-[10px]">No.</th>
                        <th className="text-left text-white p-2.5 uppercase tracking-wider text-[10px]">Item Description</th>
                        <th className="text-right text-white p-2.5 uppercase tracking-wider text-[10px]">Price</th>
                        <th className="text-center text-white p-2.5 uppercase tracking-wider text-[10px]">Qty</th>
                        <th className="text-right text-white p-2.5 uppercase tracking-wider text-[10px]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2.5 border-b border-brand-mid/15 text-brand-gray">01</td>
                        <td className="p-2.5 border-b border-brand-mid/15 font-medium text-brand-dark">Monthly Tuition — September 2026</td>
                        <td className="p-2.5 border-b border-brand-mid/15 text-right text-brand-gray">{settings.currencySymbol} 800.00</td>
                        <td className="p-2.5 border-b border-brand-mid/15 text-center text-brand-gray">1</td>
                        <td className="p-2.5 border-b border-brand-mid/15 text-right font-semibold text-brand-dark">{settings.currencySymbol} 800.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terms + Totals */}
                <div className="flex px-8 py-6 gap-8">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: settings.secondaryColor }}>Terms & Conditions</p>
                    <p className="text-[10px] text-brand-gray leading-relaxed">{settings.invoiceTerms || "Payment is due within 30 days of the invoice date."}</p>
                    <p className="text-[11px] font-semibold mt-4 text-brand-dark tracking-wide">THANK YOU FOR YOUR BUSINESS.</p>
                  </div>
                  <div className="w-56">
                    <div className="bg-brand-light/60 rounded-xl p-4">
                      <div className="flex justify-between text-xs py-1.5 border-b border-brand-mid/20">
                        <span className="text-brand-gray">Subtotal</span>
                        <span className="font-semibold text-brand-dark">{settings.currencySymbol} 800.00</span>
                      </div>
                      <div className="flex justify-between py-2 mt-1">
                        <span className="text-xs font-extrabold text-brand-dark">Total</span>
                        <span className="text-lg font-extrabold" style={{ color: settings.accentColor }}>{settings.currencySymbol} 800.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between px-8 py-3.5 rounded-b-2xl" style={{ backgroundColor: settings.secondaryColor }}>
                  <p className="text-[10px] text-white/40">{settings.phone || "Phone"} · {settings.email || "Email"}{settings.website ? ` · ${settings.website}` : ""}</p>
                  <p className="text-[10px] text-white/30">{settings.address || ""}{settings.city ? `, ${settings.city}` : ""}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Reports Tab ───────────────────────────────── */}
      {activeTab === "reports" && (
        <Card>
          <div className="p-5 border-b border-brand-mid/30">
            <h2 className="text-lg font-semibold text-brand-dark">Report Card Settings</h2>
            <p className="text-sm text-brand-gray mt-1">Configure how report cards appear.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Principal Name"
                value={settings.principalName || ""}
                onChange={(e) => updateField("principalName", e.target.value)}
                placeholder="e.g. Mr. John Smith"
              />
              <Input
                label="Principal Title"
                value={settings.principalTitle || ""}
                onChange={(e) => updateField("principalTitle", e.target.value)}
                placeholder="Principal"
              />
            </div>
            <div className="p-4 rounded-xl border border-brand-mid/30 bg-brand-light/50">
              <p className="text-sm text-brand-dark">
                The principal&apos;s name and title will appear on report cards and transcripts under the signature area.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── System Tab ────────────────────────────────── */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {/* System Info */}
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <h2 className="text-lg font-semibold text-brand-dark">System Information</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-brand-light/50">
                  <p className="text-xs text-brand-gray">Product</p>
                  <p className="text-sm font-semibold text-brand-dark">{PRODUCT.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-brand-light/50">
                  <p className="text-xs text-brand-gray">Version</p>
                  <p className="text-sm font-semibold text-brand-dark">{PRODUCT.version}</p>
                </div>
                <div className="p-3 rounded-xl bg-brand-light/50">
                  <p className="text-xs text-brand-gray">Environment</p>
                  <p className="text-sm font-semibold text-brand-dark">
                    {process.env.NODE_ENV === "production" ? "Production" : "Development"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-brand-light/50">
                  <p className="text-xs text-brand-gray">Database</p>
                  <p className="text-sm font-semibold text-green-600">Connected</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <div className="p-5 border-b border-brand-mid/30">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-brand-red" />
                <h2 className="text-lg font-semibold text-brand-dark">Security</h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-light/50">
                <div>
                  <p className="text-sm font-medium text-brand-dark">Password</p>
                  <p className="text-xs text-brand-gray">Change your account password</p>
                </div>
                <a href="/admin/profile" className="text-sm font-medium" style={{ color: settings.accentColor }}>
                  Change
                </a>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-light/50">
                <div>
                  <p className="text-sm font-medium text-brand-dark">Two-Factor Authentication</p>
                  <p className="text-xs text-brand-gray">Add an extra layer of security</p>
                </div>
                <Badge variant="warning">Coming Soon</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sticky Save Bar */}
      {activeTab !== "modules" && (
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-brand-mid/20 -mx-6 px-6 py-4 flex justify-end gap-3 -mb-6 rounded-b-xl">
        <Button variant="outline" onClick={fetchSettings}>Reset</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
      )}
    </div>
  );
}
