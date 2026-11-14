import { NextResponse } from "next/server";
import { refreshInvoice } from "@/lib/refresh";
import { invoiceState } from "@/lib/invoice";

export const dynamic = "force-dynamic";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const inv = await refreshInvoice(id);
  if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ invoice: inv, state: invoiceState(inv) });
}
