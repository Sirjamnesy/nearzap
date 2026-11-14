import { NextResponse } from "next/server";
import { createInvoice, newId } from "@/lib/store";
import { totalCents, validateInput, type InvoiceInput } from "@/lib/invoice";
import { getTokens } from "@/lib/oneclick";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Partial<InvoiceInput>;
  try { body = await req.json(); } catch { return NextResponse.json({ errors: ["Invalid JSON."] }, { status: 400 }); }
  const errors = validateInput(body);
  if (errors.length) return NextResponse.json({ errors }, { status: 400 });
  const b = body as InvoiceInput;
  // Trust the live token list, not the client, for what the payee receives.
  let receive = undefined as Invoice["receive"];
  if (b.receive) {
    const t = (await getTokens().catch(() => [])).find(x => x.assetId === b.receive!.assetId);
    if (!t) return NextResponse.json({ errors: ["Unknown receive asset."] }, { status: 400 });
    receive = { assetId: t.assetId, symbol: t.symbol, blockchain: t.blockchain, decimals: t.decimals, price: t.price };
  }
  const total = totalCents(b.items);
  const wallet = b.payout === "wallet" || b.payout === "near-wallet";
  const inv: Invoice = {
    id: newId(), createdAt: new Date().toISOString(), currency: "USDC",
    payout: wallet ? "wallet" : "intents-balance",
    freelancerName: b.freelancerName.trim(), freelancerNear: wallet && receive && receive.blockchain !== "near" ? b.freelancerNear.trim() : b.freelancerNear.trim().toLowerCase(),
    clientName: b.clientName?.trim() || "Client", clientEmail: b.clientEmail?.trim() || undefined,
    items: b.items.map(i => ({ description: i.description.trim(), qty: Number(i.qty), unitCents: i.unitCents })),
    totalCents: total, dueDate: b.dueDate ?? "", memo: b.memo?.trim() || undefined, attempts: [],
    ...(receive ? { receive } : {}),
    ...(b.splits?.length ? { splits: b.splits.map(s => ({ account: s.account.trim().toLowerCase(), percent: Number(s.percent) })) } : {}),
    ...(b.parts?.length ? { parts: b.parts.map(p => ({ label: p.label.trim(), cents: p.cents })) } : {}),
  };
  await createInvoice(inv);
  return NextResponse.json({ invoice: inv }, { status: 201 });
}
