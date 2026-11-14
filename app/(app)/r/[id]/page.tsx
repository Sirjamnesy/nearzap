import { notFound } from "next/navigation";
import { refreshInvoice } from "@/lib/refresh";
import { formatUsd, invoiceState, partIndexOf, partState, partsOf } from "@/lib/invoice";
import { Icon } from "@/components/Icon";
import ReceiptActions from "@/components/ReceiptActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipt · NearZap" };

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await refreshInvoice(id);
  if (!inv) notFound();
  const state = invoiceState(inv);
  const parts = partsOf(inv);
  const paidParts = parts.map((p, i) => ({ ...p, i })).filter(p => partState(inv, p.i) === "paid");
  if (!paidParts.length) return (
    <div className="card" style={{ textAlign: "center" }}>
      <h1>No payment yet</h1><p className="mut">A receipt appears here once this invoice is paid.</p>
      <p><a className="btn" href={`/i/${inv.id}`}>Go to the invoice</a></p>
    </div>);
  const paidCents = paidParts.reduce((s, p) => s + p.cents, 0);
  const done = state === "paid";
  const wins = inv.attempts.filter(a => a.status === "SUCCESS");
  const when = wins.map(a => a.updatedAt).sort().at(-1)!;
  const generic = ["Client", "Guest"].includes(inv.clientName);
  return (
    <>
      <div className="paidhero">
        <span className="paidcircle"><Icon name="check" /></span>
        <h2>{done ? "Payment received" : "Partly paid"}</h2>
        <div className="total">{formatUsd(paidCents)}</div>
        <p className="mut">Paid to {inv.freelancerName}{generic ? "" : ` by ${inv.clientName}`} on {new Date(when).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
      </div>
      <div className="card">
        <table><thead><tr><th>{done ? "Item" : "Payment"}</th><th className="r">Amount</th></tr></thead><tbody>
          {(done ? inv.items.map(it => ({ label: `${it.qty !== 1 ? `${it.qty} × ` : ""}${it.description}`, cents: Math.round(it.qty * it.unitCents) })) : paidParts).map((r, n) => (
            <tr key={n}><td>{"label" in r ? r.label : ""}</td><td className="r">{formatUsd(r.cents)}</td></tr>))}
          <tr><td><b>{done ? "Total paid" : "Paid so far"}</b></td><td className="r"><b>{formatUsd(paidCents)}</b></td></tr>
          {!done && <tr><td className="mut">Still to pay</td><td className="r mut">{formatUsd(inv.totalCents - paidCents)}</td></tr>}
        </tbody></table>
        {inv.memo && <p className="mut">{inv.memo}</p>}
      </div>
      <details className="more" style={{ marginBottom: 14 }}>
        <summary>More details <Icon name="chevron" /></summary>
        <div style={{ paddingBottom: 6 }}>
          {wins.map(a => (
            <div key={a.id}>
              {parts.length > 1 && <div className="kv"><span>Payment</span><span>{parts[partIndexOf(a)]?.label}</span></div>}
              <div className="kv"><span>Paid with</span><span>{a.amountInFormatted} {a.originSymbol} on {a.originChain}</span></div>
              {a.txHashes.map(t => <div className="kv" key={t.hash}><span>{t.kind === "origin" ? "Sender transaction" : "Payee transaction"}</span><span>{t.url ? <a href={t.url} target="_blank" rel="noreferrer">{t.hash}</a> : t.hash}</span></div>)}
            </div>))}
          <div className="kv"><span>Payee received</span><span>{inv.receive ? `${inv.receive.symbol} on ${inv.receive.blockchain}` : "USDC on NEAR"}</span></div>
          <div className="kv"><span>Delivered to</span><span>{inv.payout === "intents-balance" ? `NEAR Intents balance (${inv.freelancerNear})` : inv.freelancerNear}</span></div>
          <div className="kv"><span>Receipt for invoice</span><span>{inv.id}</span></div>
        </div>
      </details>
      <ReceiptActions link={`/r/${inv.id}`} />
      <p className="hint noprint" style={{ textAlign: "center" }}>Powered by NearZap, settled with NEAR Intents.</p>
    </>
  );
}
