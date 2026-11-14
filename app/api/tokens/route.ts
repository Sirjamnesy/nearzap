import { NextResponse } from "next/server";
import { findPayoutAsset, getTokens, isDemo, payableTokens, OneClickError } from "@/lib/oneclick";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const tokens = await getTokens();
    return NextResponse.json({ demo: isDemo(), payout: findPayoutAsset(tokens), tokens: payableTokens(tokens) });
  } catch (e) {
    const err = e as OneClickError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
