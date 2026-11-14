"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { formatUsd, invoiceState, partState, partsOf } from "@/lib/invoice";
import { loadProfile } from "@/lib/profile";
import type { Invoice } from "@/lib/types";

const outstandingCents = (i: Invoice) => partsOf(i).reduce((s, p, n) => s + (partState(i, n) === "paid" ? 0 : p.cents), 0);
const receivedCents = (i: Invoice) => partsOf(i).reduce((s, p, n) => s + (partState(i, n) === "paid" ? p.cents : 0), 0);

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [toast, setToast] = useState("");
  const [alerts, setAlerts] = useState<"on" | "off" | "unsupported">("off");
  const [handle, setHandle] = useState("");
  const seen = useRef<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    const p = loadProfile(); setHandle(p.handle ?? "");
    const res = await fetch("/api/invoices/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: p.mine ?? [], handle: p.handle, editKey: p.editKey }) }).catch(() => null);
    if (!res?.ok) return;
    const { invoices: list } = (await res.json()) as { invoices: Invoice[] };
    for (const inv of list) {
      const now = invoiceState(inv), before = seen.current.get(inv.id);
      if (before && before !== now && (now === "paid" || now === "partial")) {
        const msg = `${inv.clientName} paid ${formatUsd(receivedCents(inv))} on your invoice`;
        setToast(msg); setTimeout(() => setToast(""), 6000);
        try { if (Notification.permission === "granted") new Notification("NearZap: payment received", { body: msg }); } catch { /* not supported */ }
      }
      seen.current.set(inv.id, now);
    }
    setInvoices(list);
  }, []);

  useEffect(() => {
    load(); const t = setInterval(load, 8000);
    setAlerts(typeof Notification === "undefined" ? "unsupported" : Notification.permission === "granted" ? "on" : "off");
    return () => clearInterval(t);
  }, [load]);

  async function enableAlerts() {
    try { const r = await Notification.requestPermission(); setAlerts(r === "granted" ? "on" : "off"); } catch { setAlerts("unsupported"); }
  }

  const list = invoices ?? [];
  const received = list.reduce((s, i) => s + receivedCents(i), 0);
  const outstanding = list.filter(i => invoiceState(i) !== "refunded").reduce((s, i) => s + outstandingCents(i), 0);
  const csv = `/api/export?ids=${list.map(i => i.id).join(",")}`;

  return (
    <>
      <h1>Invoices</h1>
      <p className="mut">Send a link. Your client pays from whatever chain they hold, and you get what you asked for.</p>
      <div className="row2">
        <div className="card"><div className="mut">Received</div><div className="total">{formatUsd(received)}</div></div>
        <div className="card"><div className="mut">Outstanding</div><div className="total">{formatUsd(outstanding)}</div></div>
      </div>
      <div className="btnrow">
        <a className="btn" href="/new"><Icon name="plus" /> New invoice</a>
        {list.length > 0 && <a className="btn sec" href={csv}><Icon name="download" /> Export CSV</a>}
        {alerts === "off" && <button className="sec" onClick={enableAlerts}><Icon name="bell" /> Turn on alerts</button>}
      </div>
      <p className="hint">New invoice: make a payment link to send. Export CSV: all your invoices for your records.{alerts === "off" ? " Turn on alerts: a phone or desktop ping when someone pays, while this page is open." : ""}</p>

      {handle && <p><a className="pill" href={`/u/${handle}`}><Icon name="link" size={15} /> Your Pay me page: /u/{handle}</a></p>}

      <div className="card">
        {invoices === null ? <p className="mut">Loading…</p> : list.length === 0 ? <p className="mut">No invoices on this device yet. Create your first one.</p> : (
          <table><thead><tr><th>Client</th><th className="r">Amount</th><th>Status</th><th /></tr></thead><tbody>
            {list.map(i => { const s = invoiceState(i); return (
              <tr key={i.id}>
                <td><a href={`/i/${i.id}`}>{i.clientName}</a><div className="mut">{i.dueDate ? `Due ${i.dueDate}` : i.id}</div></td>
                <td className="r">{formatUsd(i.totalCents)}</td>
                <td><span className={`badge ${s}`}>{s}</span></td>
                <td className="r">{(s === "paid" || s === "partial") && <a href={`/r/${i.id}`} aria-label="Receipt" title="Receipt"><Icon name="invoice" /></a>}</td>
              </tr>); })}
          </tbody></table>)}
      </div>

      <div className="card iconh">
        <span className="ic"><Icon name="wallet" /></span>
        <div><b>Where does my money land?</b>
          <div className="mut">In your NEAR Intents balance, unless you chose a wallet on the invoice. Your wallet app will not show it. See and withdraw it at <a href="https://near-intents.org" target="_blank" rel="noreferrer">near-intents.org</a> with the same account.</div></div>
      </div>
      {toast && <div className="toast" role="status"><Icon name="check" /> {toast}</div>}
    </>
  );
}
