"use client";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export default function PayMeForm({ handle, first }: { handle: string; first: string }) {
  const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch(`/api/payees/${handle}/invoice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountCents: Math.round(parseFloat(amount || "0") * 100), note }) });
    const d = await res.json();
    if (res.ok) { window.location.href = d.link; return; }
    setErr(d.error ?? "Something went wrong."); setBusy(false);
  }
  return (
    <form className="card" style={{ textAlign: "left" }} onSubmit={go}>
      <label>Amount (USD)</label>
      <input inputMode="decimal" style={{ fontSize: 30, fontWeight: 700 }} placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
      <label>Note (optional)</label>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder={`What is it for?`} maxLength={140} />
      {err && <div className="err">{err}</div>}
      <p><button disabled={busy} style={{ width: "100%" }}>{busy ? "One moment…" : <>Continue <Icon name="arrow" size={16} /></>}</button></p>
      <p className="hint">Continue: choose how you want to pay on the next screen. You pay from your own wallet; {first} never needs gas.</p>
    </form>
  );
}
