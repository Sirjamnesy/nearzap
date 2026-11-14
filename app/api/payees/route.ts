import { NextResponse } from "next/server";
import { getPayee, handleOk, hashKey, newKey, putPayee, publicPayee, type Payee } from "@/lib/payees";
import { getTokens } from "@/lib/oneclick";
import { validAddress } from "@/lib/invoice";

export const dynamic = "force-dynamic";

/** Create or update a Pay me page. A new handle returns a secret editKey once; updating an existing handle needs that key. */
export async function POST(req: Request) {
  let b: { handle?: string; name?: string; near?: string; payout?: string; receiveAssetId?: string; editKey?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const handle = (b.handle ?? "").trim().toLowerCase();
  if (!handleOk(handle)) return NextResponse.json({ error: "Handle must be 3-24 letters, numbers, - or _, and not a reserved word." }, { status: 400 });
  const name = (b.name ?? "").trim();
  if (name.length < 2 || name.length > 60) return NextResponse.json({ error: "Add your name (2-60 characters)." }, { status: 400 });
  const wallet = b.payout === "wallet";
  let receive: Payee["receive"];
  if (b.receiveAssetId) {
    const t = (await getTokens().catch(() => [])).find(x => x.assetId === b.receiveAssetId);
    if (!t) return NextResponse.json({ error: "Unknown receive asset." }, { status: 400 });
    receive = { assetId: t.assetId, symbol: t.symbol, blockchain: t.blockchain, decimals: t.decimals, price: t.price };
  }
  const chain = wallet ? (receive?.blockchain ?? "near") : "near";
  const near = (b.near ?? "").trim();
  if (!validAddress(chain, near)) return NextResponse.json({ error: chain === "near" ? "Enter a valid NEAR account." : `Enter a valid ${chain} address.` }, { status: 400 });

  const existing = await getPayee(handle);
  if (existing && (!b.editKey || hashKey(b.editKey) !== existing.keyHash))
    return NextResponse.json({ error: "That handle is taken. Pick another one." }, { status: 409 });
  const key = existing ? b.editKey! : newKey();
  const payee: Payee = {
    handle, name, near: chain === "near" ? near.toLowerCase() : near, payout: wallet ? "wallet" : "intents-balance",
    ...(receive ? { receive } : {}), keyHash: hashKey(key), createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await putPayee(payee);
  return NextResponse.json({ payee: publicPayee(payee), ...(existing ? {} : { editKey: key }) }, { status: existing ? 200 : 201 });
}
