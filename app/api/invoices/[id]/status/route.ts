import { NextResponse } from "next/server";
import { refreshInvoice } from "@/lib/refresh";
import { getInvoice, updateInvoice } from "@/lib/store";
import { invoiceState } from "@/lib/invoice";
import { isDemo, submitDepositTx } from "@/lib/oneclick";

export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const inv = await refreshInvoice(id);
  if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ state: invoiceState(inv), attempts: inv.attempts });
}

/** POST {action:"submit-tx", attemptId, txHash} tells 1Click about your deposit (faster detection).
 *  POST {action:"simulate-deposit", attemptId} is DEMO MODE only. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let b: { action?: string; attemptId?: string; txHash?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const inv = await getInvoice(id);
  const attempt = inv?.attempts.find(a => a.id === b.attemptId);
  if (!inv || !attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

  if (b.action === "simulate-deposit") {
    if (!isDemo() || !attempt.demo) return NextResponse.json({ error: "Only available in DEMO_MODE." }, { status: 403 });
    await updateInvoice(id, i => { const a = i.attempts.find(x => x.id === b.attemptId)!; a.demoDepositAt ??= new Date().toISOString(); });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "submit-tx") {
    if (!b.txHash || !/^[A-Za-z0-9]{20,128}$/.test(b.txHash)) return NextResponse.json({ error: "Enter a valid transaction hash." }, { status: 400 });
    try { await submitDepositTx(attempt.depositAddress, b.txHash); return NextResponse.json({ ok: true }); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 502 }); }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
