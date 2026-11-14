import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getInvoice, updateInvoice } from "@/lib/store";
import { getTokens, OneClickError, requestQuote } from "@/lib/oneclick";
import { refreshInvoice } from "@/lib/refresh";
import { invoiceState } from "@/lib/invoice";

export const dynamic = "force-dynamic";
const MAX_ATTEMPTS = 10;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { originAssetId?: string; refundTo?: string; dry?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const inv = await refreshInvoice(id);
  if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (invoiceState(inv) === "paid") return NextResponse.json({ error: "This invoice is already paid." }, { status: 409 });
  if (inv.attempts.length >= MAX_ATTEMPTS) return NextResponse.json({ error: "Too many payment attempts for this invoice." }, { status: 429 });

  const refundTo = (body.refundTo ?? "").trim();
  if (refundTo.length < 8 || refundTo.length > 128 || /\s/.test(refundTo))
    return NextResponse.json({ error: "Enter the address on your paying chain where a refund should go." }, { status: 400 });

  try {
    const tokens = await getTokens();
    const origin = tokens.find(t => t.assetId === body.originAssetId);
    if (!origin) return NextResponse.json({ error: "Unknown payment token." }, { status: 400 });
    const attempt = await requestQuote({ invoice: inv, origin, refundTo, dry: !!body.dry });
    const { dry, ...stored } = attempt;
    if (dry) return NextResponse.json({ dry: true, quote: { amountInFormatted: stored.amountInFormatted, symbol: stored.originSymbol, chain: stored.originChain, deadline: stored.deadline } });
    await updateInvoice(id, i => { i.attempts.push(stored); });
    const qr = await QRCode.toDataURL(stored.depositAddress, { margin: 1, width: 220 });
    return NextResponse.json({ attempt: stored, qr }, { status: 201 });
  } catch (e) {
    const err = e as OneClickError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
