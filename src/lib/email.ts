import { Resend } from "resend";
import { db } from "@/lib/db";
import { PRODUCT } from "@/config/product";

const FROM_EMAIL = process.env.EMAIL_FROM || `${PRODUCT.companyName} <${PRODUCT.supportEmail}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Lazily created so builds and page-data collection never fail when the key
// is absent — email is optional (see DEPLOYMENT.md §3).
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Email is not configured on this installation. Set RESEND_API_KEY (and optionally EMAIL_FROM) in .env to send email."
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

// ─── School Branding Helper ─────────────────────────────

interface SchoolBranding {
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  accentColor: string;
  secondaryColor: string;
  emailFooter: string | null;
  emailSignature: string | null;
  currencySymbol: string;
}

let _schoolCache: SchoolBranding | null = null;
let _schoolCacheTime = 0;

export async function getSchool(): Promise<SchoolBranding> {
  if (_schoolCache && Date.now() - _schoolCacheTime < 60_000) return _schoolCache;
  try {
    const school = await db.school.findFirst();
    if (school) {
      _schoolCache = school as unknown as SchoolBranding;
      _schoolCacheTime = Date.now();
      return _schoolCache;
    }
  } catch {
    // Database not reachable — fall through to product defaults.
  }
  return {
    name: PRODUCT.companyName,
    address: null,
    city: null,
    phone: null,
    email: PRODUCT.supportEmail,
    logoUrl: null,
    accentColor: PRODUCT.primaryColor,
    secondaryColor: PRODUCT.secondaryColor,
    emailFooter: `${PRODUCT.companyName} · ${PRODUCT.supportEmail}`,
    emailSignature: `Kind regards,\n${PRODUCT.companyName}`,
    currencySymbol: "R",
  };
}

function logoHtml(school: SchoolBranding, height = 40): string {
  if (!school.logoUrl) return `<h1 style="color:#fff;font-size:20px;margin:0;font-weight:700;">${esc(school.name)}</h1>`;
  return `<img src="${school.logoUrl}" alt="${esc(school.name)}" style="height:${height}px;object-fit:contain;" />`;
}

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Send Email ─────────────────────────────────────────

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo,
  });

  if (error) {
    console.error("Email send error:", error);
    throw new Error(error.message || "Failed to send email");
  }

  return data;
}

// ─── Email Wrapper ──────────────────────────────────────

function wrapEmail(school: SchoolBranding, subtitle: string, content: string, signature?: string): string {
  const location = [school.address, school.city].filter(Boolean).join(", ");
  const footer = school.emailFooter || [esc(school.name), esc(location)].filter(Boolean).join(" · ");
  const sig = signature || school.emailSignature || `Kind regards,\n${esc(school.name)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#F8F7F4;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:${school.accentColor};padding:32px;text-align:center;">
          ${logoHtml(school)}
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:${school.logoUrl ? '8px' : '4px'} 0 0;">${esc(subtitle)}</p>
        </div>
        <div style="padding:32px;">
          <div style="color:#1A1A1A;font-size:14px;line-height:1.7;">
            ${content}
          </div>
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #F3F4F6;white-space:pre-line;color:#6B7280;font-size:13px;line-height:1.6;">${esc(sig)}</div>
        </div>
        <div style="background:#F9FAFB;padding:16px 32px;text-align:center;">
          <p style="color:#9CA3AF;font-size:11px;margin:0;">${footer}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Invitation Email ───────────────────────────────────

export async function invitationEmail({ name, email, role, inviteUrl }: { name?: string; email: string; role: string; inviteUrl: string }) {
  const school = await getSchool();
  const roleName = role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const content = `
    <p>Hi ${name ? esc(name) : "there"},</p>
    <p>You've been invited to join <strong>${esc(school.name)}</strong> as a <strong>${esc(roleName)}</strong>.
    Click the button below to create your account.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:${school.accentColor};color:#fff;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        Create Account
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;">
      This invitation expires in 7 days. If you didn't expect this, you can safely ignore this email.
    </p>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;margin-top:8px;">
      Or copy this link: <a href="${inviteUrl}" style="color:${school.accentColor};word-break:break-all;">${inviteUrl}</a>
    </p>
  `;

  return wrapEmail(school, "You're Invited!", content);
}

// ─── Invoice Email ──────────────────────────────────────

export async function invoiceEmail({ studentName, invoiceNumber, totalAmount, dueDate, parentName, paymentLink }: {
  studentName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate?: string;
  parentName: string;
  paymentLink: string;
}) {
  const school = await getSchool();

  const content = `
    <p>Dear ${esc(parentName)},</p>
    <p>An invoice has been issued for <strong>${esc(studentName)}</strong>.</p>
    <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:24px 0;">
      <table style="width:100%;font-size:14px;color:#1A1A1A;">
        <tr><td style="padding:4px 0;color:#6B7280;">Invoice Number</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(invoiceNumber)}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Student</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(studentName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Amount Due</td><td style="padding:4px 0;text-align:right;font-weight:700;color:${school.accentColor};font-size:18px;">${school.currencySymbol} ${totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
        ${dueDate ? `<tr><td style="padding:4px 0;color:#6B7280;">Due Date</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(dueDate)}</td></tr>` : ""}
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${paymentLink}" style="display:inline-block;background:${school.accentColor};color:#fff;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        View Invoice
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;">
      If you have any questions, please contact us at <a href="mailto:${school.email || PRODUCT.supportEmail}" style="color:${school.accentColor};">${esc(school.email || PRODUCT.supportEmail)}</a>.
    </p>
  `;

  return wrapEmail(school, "Invoice", content);
}

// ─── Report Card Email ──────────────────────────────────

export async function reportCardEmail({ studentName, term, year, parentName, reportLink }: {
  studentName: string;
  term: string;
  year: string;
  parentName: string;
  reportLink: string;
}) {
  const school = await getSchool();

  const content = `
    <p>Dear ${esc(parentName)},</p>
    <p>The report card for <strong>${esc(studentName)}</strong> for <strong>${esc(term)} ${esc(year)}</strong> is now available.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${reportLink}" style="display:inline-block;background:${school.accentColor};color:#fff;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        View Report Card
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;">
      If you have any questions, please contact us at <a href="mailto:${school.email || PRODUCT.supportEmail}" style="color:${school.accentColor};">${esc(school.email || PRODUCT.supportEmail)}</a>.
    </p>
  `;

  return wrapEmail(school, "Report Card", content);
}

// ─── General Email ──────────────────────────────────────

export async function generalEmail({ subject, body, recipientName }: { subject: string; body: string; recipientName?: string }) {
  const school = await getSchool();

  const content = `
    ${recipientName ? `<p>Dear ${esc(recipientName)},</p>` : ""}
    <div>${body}</div>
  `;

  return wrapEmail(school, subject, content);
}

// ─── Announcement Email ────────────────────────────────

export async function announcementEmail({ title, content, target, publishedAt }: {
  title: string;
  content: string;
  target: string;
  publishedAt?: string;
}) {
  const school = await getSchool();

  const targetLabel = target === "ALL" ? "everyone" : target === "PARENTS" ? "parents" : target === "TEACHERS" ? "teachers" : "students";

  const contentHtml = `
    <p>Dear ${esc(targetLabel)},</p>
    <p>A new announcement has been published by <strong>${esc(school.name)}</strong>.</p>
    <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid ${school.accentColor};">
      <div style="font-size:16px;font-weight:700;color:${school.secondaryColor};margin-bottom:8px;">${esc(title)}</div>
      <div style="font-size:14px;color:#4A5568;line-height:1.7;white-space:pre-line;">${esc(content)}</div>
      ${publishedAt ? `<div style="font-size:11px;color:#9CA3AF;margin-top:12px;">Published ${new Date(publishedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}</div>` : ""}
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;">
      If you have any questions, please contact us at <a href="mailto:${school.email || PRODUCT.supportEmail}" style="color:${school.accentColor};">${esc(school.email || PRODUCT.supportEmail)}</a>.
    </p>
  `;

  return wrapEmail(school, "New Announcement", contentHtml);
}

// ─── Overdue Invoice Reminder ──────────────────────────

export async function overdueInvoiceReminderEmail({ studentName, invoiceNumber, totalAmount, balance, dueDate, parentName, daysOverdue, paymentLink }: {
  studentName: string;
  invoiceNumber: string;
  totalAmount: number;
  balance: number;
  dueDate: string;
  parentName: string;
  daysOverdue: number;
  paymentLink: string;
}) {
  const school = await getSchool();

  const urgencyColor = daysOverdue > 30 ? "#DC2626" : daysOverdue > 14 ? "#EA580C" : "#D97706";

  const content = `
    <p>Dear ${esc(parentName)},</p>
    <p>This is a friendly reminder that the following invoice is <strong style="color:${urgencyColor};">${daysOverdue} days overdue</strong>.</p>
    <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid ${urgencyColor};">
      <table style="width:100%;font-size:14px;color:#1A1A1A;">
        <tr><td style="padding:4px 0;color:#6B7280;">Invoice Number</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(invoiceNumber)}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Student</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(studentName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Total Amount</td><td style="padding:4px 0;text-align:right;font-weight:600;">${school.currencySymbol} ${totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Outstanding Balance</td><td style="padding:4px 0;text-align:right;font-weight:700;color:${urgencyColor};font-size:18px;">${school.currencySymbol} ${balance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Due Date</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(dueDate)}</td></tr>
        <tr><td style="padding:4px 0;color:#6B7280;">Days Overdue</td><td style="padding:4px 0;text-align:right;font-weight:700;color:${urgencyColor};">${daysOverdue} days</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${paymentLink}" style="display:inline-block;background:${school.accentColor};color:#fff;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        Pay Now
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;">
      If you have already made payment, please disregard this notice. If you have any questions, please contact us at <a href="mailto:${school.email || PRODUCT.supportEmail}" style="color:${school.accentColor};">${esc(school.email || PRODUCT.supportEmail)}</a>.
    </p>
  `;

  return wrapEmail(school, "Payment Reminder", content);
}

// ─── Password Reset Email ───────────────────────────────

export async function passwordResetEmail({ name, resetUrl }: { name?: string; resetUrl: string }) {
  const school = await getSchool();

  const content = `
    <p>Hi ${name ? esc(name) : "there"},</p>
    <p>We received a request to reset your password for your <strong>${esc(school.name)}</strong> account.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:${school.accentColor};color:#fff;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        Reset Password
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `;

  return wrapEmail(school, "Password Reset", content);
}
