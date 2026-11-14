import { NextResponse } from "next/server";
import { getInvoice, listInvoices } from "@/lib/store";
import { refreshInvoice } from "@/lib/refresh";
import { getPayee, hashKey } from "@/lib/payees";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Your invoices only: the ids this device created, plus invoices from your Pay me page when you present its key. There is no public list. */
export async function POST(req: Request) {
  let b: { ids?: string[]; handle?: string; editKey?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const ids = Array.isArray(b.ids) ? b.ids.filter(x => typeof x === "string" && /^inv_[a-z0-9]{6,}$/.test(x)).slice(0, 200) : [];
  const found = new Map<string, Invoice>();
  await Promise.all(ids.map(async id => { const i = await refreshInvoice(id); if (i) found.set(i.id, i); }));
  if (b.handle && b.editKey) {
    const p = await getPayee(b.handle.toLowerCase());
    if (p && hashKey(b.editKey) === p.keyHash) {
      const mine = (await listInvoices()).filter(i => i.handle === p.handle).slice(0, 100);
      await Promise.all(mine.map(async i => { const r = await refreshInvoice(i.id); found.set(i.id, r ?? i); }));
    }
  }
  const invoices = [...found.values()].sort((a, c) => c.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ invoices });
}
