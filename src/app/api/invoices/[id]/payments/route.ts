import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";
import { auditLog } from "@/lib/audit";
import { recordPaymentSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("finance.write");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const data = recordPaymentSchema.parse({ ...body, invoiceId: id });

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { payments: { select: { amount: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const newTotal = totalPaid + data.amount;

    if (newTotal > Number(invoice.totalAmount) + 0.01) {
      return NextResponse.json({ error: "Payment exceeds invoice balance" }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        invoiceId: id,
        amount: data.amount,
        method: data.method || "EFT",
        reference: data.reference,
        notes: data.notes,
        recordedById: user.id,
      },
    });

    // Update invoice status
    let newStatus: string = "PENDING";
    if (newTotal >= Number(invoice.totalAmount) - 0.01) {
      newStatus = "PAID";
    } else if (newTotal > 0) {
      newStatus = "PARTIAL";
    }

    await db.invoice.update({
      where: { id },
      data: { status: newStatus as any },
    });

    await auditLog({
      userId: user.id,
      action: "payment.recorded",
      resource: "invoice",
      resourceId: id,
      metadata: { amount: data.amount, method: data.method, invoiceNumber: invoice.invoiceNumber },
    });

    return NextResponse.json({ payment, newStatus }, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
