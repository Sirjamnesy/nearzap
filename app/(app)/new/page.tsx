"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { loadProfile, rememberInvoice, rememberUse, saveProfile, type Profile } from "@/lib/profile";

interface Item { description: string; qty: string; price: string }
interface Tok { assetId: string; symbol: string; blockchain: string; decimals: number; price?: number }
interface Ms { label: string; amount: string }
const toCents = (p: string) => Math.round(parseFloat(p || "0") * 100) || 0;
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

export default function NewInvoice() {
  const [f, setF] = useState({ freelancerName: "", freelancerNear: "", clientName: "", dueDate: "", memo: "", payout: "intents-balance" as "intents-balance" | "wallet" });
  const [tokens, setTokens] = useState<Tok[]>([]);
  const [defaultAsset, setDefaultAsset] = useState("");
  const [receiveId, setReceiveId] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", qty: "1", price: "" }]);
  const [detailed, setDetailed] = useState(false);
  const [amount, setAmount] = useState(""); const [what, setWhat] = useState("");
  const [mode, setMode] = useState<"single" | "deposit" | "milestones">("single");
  const [depositPct, setDepositPct] = useState("50");
  const [ms, setMs] = useState<Ms[]>([{ label: "Kickoff", amount: "" }, { label: "Delivery", amount: "" }]);
  const [splits, setSplits] = useState<{ account: string; percent: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Profile>({ name: "", near: "", recent: [] });
  const [remember, setRemember] = useState(true);
  const [created, setCreated] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const p = loadProfile(); setProfile(p);
    setF(cur => ({ ...cur, freelancerName: cur.freelancerName || p.name, freelancerNear: cur.freelancerNear || p.near, payout: p.payout ?? cur.payout }));
    fetch("/api/tokens").then(r => r.json()).then(d => { if (d.tokens) { setTokens(d.tokens); setDefaultAsset(d.payout?.assetId ?? ""); setReceiveId(p.receiveAssetId || d.payout?.assetId || ""); } }).catch(() => undefined);
  }, []);

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const setItem = (n: number, k: keyof Item, v: string) => setItems(items.map((it, i) => (i === n ? { ...it, [k]: v } : it)));
  const receive = tokens.find(t => t.assetId === receiveId);
  const chain = f.payout === "wallet" ? (receive?.blockchain ?? "near") : "near";

  const baseTotal = detailed ? items.reduce((s, i) => s + Math.round((parseFloat(i.qty) || 0) * toCents(i.price)), 0) : toCents(amount);
  const msTotal = ms.reduce((s, m) => s + toCents(m.amount), 0);
  const total = mode === "milestones" ? msTotal : baseTotal;
  const dep = Math.round(baseTotal * (Math.min(95, Math.max(5, parseInt(depositPct) || 50)) / 100));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors([]);
    let payloadItems: { description: string; qty: number; unitCents: number }[];
    let parts: { label: string; cents: number }[] | undefined;
    if (mode === "milestones") {
      payloadItems = ms.map(m => ({ description: m.label.trim(), qty: 1, unitCents: toCents(m.amount) }));
      parts = ms.map(m => ({ label: m.label.trim(), cents: toCents(m.amount) }));
    } else {
      payloadItems = detailed ? items.map(i => ({ description: i.description, qty: parseFloat(i.qty), unitCents: toCents(i.price) })) : [{ description: what.trim() || "Payment request", qty: 1, unitCents: toCents(amount) }];
      if (mode === "deposit") parts = [{ label: `Deposit (${Math.round((dep / Math.max(baseTotal, 1)) * 100)}%)`, cents: dep }, { label: "Balance", cents: baseTotal - dep }];
    }
    const body = {
      ...f, clientName: f.clientName.trim() || "Client", dueDate: f.dueDate || undefined, items: payloadItems, parts,
      receive: receive && receive.assetId !== defaultAsset ? receive : undefined,
      splits: splits.filter(s => s.account.trim()).map(s => ({ account: s.account.trim().toLowerCase(), percent: parseInt(s.percent) || 0 })),
    };
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      let p = rememberInvoice(profile, data.invoice.id);
      if (remember) p = { ...rememberUse(p, f.freelancerName, f.freelancerNear), receiveAssetId: receiveId || undefined, payout: f.payout };
      saveProfile(p); setProfile(p);
      setCreated({ id: data.invoice.id, link: `${window.location.origin}/i/${data.invoice.id}` }); setToast(true); setTimeout(() => setToast(false), 2600); setBusy(false); window.scrollTo(0, 0); return;
    }
    setErrors(data.errors ?? [data.error ?? "Something went wrong."]); setBusy(false);
  }

  async function copy(link: string) { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this link", link); } }
  async function share(link: string) { try { await navigator.share({ title: "Invoice", text: `Invoice from ${f.freelancerName}`, url: link }); } catch { /* cancelled or unsupported */ } }

  if (created) return (
    <>
      <h1>Send this link</h1>
      <p className="mut">Send it to {f.clientName.trim() || "your client"}. They open it and pay from any chain.</p>
      <div className="card">
        <div className="addr">{created.link}</div>
        <p className="btnrow">
          <button onClick={() => copy(created.link)}><Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy link"}</button>
          {typeof navigator !== "undefined" && "share" in navigator && <button className="sec" onClick={() => share(created.link)}><Icon name="share" /> Share</button>}
          <a className="btn sec" href={created.link}><Icon name="arrow" /> Preview as client</a>
        </p>
        <p className="hint">Copy link: paste it into WhatsApp, email or a DM. Share: opens your phone's share sheet. Preview as client: the page your client will see; you don't need to pay it.</p>
      </div>
      <div className="card iconh">
        <span className="ic"><Icon name="wallet" /></span>
        <div className="mut">{f.payout === "wallet" ? "Payments are sent straight to your wallet." : <>Payments land in your NEAR Intents balance. Your wallet app won't show it; check <a href="https://near-intents.org" target="_blank" rel="noreferrer">near-intents.org</a> with the same account.</>}</div>
      </div>
      {toast && <div className="toast info" role="status"><Icon name="link" /> Invoice created</div>}
      <p className="btnrow"><a className="btn sec" href="/invoices">Back to invoices</a> <a className="btn sec" href="/new">Create another</a></p>
    </>
  );

  return (
    <form onSubmit={submit}>
      <h1>New invoice</h1>
      <p className="mut">Enter an amount and get a link to send. Everything else is optional.</p>

      <div className="card">
        <label>Amount (USD)</label>
        {mode === "milestones" ? <p className="total">{usd(msTotal)} <span className="mut">from your payments below</span></p>
          : detailed ? <p className="total">{usd(baseTotal)}</p>
          : <input inputMode="decimal" style={{ fontSize: 30, fontWeight: 700 }} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />}
        {!detailed && mode !== "milestones" && <><label>What's it for? (optional)</label><input value={what} onChange={e => setWhat(e.target.value)} placeholder="e.g. Logo design" /></>}
        {detailed && mode !== "milestones" && (<>
          <h2 style={{ marginTop: 14 }}>Line items</h2>
          {items.map((it, n) => (
            <div className="row" key={n}>
              <div><label>Description</label><input value={it.description} onChange={e => setItem(n, "description", e.target.value)} required /></div>
              <div><label>Qty</label><input inputMode="decimal" value={it.qty} onChange={e => setItem(n, "qty", e.target.value)} /></div>
              <div><label>Unit price</label><input inputMode="decimal" value={it.price} onChange={e => setItem(n, "price", e.target.value)} placeholder="0.00" required /></div>
              <button type="button" className="sec" aria-label="Remove line" onClick={() => setItems(items.filter((_, i) => i !== n))} disabled={items.length === 1}><Icon name="x" size={16} /></button>
            </div>))}
          <p><button type="button" className="sec" onClick={() => setItems([...items, { description: "", qty: "1", price: "" }])}><Icon name="plus" size={16} /> Add another line</button></p>
        </>)}
        {mode !== "milestones" && <p><button type="button" className="sec" onClick={() => { if (!detailed && amount) setItems([{ description: what, qty: "1", price: amount }]); setDetailed(!detailed); }}>{detailed ? "Back to a single amount" : <><Icon name="plus" size={16} /> Add line items</>}</button></p>}
        <p className="hint">{detailed ? "Back to a single amount: switches to one simple total." : "Add line items: itemise the invoice (description, quantity, price per line). Optional."}</p>
        <label>Client name (optional)</label><input value={f.clientName} onChange={set("clientName")} placeholder="Who is this for?" />
      </div>

      <div className="card">
        <div className="row2">
          <div><label>Your name</label><input value={f.freelancerName} onChange={set("freelancerName")} required /></div>
          <div><label>{chain === "near" ? "Your NEAR account" : `Your ${chain} address`}</label><input list="recent-near" value={f.freelancerNear} onChange={set("freelancerNear")} placeholder={chain === "near" ? "alice.near" : "Address to receive on"} required /><datalist id="recent-near">{profile.recent.map(a => <option key={a} value={a} />)}</datalist></div>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" style={{ width: "auto" }} checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember my details on this device</label>
        <p className="hint">Next time the form is pre-filled. Manage it under your profile (top right).</p>
      </div>

      <details className="more" style={{ marginBottom: 14 }}>
        <summary>More options <Icon name="chevron" /></summary>
        <div style={{ paddingBottom: 14 }}>
          <label>Due date (optional)</label><input type="date" value={f.dueDate} onChange={set("dueDate")} />
          <p className="hint">Leave empty for no due date.</p>

          <label>You receive</label>
          <select value={receiveId} onChange={e => setReceiveId(e.target.value)}>{tokens.map(t => <option key={t.assetId} value={t.assetId}>{t.symbol} on {t.blockchain}</option>)}</select>
          <p className="hint">{receive && !/^(USDC|USDT|DAI|USDT0)$/i.test(receive.symbol) ? `Your client pays ${usd(total)} worth. It converts to ${receive.symbol} at today's price when they pay.` : "The asset that arrives for you. Your client can still pay with anything."}</p>

          <label>Deliver to</label>
          <select value={f.payout} onChange={set("payout")}>
            <option value="intents-balance">My NEAR Intents balance (no gas, no setup)</option>
            <option value="wallet">My wallet on that chain</option>
          </select>
          <p className="hint">Intents balance: held in your NEAR Intents account, withdraw whenever. Wallet: sent straight to the address above (the chain must support it).</p>

          <label>How is it paid?</label>
          <select value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
            <option value="single">One payment</option>
            <option value="deposit">Deposit, then balance</option>
            <option value="milestones">Milestones</option>
          </select>
          {mode === "deposit" && (<>
            <label>Deposit percent</label><input inputMode="numeric" value={depositPct} onChange={e => setDepositPct(e.target.value)} />
            <p className="hint">{baseTotal > 0 ? `${usd(dep)} now, ${usd(baseTotal - dep)} later.` : "Enter an amount first."} Your client pays each part with its own button on the same link.</p></>)}
          {mode === "milestones" && (<>
            {ms.map((m, n) => (
              <div className="row2" key={n} style={{ gridTemplateColumns: "1fr 120px 40px", alignItems: "end" }}>
                <div><label>Name</label><input value={m.label} onChange={e => setMs(ms.map((x, i) => i === n ? { ...x, label: e.target.value } : x))} required /></div>
                <div><label>Amount</label><input inputMode="decimal" value={m.amount} onChange={e => setMs(ms.map((x, i) => i === n ? { ...x, amount: e.target.value } : x))} placeholder="0.00" required /></div>
                <button type="button" className="sec" aria-label="Remove" onClick={() => setMs(ms.filter((_, i) => i !== n))} disabled={ms.length <= 2} style={{ padding: 10 }}><Icon name="x" size={16} /></button>
              </div>))}
            <p><button type="button" className="sec" disabled={ms.length >= 6} onClick={() => setMs([...ms, { label: "", amount: "" }])}><Icon name="plus" size={16} /> Add milestone</button></p>
            <p className="hint">Each milestone is paid separately on the same link. The total is their sum.</p></>)}

          <label>Refer someone (optional)</label>
          {splits.map((s, n) => (
            <div className="row2" key={n} style={{ gridTemplateColumns: "1fr 90px 40px", alignItems: "end", marginBottom: 8 }}>
              <input placeholder="their NEAR account" value={s.account} onChange={e => setSplits(splits.map((x, i) => i === n ? { ...x, account: e.target.value } : x))} />
              <input inputMode="numeric" placeholder="%" value={s.percent} onChange={e => setSplits(splits.map((x, i) => i === n ? { ...x, percent: e.target.value } : x))} />
              <button type="button" className="sec" aria-label="Remove" onClick={() => setSplits(splits.filter((_, i) => i !== n))} style={{ padding: 10 }}><Icon name="x" size={16} /></button>
            </div>))}
          {splits.length < 2 && <p><button type="button" className="sec" onClick={() => setSplits([...splits, { account: "", percent: "2" }])}><Icon name="split" size={16} /> Share a cut</button></p>}
          <p className="hint">Automatically pays another NEAR account a share of each payment (1 to 4% in total, the most the network allows). You get the rest.</p>
        </div>
      </details>

      {errors.map((m, i) => <div className="err" key={i}>{m}</div>)}
      <button disabled={busy} style={{ width: "100%" }}>{busy ? "Creating…" : total > 0 ? `Create link for ${usd(total)}` : "Create invoice link"}</button>
      <p className="hint">Creates the invoice and gives you a link to send to your client.</p>
    </form>
  );
}
