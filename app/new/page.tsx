"use client";
import { useState } from "react";

interface Item { description: string; qty: string; price: string }
const toCents = (p: string) => Math.round(parseFloat(p || "0") * 100);

export default function NewInvoice() {
  const [f, setF] = useState({ freelancerName: "", freelancerNear: "", clientName: "", clientEmail: "", dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), memo: "", payout: "intents-balance" });
  const [items, setItems] = useState<Item[]>([{ description: "", qty: "1", price: "" }]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const total = items.reduce((s, i) => s + Math.round(parseFloat(i.qty || "0") * toCents(i.price)), 0);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const setItem = (n: number, k: keyof Item, v: string) => setItems(items.map((it, i) => (i === n ? { ...it, [k]: v } : it)));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors([]);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, items: items.map(i => ({ description: i.description, qty: parseFloat(i.qty), unitCents: toCents(i.price) })) }) });
    const data = await res.json();
    if (res.ok) { window.location.href = `/i/${data.invoice.id}`; return; }
    setErrors(data.errors ?? [data.error ?? "Something went wrong."]); setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      <h1>New invoice</h1>
      <div className="card">
        <div className="row2">
          <div><label>Your name</label><input value={f.freelancerName} onChange={set("freelancerName")} required /></div>
          <div><label>Your NEAR account</label><input value={f.freelancerNear} onChange={set("freelancerNear")} placeholder="alice.near" required /></div>
        </div>
        <label>How should USDC reach you?</label>
        <select value={f.payout} onChange={set("payout")}>
          <option value="intents-balance">Intents balance: no gas, no setup (recommended)</option>
          <option value="near-wallet">Straight to my NEAR wallet (needs USDC registered on the account)</option>
        </select>
        <div className="row2">
          <div><label>Client name</label><input value={f.clientName} onChange={set("clientName")} required /></div>
          <div><label>Due date</label><input type="date" value={f.dueDate} onChange={set("dueDate")} required /></div>
        </div>
      </div>
      <div className="card">
        <h2>Line items (USD, paid out as USDC)</h2>
        {items.map((it, n) => (
          <div className="row" key={n}>
            <div><label>Description</label><input value={it.description} onChange={e => setItem(n, "description", e.target.value)} required /></div>
            <div><label>Qty</label><input inputMode="decimal" value={it.qty} onChange={e => setItem(n, "qty", e.target.value)} /></div>
            <div><label>Unit price</label><input inputMode="decimal" value={it.price} onChange={e => setItem(n, "price", e.target.value)} placeholder="0.00" required /></div>
            <button type="button" className="sec" aria-label="Remove line" onClick={() => setItems(items.filter((_, i) => i !== n))} disabled={items.length === 1}>×</button>
          </div>))}
        <p><button type="button" className="sec" onClick={() => setItems([...items, { description: "", qty: "1", price: "" }])}>+ Add line</button></p>
        <label>Note (optional)</label><textarea rows={2} value={f.memo} onChange={set("memo")} />
        <p className="total">${(total / 100).toFixed(2)}</p>
      </div>
      {errors.map((m, i) => <div className="err" key={i}>{m}</div>)}
      <button disabled={busy}>{busy ? "Creating…" : "Create invoice link"}</button>
    </form>
  );
}
