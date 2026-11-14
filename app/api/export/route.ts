import { getInvoice } from "@/lib/store";
import { invoicesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** CSV of the invoices you name: /api/export?ids=inv_a,inv_b */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(x => /^inv_[a-z0-9]{6,}$/.test(x)).slice(0, 200);
  const invs = (await Promise.all(ids.map(getInvoice))).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getInvoice>>>[];
  return new Response(invoicesToCsv(invs), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="nearzap-invoices.csv"' } });
}
