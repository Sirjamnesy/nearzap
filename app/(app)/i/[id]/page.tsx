import { notFound } from "next/navigation";
import { refreshInvoice } from "@/lib/refresh";
import { formatUsd, invoiceState, partsOf } from "@/lib/invoice";
import PayPanel from "./PayPanel";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await refreshInvoice(id);
  if (!inv) notFound();
  const state = invoiceState(inv);
  const generic = ["Client", "Guest"].includes(inv.clientName);
  const title = inv.handle ? `Pay ${inv.freelancerName}` : generic ? "Your invoice" : `Invoice for ${inv.clientName}`;
  const parts = partsOf(inv);
  const info = {
    id: inv.id, totalCents: inv.totalCents, parts, multi: parts.length > 1, clientName: inv.clientName, payeeName: inv.freelancerName, dueDate: inv.dueDate,
    receiveLabel: inv.receive ? `${inv.receive.symbol} on ${inv.receive.blockchain}` : "USDC on NEAR",
    deliverLabel: inv.payout === "intents-balance" ? "NEAR Intents balance" : "Wallet",
  };
  const showItems = inv.items.length > 1 || (inv.items[0] && !["Payment request", `Payment to ${inv.freelancerName}`].includes(inv.items[0].description));
  return (
    <>
      <h1>{title}</h1>
      <p className="mut">From {inv.freelancerName}{inv.dueDate ? ` · Due ${inv.dueDate}` : ""} · <span className={`badge ${state}`} id="state">{state}</span></p>
      <div className="card">
        <div className="mut">Amount due</div>
        <p className="total">{formatUsd(inv.totalCents)}</p>
        {showItems && (
          <table><thead><tr><th>Description</th><th className="r">Qty</th><th className="r">Amount</th></tr></thead><tbody>
            {inv.items.map((it, n) => (<tr key={n}><td>{it.description}</td><td className="r">{it.qty}</td><td className="r">{formatUsd(Math.round(it.qty * it.unitCents))}</td></tr>))}
          </tbody></table>)}
        {inv.memo && <p className="mut">{inv.memo}</p>}
        <p className="hint">Pay from any supported chain with the token you already hold.</p>
      </div>
      <PayPanel info={info} initialAttempts={inv.attempts} />
    </>
  );
}
