"use client";
import { useEffect, useState } from "react";
import { clearProfile, emptyProfile, loadProfile, saveProfile, type Profile } from "@/lib/profile";

export default function ProfilePage() {
  const [p, setP] = useState<Profile>(emptyProfile());
  const [saved, setSaved] = useState(false);
  useEffect(() => setP(loadProfile()), []);
  const update = (n: Profile) => { setP(n); saveProfile(n); setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <>
      <h1>Profile</h1>
      <p className="mut">Optional. Saved only on this device, with no account. It pre-fills the invoice form so you don't retype your details.</p>
      <div className="card">
        <label>Your name</label>
        <input value={p.name} onChange={e => update({ ...p, name: e.target.value })} />
        <label>Default NEAR account (where you get paid)</label>
        <input value={p.near} onChange={e => update({ ...p, near: e.target.value.trim() })} placeholder="alice.near or 64-character address" />
        <p className="hint">{saved ? "Saved ✓" : "Changes save automatically."}</p>
      </div>
      <div className="card">
        <h2>Addresses you've used</h2>
        {p.recent.length === 0 ? <p className="mut">None yet. An address appears here after you create an invoice with it.</p> : p.recent.map(a => (
          <div key={a} style={{ marginBottom: 10 }}>
            <div className="addr">{a}{a === p.near ? "  (default)" : ""}</div>
            <button className="sec" disabled={a === p.near} onClick={() => update({ ...p, near: a })}>Make default</button>{" "}
            <button className="sec" onClick={() => update({ ...p, recent: p.recent.filter(x => x !== a) })}>Forget</button>
          </div>))}
        <p className="hint">Make default: pre-fills the invoice form with this address. Forget: removes it from this list only.</p>
      </div>
      <button className="sec" onClick={() => { if (confirm("Clear your saved name and addresses from this device?")) { clearProfile(); setP(emptyProfile()); } }}>Clear profile</button>
      <p className="hint">Clear profile: wipes everything saved here. Your existing invoices are not affected.</p>
    </>
  );
}
