import { notFound } from "next/navigation";
import { refreshInvoice } from "@/lib/refresh";
import { formatUsd, invoiceState } from "@/lib/invoice";
import PayPanel from "./PayPanel";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await refreshInvoice(id);
  if (!inv) notFound();
  const state = invoiceState(inv);
  return (
    <>
      <h1>Invoice from {inv.freelancerName}</h1>
      <p className="mut">For {inv.clientName} · Due {inv.dueDate} · <span className={`badge ${state}`} id="state">{state}</span></p>
      <div className="card">
        <table><thead><tr><th>Description</th><th className="r">Qty</th><th className="r">Amount</th></tr></thead><tbody>
          {inv.items.map((it, n) => (<tr key={n}><td>{it.description}</td><td className="r">{it.qty}</td><td className="r">{formatUsd(Math.round(it.qty * it.unitCents))}</td></tr>))}
        </tbody></table>
        {inv.memo && <p className="mut">{inv.memo}</p>}
        <p className="total">{formatUsd(inv.totalCents)} <span className="mut">USDC</span></p>
        <p className="mut">Payee receives USDC on NEAR ({inv.freelancerNear}). You can pay from any supported chain.</p>
      </div>
      <PayPanel invoiceId={inv.id} initialState={state} initialAttempts={inv.attempts} />
    </>
  );
}
