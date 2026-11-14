import { NextResponse } from "next/server";
import { createInvoice, listInvoices, newId } from "@/lib/store";
import { totalCents, validateInput, type InvoiceInput } from "@/lib/invoice";
import { refreshInvoice } from "@/lib/refresh";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await listInvoices();
  const fresh = await Promise.all(all.map(i => refreshInvoice(i.id).then(r => r ?? i)));
  return NextResponse.json({ invoices: fresh });
}

export async function POST(req: Request) {
  let body: Partial<InvoiceInput>;
  try { body = await req.json(); } catch { return NextResponse.json({ errors: ["Invalid JSON."] }, { status: 400 }); }
  const errors = validateInput(body);
  if (errors.length) return NextResponse.json({ errors }, { status: 400 });
  const b = body as InvoiceInput;
  const inv: Invoice = {
    id: newId(), createdAt: new Date().toISOString(), currency: "USDC",
    payout: b.payout === "near-wallet" ? "near-wallet" : "intents-balance",
    freelancerName: b.freelancerName.trim(), freelancerNear: b.freelancerNear.trim().toLowerCase(),
    clientName: b.clientName.trim(), clientEmail: b.clientEmail?.trim() || undefined,
    items: b.items.map(i => ({ description: i.description.trim(), qty: Number(i.qty), unitCents: i.unitCents })),
    totalCents: totalCents(b.items), dueDate: b.dueDate, memo: b.memo?.trim() || undefined, attempts: [],
  };
  await createInvoice(inv);
  return NextResponse.json({ invoice: inv }, { status: 201 });
}
