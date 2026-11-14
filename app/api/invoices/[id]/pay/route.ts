import { NextResponse } from "next/server";
import { refreshInvoice } from "@/lib/refresh";
import { invoiceState, partState, partsOf } from "@/lib/invoice";
import { receiveAssetFor, getTokens, payableTokens } from "@/lib/oneclick";

export const dynamic = "force-dynamic";
export { POST } from "../quote/route";

/**
 * Machine-readable payment request, for AI agents and scripts (HTTP 402 while unpaid).
 * GET  -> what is owed and how to pay.
 * POST -> same body as the pay page: { originAssetId, refundTo, partIndex? } returns the deposit address.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const inv = await refreshInvoice(id);
  if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  const origin = new URL(req.url).origin;
  const state = invoiceState(inv);
  const base = {
    invoice: inv.id, state, payee: inv.freelancerName, currency: "USD",
    totalUsd: inv.totalCents / 100,
    parts: partsOf(inv).map((p, i) => ({ index: i, label: p.label, amountUsd: p.cents / 100, state: partState(inv, i) })),
  };
  if (state === "paid") return NextResponse.json({ ...base, receipt: `${origin}/r/${inv.id}` });
  let receives = "USDC on NEAR";
  try { const t = await getTokens(); const r = receiveAssetFor(inv, t); receives = `${r.symbol} on ${r.blockchain}`; } catch { /* keep default */ }
  let accepted: { assetId: string; symbol: string; chain: string }[] = [];
  try { accepted = payableTokens(await getTokens()).map(t => ({ assetId: t.assetId, symbol: t.symbol, chain: t.blockchain })); } catch { /* optional */ }
  return NextResponse.json({
    ...base, payeeReceives: receives,
    how: {
      step1: "Choose an asset you hold from `accepted` and an address on that chain for refunds.",
      step2: `POST ${origin}/api/invoices/${inv.id}/pay with JSON {"originAssetId": "...", "refundTo": "...", "partIndex": 0} to get a deposit address and exact amount.`,
      step3: "Send exactly that amount to the deposit address before the deadline.",
      step4: `Poll GET ${origin}/api/invoices/${inv.id}/status until state is "paid" (or "partial" for the next part).`,
    },
    accepted,
  }, { status: 402 });
}
