import { NextResponse } from "next/server";
import { getTokens, requestQuote, buildQuoteRequest, receiveAssetFor } from "@/lib/oneclick";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";
// TEMPORARY: checks a dry quote with splits against the live 1Click API from the server. Removed before launch.
export async function GET() {
  const tokens = await getTokens();
  const origin = tokens.find(t => t.symbol === "USDC" && t.blockchain === "base");
  if (!origin) return NextResponse.json({ error: "no base usdc" });
  const inv = { id: "diag", createdAt: "", currency: "USDC", payout: "intents-balance", freelancerName: "x", freelancerNear: "6370077e1dc2f04a3f3a714c93fc3b789c7121a1f35a7a5eeb3b423c7b6d0d53",
    clientName: "c", items: [], totalCents: 100, dueDate: "", attempts: [], splits: [{ account: "near", percent: 4 }] } as unknown as Invoice;
  const out: Record<string, unknown> = { request: buildQuoteRequest({ invoice: inv, origin, refundTo: "0x0000000000000000000000000000000000000001", dry: true }, receiveAssetFor(inv, tokens)) };
  try { const q = await requestQuote({ invoice: inv, origin, refundTo: "0x0000000000000000000000000000000000000001", dry: true }); out.ok = { amountIn: q.amountInFormatted, symbol: q.originSymbol }; }
  catch (e: any) { out.error = e.message; }
  const noSplit = { ...inv, splits: undefined } as Invoice;
  try { const q = await requestQuote({ invoice: noSplit, origin, refundTo: "0x0000000000000000000000000000000000000001", dry: true }); out.okNoSplit = { amountIn: q.amountInFormatted }; }
  catch (e: any) { out.errorNoSplit = e.message; }
  return NextResponse.json(out);
}
