"use client";
import { useEffect, useState } from "react";
import CopyRow from "@/components/CopyRow";
import { Icon } from "@/components/Icon";
import { clearProfile, emptyProfile, loadProfile, saveProfile, type Profile } from "@/lib/profile";

interface Tok { assetId: string; symbol: string; blockchain: string }
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

export default function ProfilePage() {
  const [p, setP] = useState<Profile>(emptyProfile());
  const [tokens, setTokens] = useState<Tok[]>([]);
  const [defaultAsset, setDefaultAsset] = useState("");
  const [saved, setSaved] = useState(false);
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const l = loadProfile(); setP(l); setHandle(l.handle ?? "");
    fetch("/api/tokens").then(r => r.json()).then(d => { if (d.tokens) { setTokens(d.tokens); setDefaultAsset(d.payout?.assetId ?? ""); } }).catch(() => undefined);
  }, []);
  const update = (n: Profile) => { setP(n); saveProfile(n); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const receiveId = p.receiveAssetId || defaultAsset;
  const link = typeof window !== "undefined" && p.handle ? `${window.location.origin}/u/${p.handle}` : "";

  async function publish() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/payees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      handle, name: p.name, near: p.near, payout: p.payout ?? "intents-balance", receiveAssetId: p.receiveAssetId, editKey: p.handle === handle ? p.editKey : undefined }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { setMsg(d.error ?? "Could not save."); return; }
    update({ ...p, handle: d.payee.handle, editKey: d.editKey ?? p.editKey });
    setMsg(res.status === 201 ? "Your Pay me page is live." : "Your Pay me page is updated.");
  }

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <span className="avatar" style={{ width: 84, height: 84, fontSize: 30, margin: "6px 0 0" }}>{initials(p.name) || <Icon name="user" size={36} />}</span>
        <h1>{p.name || "Your profile"}</h1>
        <p className="mut">Optional. Saved only on this device, with no account. It pre-fills your invoices.</p>
      </div>

      <div className="card">
        <label>Your name</label>
        <input value={p.name} onChange={e => update({ ...p, name: e.target.value })} />
        <label>Your NEAR account (where you get paid)</label>
        <input value={p.near} onChange={e => update({ ...p, near: e.target.value.trim() })} placeholder="alice.near or 64-character address" />
        <label>You receive</label>
        <select value={receiveId} onChange={e => update({ ...p, receiveAssetId: e.target.value })}>{tokens.map(t => <option key={t.assetId} value={t.assetId}>{t.symbol} on {t.blockchain}</option>)}</select>
        <label>Deliver to</label>
        <select value={p.payout ?? "intents-balance"} onChange={e => update({ ...p, payout: e.target.value as "intents-balance" | "wallet" })}>
          <option value="intents-balance">My NEAR Intents balance (no gas)</option>
          <option value="wallet">My wallet on that chain</option>
        </select>
        <p className="hint">{saved ? "Saved ✓" : "Changes save automatically. These are the defaults for new invoices and your Pay me page."}</p>
      </div>

      <div className="card">
        <div className="iconh" style={{ marginBottom: 8 }}><span className="ic"><Icon name="qr" /></span><h2 style={{ margin: 0 }}>Your Pay me page</h2></div>
        <p className="mut">One permanent link and QR code. Anyone opens it, types an amount and pays from any chain.</p>
        <label>Pick a handle</label>
        <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="yourname" maxLength={24} />
        <p><button disabled={busy || handle.length < 3 || !p.name || !p.near} onClick={publish}>{busy ? "Saving…" : p.handle ? "Update my page" : "Create my page"}</button></p>
        <p className="hint">Create my page: publishes a public page with your name and payout settings above. Needs your name and NEAR account. Your address itself is never shown on it.</p>
        {msg && <div className={msg.startsWith("Your") ? "mut" : "err"}>{msg}</div>}
        {link && (<div className="stack"><CopyRow label="Your link" value={link} copy={link} /><p className="btnrow"><a className="btn sec" href={`/u/${p.handle}`} target="_blank" rel="noreferrer"><Icon name="arrow" /> Open my page</a></p></div>)}
      </div>

      <div className="card">
        <h2>Addresses you've used</h2>
        {p.recent.length === 0 ? <p className="mut">None yet. An address appears here after you create an invoice with it.</p> : p.recent.map(a => (
          <div key={a} style={{ marginBottom: 10 }}>
            <div className="addr">{a}{a === p.near ? "  (default)" : ""}</div>
            <p className="btnrow" style={{ margin: "8px 0 0" }}>
              <button className="sec" disabled={a === p.near} onClick={() => update({ ...p, near: a })}>Make default</button>
              <button className="sec" onClick={() => update({ ...p, recent: p.recent.filter(x => x !== a) })}>Forget</button>
            </p>
          </div>))}
        <p className="hint">Make default: pre-fills the invoice form with this address. Forget: removes it from this list only.</p>
      </div>
      <button className="sec" onClick={() => { if (confirm("Clear your saved profile from this device? Your invoices stay, but this device will no longer list them.")) { clearProfile(); setP(emptyProfile()); setHandle(""); } }}>Clear profile</button>
      <p className="hint">Clear profile: wipes everything saved here, including the list of invoices this device created and your Pay me edit key.</p>
    </>
  );
}
