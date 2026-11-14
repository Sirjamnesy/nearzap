import { listInvoices } from "@/lib/store";
import { refreshInvoice } from "@/lib/refresh";
import { formatUsd, invoiceState } from "@/lib/invoice";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const all = await listInvoices();
  const invoices = await Promise.all(all.map(i => refreshInvoice(i.id).then(r => r ?? i)));
  const paid = invoices.filter(i => invoiceState(i) === "paid").reduce((s, i) => s + i.totalCents, 0);
  const outstanding = invoices.filter(i => ["open", "pending", "overdue"].includes(invoiceState(i))).reduce((s, i) => s + i.totalCents, 0);
  return (
    <>
      <h1>Invoices</h1>
      <p className="mut">Send a link. Your client pays from whatever chain they hold. You receive USDC on NEAR and never need NEAR for gas.</p>
      <div className="row2">
        <div className="card"><div className="mut">Received</div><div className="total">{formatUsd(paid)}</div></div>
        <div className="card"><div className="mut">Outstanding</div><div className="total">{formatUsd(outstanding)}</div></div>
      </div>
      <p><a className="btn" href="/new">New invoice</a> <a className="btn sec" href="/api/export">Export CSV</a></p>
      <div className="card">
        {invoices.length === 0 ? <p className="mut">No invoices yet. Create your first one.</p> : (
          <table><thead><tr><th>Client</th><th>Due</th><th className="r">Amount</th><th>Status</th></tr></thead><tbody>
            {invoices.map(i => { const s = invoiceState(i); return (
              <tr key={i.id}><td><a href={`/i/${i.id}`}>{i.clientName}</a><div className="mut">{i.id}</div></td><td>{i.dueDate}</td>
                <td className="r">{formatUsd(i.totalCents)}</td><td><span className={`badge ${s}`}>{s}</span></td></tr>); })}
          </tbody></table>)}
      </div>
    </>
  );
}
