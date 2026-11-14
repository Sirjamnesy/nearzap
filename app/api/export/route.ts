import { listInvoices } from "@/lib/store";
import { refreshInvoice } from "@/lib/refresh";
import { invoicesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";
export async function GET() {
  const all = await listInvoices();
  const fresh = await Promise.all(all.map(i => refreshInvoice(i.id).then(r => r ?? i)));
  return new Response(invoicesToCsv(fresh), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="invoices.csv"' },
  });
}
