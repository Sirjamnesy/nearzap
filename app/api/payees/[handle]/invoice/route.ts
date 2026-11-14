import { NextResponse } from "next/server";
import { getPayee } from "@/lib/payees";
import { createInvoice, newId } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Anyone opening a Pay me page picks an amount; this makes the invoice (from the payee's saved settings) and returns its pay link. */
export async function POST(req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const p = await getPayee((await ctx.params).handle.toLowerCase());
  if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let b: { amountCents?: number; note?: string; payerName?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const cents = b.amountCents;
  if (!Number.isInteger(cents) || (cents as number) < 100 || (cents as number) > 10_000_000_00) return NextResponse.json({ error: "Enter an amount from $1.00 up." }, { status: 400 });
  const note = (b.note ?? "").trim().slice(0, 140);
  const inv: Invoice = {
    id: newId(), createdAt: new Date().toISOString(), currency: "USDC", payout: p.payout,
    freelancerName: p.name, freelancerNear: p.near, clientName: (b.payerName ?? "").trim().slice(0, 60) || "Guest", handle: p.handle,
    items: [{ description: note || `Payment to ${p.name}`, qty: 1, unitCents: cents as number }],
    totalCents: cents as number, dueDate: "", attempts: [], ...(p.receive ? { receive: p.receive } : {}),
  };
  await createInvoice(inv);
  return NextResponse.json({ id: inv.id, link: `/i/${inv.id}` }, { status: 201 });
}
