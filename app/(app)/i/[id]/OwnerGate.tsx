"use client";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/profile";
import { Icon } from "@/components/Icon";

export interface OwnerData { id: string; state: string; totalLabel: string; receivedLabel: string; parts: { label: string; amount: string; state: string }[]; multi: boolean; paid: boolean }

/** The person who created the invoice (this device) sees its status and sharing tools instead of the payment form.
 *  "Preview as client" (?as=client) shows the payer's view. Everyone else always gets the payment form. */
export default function OwnerGate({ data, children }: { data: OwnerData; children: React.ReactNode }) {
  const [mode, setMode] = useState<"loading" | "owner" | "payer">("loading");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("as") === "client";
    setMode(!preview && (loadProfile().mine ?? []).includes(data.id) ? "owner" : "payer");
  }, [data.id]);
  if (mode === "loading") return null;
  if (mode === "payer") return <>{children}</>;
  const link = typeof window !== "undefined" ? `${window.location.origin}/i/${data.id}` : `/i/${data.id}`;
  async function copy() { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this link", link); } }
  async function share() { try { await navigator.share({ title: "Invoice", url: link }); } catch { /* cancelled or unsupported */ } }
  const waiting = data.state === "open" || data.state === "overdue";
  return (
    <>
      <div className="card">
        <h2>Status</h2>
        <p className="statusline"><span className={`badge big ${data.state}`}>{data.state}</span>
          <span className="mut">{data.paid ? `${data.receivedLabel} received` : waiting ? "Waiting for your client to pay" : data.state === "pending" ? "A payment is on its way" : data.state === "partial" ? `${data.receivedLabel} of ${data.totalLabel} received` : data.state === "refunded" ? "The last payment was refunded" : ""}</span></p>
        {data.multi && <div className="stack">{data.parts.map((p, i) => (
          <div className="kv" key={i} style={{ borderTop: i ? undefined : 0 }}><span>{p.label} · {p.amount}</span><span className={`badge ${p.state}`}>{p.state === "paid" ? "Paid" : p.state === "pending" ? "In progress" : "Open"}</span></div>))}</div>}
      </div>
      <div className="card">
        <h2>Send it to your client</h2>
        <div className="addr">{link}</div>
        <p className="btnrow">
          <button onClick={copy}><Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy link"}</button>
          {typeof navigator !== "undefined" && "share" in navigator && <button className="sec" onClick={share}><Icon name="share" /> Share</button>}
          <a className="btn sec" href={`/i/${data.id}?as=client`}><Icon name="arrow" /> Preview as client</a>
          {(data.paid || data.state === "partial") && <a className="btn sec" href={`/r/${data.id}`}><Icon name="invoice" /> Receipt</a>}
        </p>
        <p className="hint">You created this invoice, so you can't pay it from here. Your client opens the link and pays.</p>
      </div>
    </>
  );
}
