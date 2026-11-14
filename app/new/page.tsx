"use client";
import { useEffect, useState } from "react";
import { loadProfile, rememberUse, saveProfile, type Profile } from "@/lib/profile";

interface Item { description: string; qty: string; price: string }
const toCents = (p: string) => Math.round(parseFloat(p || "0") * 100);

export default function NewInvoice() {
  const [f, setF] = useState({ freelancerName: "", freelancerNear: "", clientName: "", clientEmail: "", dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), memo: "", payout: "intents-balance" });
  const [items, setItems] = useState<Item[]>([{ description: "", qty: "1", price: "" }]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Profile>({ name: "", near: "", recent: [] });
  const [remember, setRemember] = useState(true);
  const [created, setCreated] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const p = loadProfile(); setProfile(p); setF(cur => ({ ...cur, freelancerName: cur.freelancerName || p.name, freelancerNear: cur.freelancerNear || p.near })); }, []);
  const total = items.reduce((s, i) => s + Math.round(parseFloat(i.qty || "0") * toCents(i.price)), 0);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const setItem = (n: number, k: keyof Item, v: string) => setItems(items.map((it, i) => (i === n ? { ...it, [k]: v } : it)));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors([]);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, items: items.map(i => ({ description: i.description, qty: parseFloat(i.qty), unitCents: toCents(i.price) })) }) });
    const data = await res.json();
    if (res.ok) {
      if (remember) saveProfile(rememberUse(profile, f.freelancerName, f.freelancerNear));
      setCreated({ id: data.invoice.id, link: `${window.location.origin}/i/${data.invoice.id}` }); setBusy(false); window.scrollTo(0, 0); return;
    }
    setErrors(data.errors ?? [data.error ?? "Something went wrong."]); setBusy(false);
  }

  async function copy(link: string) { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this link", link); } }
  async function share(link: string) { try { await navigator.share({ title: "Invoice", text: `Invoice from ${f.freelancerName}`, url: link }); } catch { /* cancelled or unsupported */ } }

  if (created) return (
    <>
      <h1>Invoice created ✓</h1>
      <p className="mut">Send this link to {f.clientName}. They open it, choose how they want to pay, and you get USDC on NEAR.</p>
      <div className="card">
        <div className="addr">{created.link}</div>
        <p>
          <button onClick={() => copy(created.link)}>{copied ? "Copied ✓" : "Copy link"}</button>{" "}
          {typeof navigator !== "undefined" && "share" in navigator && <button className="sec" onClick={() => share(created.link)}>Share…</button>}
        </p>
        <p className="hint">Copy link: copies the address above so you can paste it into WhatsApp, email or a DM. Share: opens your phone's share sheet.</p>
        <p><a className="btn sec" href={created.link} target="_blank" rel="noreferrer">Preview as client</a></p>
        <p className="hint">Preview as client: opens the page your client will see. You don't need to pay it.</p>
      </div>
      <p><a className="btn sec" href="/">Back to invoices</a> <a className="btn sec" href="/new">Create another</a></p>
    </>
  );

  return (
    <form onSubmit={submit}>
      <h1>New invoice</h1>
      <div className="card">
        <div className="row2">
          <div><label>Your name</label><input value={f.freelancerName} onChange={set("freelancerName")} required /></div>
          <div><label>Your NEAR account</label><input list="recent-near" value={f.freelancerNear} onChange={set("freelancerNear")} placeholder="alice.near" required /><datalist id="recent-near">{profile.recent.map(a => <option key={a} value={a} />)}</datalist></div>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" style={{ width: "auto" }} checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember my name and address on this device</label>
        <p className="hint">Next time the form is pre-filled. Manage it anytime under Profile.</p>
        <label>How should USDC reach you?</label>
        <select value={f.payout} onChange={set("payout")}>
          <option value="intents-balance">Intents balance: no gas, no setup (recommended)</option>
          <option value="near-wallet">Straight to my NEAR wallet (needs USDC registered on the account)</option>
        </select>
        <p className="hint">Intents balance: your USDC waits in your NEAR Intents account, and you withdraw when you like. Wallet: sent straight to your NEAR account.</p>
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
      <p className="hint">Creates the invoice and gives you a link to send to your client.</p>
    </form>
  );
}
