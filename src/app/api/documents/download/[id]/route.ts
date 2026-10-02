import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

interface SchoolBranding {
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
  emailFooter: string | null;
  principalName: string | null;
  principalTitle: string | null;
}

async function getSchool(): Promise<SchoolBranding> {
  const school = await db.school.findFirst();
  if (!school) throw new Error("No school configured");
  return school as unknown as SchoolBranding;
}

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function logoHtml(school: SchoolBranding, height = 48): string {
  if (!school.logoUrl) return "";
  return `<img src="${school.logoUrl}" alt="${esc(school.name)}" style="height:${height}px;object-fit:contain;" />`;
}

function docHead(title: string, school: SchoolBranding, extraCSS = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${school.fontFamily};
    color: ${school.secondaryColor};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    @page { margin: 15mm; size: A4; }
  }
  @page { size: A4; margin: 15mm; }
  .page { max-width: 210mm; margin: 0 auto; padding: 40px; }
  ${extraCSS}
</style>
</head>`;
}

function docFooter(school: SchoolBranding): string {
  const footer = school.emailFooter || `${esc(school.name)} · ${esc(school.address || "")}, ${esc(school.city || "")}`;
  return `
  <div style="margin-top:40px;padding-top:20px;border-top:2px solid ${school.accentColor};">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#9CA3AF;">
      <span>${footer}</span>
      <span>Generated ${new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</span>
    </div>
  </div>`;
}

// ─── INVOICE ────────────────────────────────────────────

function generateInvoiceHTML(data: any, school: SchoolBranding): string {
  const items = (data.items || []).map((item: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#FAFBFC'};">
      <td style="padding:14px 12px;border-bottom:1px solid #EDF2F7;font-size:13px;color:${school.secondaryColor};">${String(i + 1).padStart(2, "0")}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #EDF2F7;font-size:13px;font-weight:500;color:${school.secondaryColor};">${esc(item.description)}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #EDF2F7;font-size:13px;text-align:right;color:#4A5568;">${school.currencySymbol} ${Number(item.amount || 0).toFixed(2)}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #EDF2F7;font-size:13px;text-align:center;color:#4A5568;">${item.quantity || 1}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #EDF2F7;font-size:13px;text-align:right;font-weight:600;color:${school.secondaryColor};">${school.currencySymbol} ${(Number(item.amount || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>`).join("");

  const subtotal = (data.items || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0) * (item.quantity || 1), 0);
  const tax = Number(data.tax || 0);
  const discount = Number(data.discount || 0);
  const total = data.totalAmount || subtotal - discount + tax;

  return `${docHead(`Invoice ${data.invoiceNumber || ""}`, school)}
<body>
<div class="page" style="padding:0;max-width:210mm;">

  <!-- Top Header Bar -->
  <div style="display:flex;background:${school.secondaryColor};border-radius:16px 16px 0 0;overflow:hidden;">
    <!-- Left: Logo + School -->
    <div style="flex:1;padding:32px 36px;display:flex;align-items:center;gap:16px;">
      ${school.logoUrl ? `<img src="${school.logoUrl}" alt="${esc(school.name)}" style="height:48px;object-fit:contain;" />` : `<div style="width:48px;height:48px;border-radius:12px;background:${school.accentColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px;">${esc(school.name.charAt(0))}</div>`}
      <div>
        <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px;">${esc(school.name)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">
          ${school.phone ? esc(school.phone) : ""}${school.phone && school.email ? " · " : ""}${school.email ? esc(school.email) : ""}
        </div>
      </div>
    </div>
    <!-- Right: INVOICE title -->
    <div style="padding:32px 40px;display:flex;align-items:center;">
      <div style="font-size:40px;font-weight:800;color:#fff;letter-spacing:3px;">INVOICE</div>
    </div>
  </div>

  <!-- Accent Bar -->
  <div style="height:4px;background:linear-gradient(90deg, ${school.accentColor} 0%, ${school.accentColor} 60%, transparent 100%);"></div>

  <!-- Invoice Details + Bill To Row -->
  <div style="display:flex;gap:0;padding:0;">

    <!-- Left: Bill To + School Contact -->
    <div style="flex:1;padding:32px 36px;">
      <!-- Invoice To -->
      <div style="margin-bottom:28px;">
        <div style="font-size:10px;font-weight:700;color:${school.accentColor};text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Invoice To</div>
        <div style="font-size:20px;font-weight:700;color:${school.secondaryColor};letter-spacing:-0.3px;">${esc(data.student?.firstName || "")} ${esc(data.student?.lastName || "")}</div>
        ${data.student?.studentNumber ? `<div style="font-size:12px;color:#718096;margin-top:4px;">Student #${esc(data.student.studentNumber)}</div>` : ""}
      </div>

      <!-- School Contact -->
      <div>
        <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Contact</div>
        ${school.phone ? `<div style="font-size:12px;color:#4A5568;margin-bottom:3px;">📞 ${esc(school.phone)}</div>` : ""}
        ${school.email ? `<div style="font-size:12px;color:#4A5568;margin-bottom:3px;">✉️ ${esc(school.email)}</div>` : ""}
        ${school.address ? `<div style="font-size:12px;color:#4A5568;">📍 ${esc(school.address)}${school.city ? `, ${esc(school.city)}` : ""}</div>` : ""}
      </div>
    </div>

    <!-- Right: Invoice Meta + Payment Methods -->
    <div style="width:300px;">

      <!-- Invoice Details Card -->
      <div style="background:#F7FAFC;border-radius:0 0 0 12px;padding:28px 28px;border-left:3px solid ${school.accentColor};">
        <div style="font-size:10px;font-weight:700;color:${school.accentColor};text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Invoice Details</div>
        <div style="margin-bottom:10px;">
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Invoice No</div>
          <div style="font-size:14px;font-weight:700;color:${school.secondaryColor};">${esc(data.invoiceNumber || "")}</div>
        </div>
        ${data.invoiceDate || data.createdAt ? `
        <div style="margin-bottom:10px;">
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Invoice Date</div>
          <div style="font-size:13px;font-weight:600;color:#4A5568;">${new Date(data.invoiceDate || data.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>` : ""}
        ${data.dueDate ? `
        <div style="margin-bottom:10px;">
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Due Date</div>
          <div style="font-size:13px;font-weight:600;color:#4A5568;">${new Date(data.dueDate).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>` : ""}
        <div>
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Status</div>
          <div style="display:inline-block;margin-top:4px;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${data.status === "PAID" ? "#059669" : data.status === "OVERDUE" ? "#DC2626" : "#D97706"};">${esc(data.status || "PENDING")}</div>
        </div>
      </div>

      <!-- Payment Methods Card -->
      <div style="background:#F7FAFC;padding:24px 28px;border-left:3px solid ${school.secondaryColor};">
        <div style="font-size:10px;font-weight:700;color:${school.secondaryColor};text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Payment Methods</div>
        ${school.phone ? `
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Account No</div>
          <div style="font-size:12px;font-weight:600;color:#4A5568;">${esc(school.phone)}</div>
        </div>` : ""}
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Account Name</div>
          <div style="font-size:12px;font-weight:600;color:#4A5568;">${esc(school.name)}</div>
        </div>
        ${school.city ? `
        <div>
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Branch</div>
          <div style="font-size:12px;font-weight:600;color:#4A5568;">${esc(school.city)}</div>
        </div>` : ""}
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <div style="padding:0 36px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
      <thead>
        <tr>
          <th style="background:${school.secondaryColor};color:#fff;padding:12px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;width:50px;">No.</th>
          <th style="background:${school.secondaryColor};color:#fff;padding:12px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Item Description</th>
          <th style="background:${school.secondaryColor};color:#fff;padding:12px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Price</th>
          <th style="background:${school.secondaryColor};color:#fff;padding:12px 12px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Qty</th>
          <th style="background:${school.secondaryColor};color:#fff;padding:12px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items || `<tr><td colspan="5" style="padding:40px;text-align:center;color:#9CA3AF;font-size:13px;">No items</td></tr>`}
      </tbody>
    </table>
  </div>

  <!-- Totals + Terms Row -->
  <div style="display:flex;padding:0 36px 36px;gap:40px;">

    <!-- Terms & Conditions -->
    <div style="flex:1;">
      <div style="font-size:10px;font-weight:700;color:${school.secondaryColor};text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Terms & Conditions</div>
      <div style="font-size:11px;color:#718096;line-height:1.7;">
        ${school.invoiceTerms ? esc(school.invoiceTerms) : "Payment is due within 30 days of the invoice date. Late payments may incur additional charges."}
      </div>
      ${school.invoiceNotes ? `
      <div style="margin-top:14px;">
        <div style="font-size:10px;font-weight:700;color:${school.secondaryColor};text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Notes</div>
        <div style="font-size:11px;color:#718096;line-height:1.7;">${esc(school.invoiceNotes)}</div>
      </div>` : ""}
      <div style="margin-top:20px;font-size:12px;font-weight:600;color:${school.secondaryColor};letter-spacing:0.5px;">THANK YOU FOR YOUR BUSINESS.</div>
    </div>

    <!-- Totals -->
    <div style="width:260px;">
      <div style="background:#F7FAFC;border-radius:12px;padding:20px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EDF2F7;">
          <span style="font-size:12px;color:#718096;">Subtotal</span>
          <span style="font-size:13px;font-weight:600;color:${school.secondaryColor};">${school.currencySymbol} ${subtotal.toFixed(2)}</span>
        </div>
        ${discount > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EDF2F7;">
          <span style="font-size:12px;color:#718096;">Discount</span>
          <span style="font-size:13px;font-weight:600;color:#DC2626;">-${school.currencySymbol} ${discount.toFixed(2)}</span>
        </div>` : ""}
        ${tax > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EDF2F7;">
          <span style="font-size:12px;color:#718096;">Tax</span>
          <span style="font-size:13px;font-weight:600;color:${school.secondaryColor};">${school.currencySymbol} ${tax.toFixed(2)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:12px 0 4px;margin-top:4px;">
          <span style="font-size:14px;font-weight:800;color:${school.secondaryColor};">Total</span>
          <span style="font-size:22px;font-weight:800;color:${school.accentColor};">${school.currencySymbol} ${Number(total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:${school.secondaryColor};border-radius:0 0 16px 16px;padding:20px 36px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.5);">
      ${school.phone ? `<span>📞 ${esc(school.phone)}</span>` : ""}${school.phone && school.email ? " &nbsp;·&nbsp; " : ""}${school.email ? `<span>✉️ ${esc(school.email)}</span>` : ""}${school.website ? ` &nbsp;·&nbsp; <span>🌐 ${esc(school.website)}</span>` : ""}
    </div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);">
      ${school.address ? esc(school.address) : ""}${school.city ? `, ${esc(school.city)}` : ""}
    </div>
  </div>

  <!-- Signature Area -->
  <div style="margin-top:32px;padding:0 36px;">
    <div style="display:flex;justify-content:flex-end;">
      <div style="width:220px;text-align:center;">
        <div style="border-top:2px solid ${school.secondaryColor};padding-top:8px;margin-top:48px;">
          <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Authorized Signature</div>
        </div>
      </div>
    </div>
  </div>

</div>
</body></html>`;
}

// ─── TRANSCRIPT ─────────────────────────────────────────

function generateTranscriptHTML(data: any, school: SchoolBranding): string {
  const subjectRows = (data.subjects || []).map((s: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
      <td style="padding:14px 16px;font-weight:600;font-size:14px;border-bottom:1px solid #F3F4F6;">${esc(s.subject)}</td>
      <td style="padding:14px 16px;text-align:center;font-size:14px;border-bottom:1px solid #F3F4F6;">${s.average}%</td>
      <td style="padding:14px 16px;text-align:center;border-bottom:1px solid #F3F4F6;">
        <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${
          s.average >= 80 ? "#059669" : s.average >= 60 ? "#D97706" : s.average >= 50 ? "#EA580C" : "#DC2626"
        };">${esc(s.grade)}</span>
      </td>
    </tr>`).join("");

  return `${docHead(`Transcript - ${data.student?.firstName} ${data.student?.lastName}`, school)}
<body>
<div class="page">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:2px solid ${school.accentColor};">
    ${logoHtml(school, 56)}
    <h1 style="font-size:14px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:3px;margin-top:${school.logoUrl ? '12px' : '0'};">Academic Transcript</h1>
  </div>

  <!-- Student Info -->
  <div style="display:flex;justify-content:space-between;margin-bottom:36px;background:#F9FAFB;border-radius:12px;padding:24px;">
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student Name</div>
      <div style="font-size:18px;font-weight:700;color:${school.secondaryColor};">${esc(data.student?.firstName || "")} ${esc(data.student?.lastName || "")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student Number</div>
      <div style="font-size:16px;font-weight:600;color:${school.secondaryColor};">${esc(data.student?.studentNumber || "N/A")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Academic Year</div>
      <div style="font-size:16px;font-weight:600;color:${school.accentColor};">${esc(data.academicYear?.name || "N/A")}</div>
    </div>
  </div>

  <!-- Results Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
    <thead>
      <tr>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Subject</th>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Average</th>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Grade</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRows || `<tr><td colspan="3" style="padding:40px;text-align:center;color:#9CA3AF;">No results available</td></tr>`}
    </tbody>
  </table>

  <!-- Signature -->
  ${school.principalName ? `
  <div style="margin-top:60px;display:flex;justify-content:flex-end;">
    <div style="text-align:center;width:200px;">
      <div style="border-top:2px solid ${school.secondaryColor};padding-top:8px;">
        <p style="font-size:14px;font-weight:700;color:${school.secondaryColor};">${esc(school.principalName)}</p>
        <p style="font-size:12px;color:#6B7280;">${esc(school.principalTitle || "Principal")}</p>
      </div>
    </div>
  </div>` : ""}

  ${docFooter(school)}
</div>
</body></html>`;
}

// ─── REPORT CARD ────────────────────────────────────────

function generateReportCardHTML(data: any, school: SchoolBranding): string {
  const gradeLabels = ["Term 1", "Term 2", "Term 3", "Term 4"];
  const quarterlyGPAs = data.quarterlyGPAs || [0, 0, 0, 0];
  const subjectRows = (data.academicResults || []).map((s: any, i: number) => {
    const qGrades = (s.quarterlyGrades || [null, null, null, null]).map((q: any) =>
      q ? `<td style="padding:10px 12px;text-align:center;font-size:12px;border-bottom:1px solid #E5E7EB;"><span style="font-weight:600;color:${school.secondaryColor};">${q.grade}</span><br><span style="color:#9CA3AF;font-size:11px;">${q.percentage}</span></td>` :
      `<td style="padding:10px 12px;text-align:center;font-size:12px;border-bottom:1px solid #E5E7EB;color:#D1D5DB;">—</td>`
    );
    return `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
      <td style="padding:10px 12px;font-weight:600;font-size:13px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${esc(s.subject)}</td>
      ${qGrades.join("")}
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #E5E7EB;">
        <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;color:#fff;background:${
          s.finalPercentage >= 80 ? "#059669" : s.finalPercentage >= 60 ? "#D97706" : s.finalPercentage >= 50 ? "#EA580C" : "#DC2626"
        };">${esc(s.finalGrade)}</span>
      </td>
      <td style="padding:10px 12px;text-align:center;font-weight:700;font-size:13px;border-bottom:1px solid #E5E7EB;color:${school.secondaryColor};">${s.finalPercentage}%</td>
    </tr>`;
  }).join("");

  // Attendance rows
  const attQ = data.attendance?.quarterly || [];
  const attRow = (label: string, key: string, color: string) => {
    const cells = [0, 1, 2, 3].map((q) => {
      const val = attQ[q]?.[key] || 0;
      return `<td style="padding:8px 12px;text-align:center;font-size:12px;border-bottom:1px solid #E5E7EB;">${val}</td>`;
    }).join("");
    const total = attQ.reduce((sum: number, q: any) => sum + (q[key] || 0), 0);
    return `<tr>
      <td style="padding:8px 12px;font-weight:500;font-size:12px;border-bottom:1px solid #E5E7EB;color:${color};">${label}</td>
      ${cells}
      <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:12px;border-bottom:1px solid #E5E7EB;">${total}</td>
    </tr>`;
  };

  return `${docHead(`Report Card - ${data.student?.firstName} ${data.student?.lastName}`, school)}
<body>
<div class="page">
  <!-- Header with Logo & School Info -->
  <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:8px;padding-bottom:20px;border-bottom:3px solid ${school.accentColor};">
    <div style="flex-shrink:0;">
      ${logoHtml(school, 72) || `<div style="width:72px;height:72px;border-radius:12px;background:${school.accentColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:28px;">${esc(school.name.charAt(0))}</div>`}
    </div>
    <div>
      <h1 style="font-size:22px;font-weight:800;color:${school.secondaryColor};letter-spacing:-0.5px;margin:0;">${esc(school.name)}</h1>
      <div style="font-size:12px;color:#6B7280;margin-top:4px;line-height:1.5;">
        ${school.address ? `<div>${esc(school.address)}${school.city ? `, ${esc(school.city)}` : ""}</div>` : ""}
        ${school.phone ? `<div>${esc(school.phone)}</div>` : ""}
      </div>
    </div>
  </div>

  <!-- Term / Year Banner -->
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;padding:8px 32px;background:${school.accentColor};color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">
      ${esc(data.academicYear?.name || "Academic Year")} — Report Card
    </div>
  </div>

  <!-- Student Info Bar -->
  <div style="display:flex;justify-content:space-between;margin-bottom:28px;padding:20px;background:#F9FAFB;border-radius:12px;border:1px solid #F3F4F6;">
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student</div>
      <div style="font-size:16px;font-weight:700;color:${school.secondaryColor};">${esc(data.student?.firstName || "")} ${esc(data.student?.lastName || "")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Grade</div>
      <div style="font-size:14px;font-weight:600;color:${school.secondaryColor};">${esc(data.grade || "N/A")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student #</div>
      <div style="font-size:14px;font-weight:600;color:${school.secondaryColor};">${esc(data.student?.studentNumber || "N/A")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Class</div>
      <div style="font-size:14px;font-weight:600;color:${school.secondaryColor};">${esc(data.className || "N/A")}</div>
    </div>
  </div>

  <!-- Attendance Table -->
  <div style="margin-bottom:28px;">
    <h2 style="font-size:13px;font-weight:700;color:${school.accentColor};margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">Attendance</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:${school.accentColor};">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;width:140px;"></th>
          ${gradeLabels.map((l) => `<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">${l}</th>`).join("")}
          <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${attRow("Absent", "absent", "#DC2626")}
        ${attRow("Late", "late", "#D97706")}
        ${attRow("Total Days", "total", school.secondaryColor)}
      </tbody>
    </table>
  </div>

  <!-- Subject Grades Table -->
  <div style="margin-bottom:28px;">
    <h2 style="font-size:13px;font-weight:700;color:${school.accentColor};margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;">Subject Results</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:${school.accentColor};">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Subject</th>
          ${gradeLabels.map((l) => `<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">${l}</th>`).join("")}
          <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Final</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">%</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows || `<tr><td colspan="7" style="padding:40px;text-align:center;color:#9CA3AF;font-size:13px;">No results available</td></tr>`}
      </tbody>
    </table>
  </div>

  <!-- GPA Row -->
  <div style="display:flex;gap:0;margin-bottom:28px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
    <div style="flex:1;padding:14px 16px;background:${school.accentColor};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;">GPA</div>
    ${quarterlyGPAs.map((gpa: number) => `
      <div style="flex:1;padding:14px 16px;text-align:center;border-left:1px solid #E5E7EB;">
        <div style="font-size:18px;font-weight:800;color:${school.secondaryColor};">${gpa.toFixed(2)}</div>
      </div>`).join("")}
    <div style="flex:1;padding:14px 16px;text-align:center;border-left:1px solid #E5E7EB;background:${school.accentColor}11;">
      <div style="font-size:18px;font-weight:800;color:${school.accentColor};">${data.finalGPA?.toFixed(2) || "0.00"}</div>
    </div>
  </div>

  <!-- Grade Scale -->
  <div style="margin-bottom:28px;padding:16px 20px;background:#F9FAFB;border-radius:8px;border:1px solid #F3F4F6;">
    <div style="font-size:12px;font-weight:700;color:${school.secondaryColor};margin-bottom:8px;">Grading Scale</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:11px;color:#6B7280;">
      <span><strong style="color:#059669;">A</strong> 90–100</span>
      <span><strong style="color:#059669;">A-</strong> 80–89</span>
      <span><strong style="color:#D97706;">B+</strong> 75–79</span>
      <span><strong style="color:#D97706;">B</strong> 70–74</span>
      <span><strong style="color:#D97706;">B-</strong> 65–69</span>
      <span><strong style="color:#EA580C;">C+</strong> 60–64</span>
      <span><strong style="color:#EA580C;">C</strong> 55–59</span>
      <span><strong style="color:#EA580C;">C-</strong> 50–54</span>
      <span><strong style="color:#DC2626;">D+</strong> 45–49</span>
      <span><strong style="color:#DC2626;">D</strong> 40–44</span>
      <span><strong style="color:#DC2626;">D-</strong> 35–39</span>
      <span><strong style="color:#DC2626;">F</strong> 0–34</span>
    </div>
  </div>

  <!-- Signature Lines -->
  <div style="display:flex;justify-content:space-between;margin-top:48px;padding-top:24px;border-top:1px solid #E5E7EB;">
    <div style="width:28%;">
      <div style="border-top:2px solid ${school.secondaryColor};padding-top:8px;margin-top:48px;">
        <p style="font-size:11px;color:#6B7280;">Homeroom Teacher</p>
        <div style="font-size:10px;color:#9CA3AF;margin-top:2px;">Date: _______________</div>
      </div>
    </div>
    <div style="width:28%;">
      <div style="border-top:2px solid ${school.secondaryColor};padding-top:8px;margin-top:48px;">
        <p style="font-size:11px;color:#6B7280;">${esc(school.principalTitle || "Principal")}${school.principalName ? ` — ${esc(school.principalName)}` : ""}</p>
        <div style="font-size:10px;color:#9CA3AF;margin-top:2px;">Date: _______________</div>
      </div>
    </div>
    <div style="width:28%;">
      <div style="border-top:2px solid ${school.secondaryColor};padding-top:8px;margin-top:48px;">
        <p style="font-size:11px;color:#6B7280;">Parent/Guardian</p>
        <div style="font-size:10px;color:#9CA3AF;margin-top:2px;">Date: _______________</div>
      </div>
    </div>
  </div>

  ${docFooter(school)}
</div>
</body></html>`;
}

// ─── STATEMENT ──────────────────────────────────────────

function generateStatementHTML(data: any, school: SchoolBranding): string {
  const itemRows = (data.items || []).map((item: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">${new Date(item.date).toLocaleDateString("en-ZA")}</td>
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${item.type === "PAYMENT" ? "#059669" : school.accentColor};">${esc(item.type)}</span>
      </td>
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">${esc(item.description)}</td>
      <td style="padding:12px 16px;font-size:13px;text-align:right;border-bottom:1px solid #F3F4F6;font-weight:600;color:${item.type === "PAYMENT" ? "#059669" : school.secondaryColor};">
        ${item.type === "PAYMENT" ? "-" : ""}${school.currencySymbol} ${Math.abs(item.amount).toFixed(2)}
      </td>
      <td style="padding:12px 16px;font-size:13px;text-align:right;border-bottom:1px solid #F3F4F6;font-weight:700;">${school.currencySymbol} ${item.balance.toFixed(2)}</td>
    </tr>`).join("");

  const balanceColor = data.balance > 0 ? "#DC2626" : "#059669";

  return `${docHead(`Statement - ${data.student?.firstName} ${data.student?.lastName}`, school)}
<body>
<div class="page">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:2px solid ${school.accentColor};">
    ${logoHtml(school, 56)}
    <h1 style="font-size:14px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:3px;margin-top:${school.logoUrl ? '12px' : '0'};">Account Statement</h1>
  </div>

  <!-- Student Info -->
  <div style="display:flex;justify-content:space-between;margin-bottom:32px;background:#F9FAFB;border-radius:12px;padding:24px;">
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student Name</div>
      <div style="font-size:18px;font-weight:700;color:${school.secondaryColor};">${esc(data.student?.firstName || "")} ${esc(data.student?.lastName || "")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student Number</div>
      <div style="font-size:16px;font-weight:600;color:${school.secondaryColor};">${esc(data.student?.studentNumber || "N/A")}</div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div style="display:flex;gap:16px;margin-bottom:32px;">
    <div style="flex:1;text-align:center;padding:24px;background:#F9FAFB;border-radius:12px;">
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Total Invoiced</div>
      <div style="font-size:22px;font-weight:800;color:${school.secondaryColor};">${school.currencySymbol} ${(data.totalInvoiced || 0).toFixed(2)}</div>
    </div>
    <div style="flex:1;text-align:center;padding:24px;background:#F0FDF4;border-radius:12px;">
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Total Paid</div>
      <div style="font-size:22px;font-weight:800;color:#059669;">${school.currencySymbol} ${(data.totalPaid || 0).toFixed(2)}</div>
    </div>
    <div style="flex:1;text-align:center;padding:24px;background:${balanceColor}11;border-radius:12px;">
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Balance Due</div>
      <div style="font-size:22px;font-weight:800;color:${balanceColor};">${school.currencySymbol} ${(data.balance || 0).toFixed(2)}</div>
    </div>
  </div>

  <!-- Transactions Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Date</th>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Type</th>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Description</th>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Amount</th>
        <th style="background:${school.accentColor};color:#fff;padding:12px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || `<tr><td colspan="5" style="padding:40px;text-align:center;color:#9CA3AF;">No transactions</td></tr>`}
    </tbody>
  </table>

  ${docFooter(school)}
</div>
</body></html>`;
}

// ─── RECEIPT ────────────────────────────────────────────

function generateReceiptHTML(data: any, school: SchoolBranding): string {
  const paymentRows = (data.payments || []).map((p: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">${new Date(p.paidAt).toLocaleDateString("en-ZA")}</td>
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">${esc(p.invoiceNumber || "N/A")}</td>
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:#059669;">${esc(p.method)}</span>
      </td>
      <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #F3F4F6;">${esc(p.reference || "-")}</td>
      <td style="padding:12px 16px;font-size:13px;text-align:right;border-bottom:1px solid #F3F4F6;font-weight:700;color:#059669;">${school.currencySymbol} ${Number(p.amount).toFixed(2)}</td>
    </tr>`).join("");

  const totalPaid = (data.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return `${docHead(`Receipt - ${data.student?.firstName} ${data.student?.lastName}`, school)}
<body>
<div class="page">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:2px solid #059669;">
    ${logoHtml(school, 56)}
    <h1 style="font-size:14px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:3px;margin-top:${school.logoUrl ? '12px' : '0'};">Payment Receipt</h1>
  </div>

  <!-- Success Banner -->
  <div style="text-align:center;margin-bottom:36px;background:#F0FDF4;border-radius:12px;padding:24px;">
    <div style="font-size:36px;font-weight:800;color:#059669;">${school.currencySymbol} ${totalPaid.toFixed(2)}</div>
    <div style="font-size:12px;color:#059669;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Payment Received</div>
  </div>

  <!-- Student Info -->
  <div style="display:flex;justify-content:space-between;margin-bottom:32px;background:#F9FAFB;border-radius:12px;padding:24px;">
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Received From</div>
      <div style="font-size:18px;font-weight:700;color:${school.secondaryColor};">${esc(data.student?.firstName || "")} ${esc(data.student?.lastName || "")}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Student Number</div>
      <div style="font-size:16px;font-weight:600;color:${school.secondaryColor};">${esc(data.student?.studentNumber || "N/A")}</div>
    </div>
  </div>

  <!-- Payments Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr>
        <th style="background:#059669;color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Date</th>
        <th style="background:#059669;color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Invoice</th>
        <th style="background:#059669;color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Method</th>
        <th style="background:#059669;color:#fff;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Reference</th>
        <th style="background:#059669;color:#fff;padding:12px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${paymentRows || `<tr><td colspan="5" style="padding:40px;text-align:center;color:#9CA3AF;">No payments found</td></tr>`}
      <tr style="background:#F0FDF4;">
        <td colspan="4" style="padding:16px;font-size:14px;font-weight:800;border-top:2px solid #059669;">Total Received</td>
        <td style="padding:16px;font-size:18px;font-weight:800;text-align:right;color:#059669;border-top:2px solid #059669;">${school.currencySymbol} ${totalPaid.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  ${docFooter(school)}
</div>
</body></html>`;
}

// ─── Route Handlers ─────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("academics.read");
  if (error) return error;

  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      academicYear: { select: { name: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const data = JSON.parse(document.data);
  let school: SchoolBranding;

  try {
    school = await getSchool();
  } catch {
    return NextResponse.json({ error: "School not configured" }, { status: 500 });
  }

  let html = "";

  switch (document.type) {
    case "INVOICE":
      html = generateInvoiceHTML(data, school);
      break;
    case "TRANSCRIPT":
      html = generateTranscriptHTML(data, school);
      break;
    case "REPORT_CARD":
      html = generateReportCardHTML(data, school);
      break;
    case "STATEMENT":
      html = generateStatementHTML(data, school);
      break;
    case "RECEIPT":
      html = generateReceiptHTML(data, school);
      break;
    default:
      html = `<html><body><h1>Unknown document type: ${esc(document.type)}</h1></body></html>`;
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
