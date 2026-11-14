"use client";
import { useEffect, useRef, useState } from "react";
import CopyRow from "@/components/CopyRow";
import { Icon } from "@/components/Icon";
import { formatUsd, invoiceState, partIndexOf, partState } from "@/lib/invoice";
import type { Invoice, PaymentAttempt } from "@/lib/types";

interface Token { assetId: string; symbol: string; blockchain: string }
type Att = PaymentAttempt;
interface Info { id: string; totalCents: number; parts: { label: string; cents: number }[]; multi: boolean; receiveLabel: string; deliverLabel: string; clientName: string; payeeName: string; dueDate: string }

const LABEL: Record<string, string> = { PENDING_DEPOSIT: "Waiting for your deposit", KNOWN_DEPOSIT_TX: "Deposit detected", PROCESSING: "Sending to the payee", SUCCESS: "Paid", INCOMPLETE_DEPOSIT: "Deposit was too small; send the rest", REFUNDED: "Refunded to your address", FAILED: "Failed", EXPIRED: "Quote expired. Start again" };
const STEP: Record<string, number> = { PENDING_DEPOSIT: 1, INCOMPLETE_DEPOSIT: 1, KNOWN_DEPOSIT_TX: 2, PROCESSING: 3, SUCCESS: 4 };
const LIVE = ["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "PROCESSING", "SUCCESS", "INCOMPLETE_DEPOSIT"];

export default function PayPanel({ info, initialAttempts }: { info: Info; initialAttempts: Att[] }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [demo, setDemo] = useState(false);
  const [asset, setAsset] = useState("");
  const [refundTo, setRefundTo] = useState("");
  const [attempts, setAttempts] = useState<Att[]>(initialAttempts);
  const asInvoice = (a: Att[]) => ({ attempts: a, parts: info.parts, totalCents: info.totalCents, dueDate: info.dueDate }) as unknown as Invoice;
  const firstOpen = (a: Att[]) => { const inv = asInvoice(a); const n = info.parts.findIndex((_, i) => partState(inv, i) !== "paid"); return n < 0 ? 0 : n; };
  const [sel, setSel] = useState(() => firstOpen(initialAttempts));
  const [qr, setQr] = useState("");
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState("");
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => { fetch("/api/tokens").then(r => r.json()).then(d => { if (d.error) setErr(d.error); else { setTokens(d.tokens); setDemo(d.demo); setAsset(d.tokens[0]?.assetId ?? ""); } }); }, []);

  const inv = asInvoice(attempts);
  const state = invoiceState(inv);
  const attempt = attempts.filter(a => partIndexOf(a) === sel && LIVE.includes(a.status)).at(-1) ?? null;
  const final = !!attempt && ["SUCCESS", "REFUNDED", "FAILED", "EXPIRED"].includes(attempt.status);
  const watching = attempts.some(a => ["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "PROCESSING", "INCOMPLETE_DEPOSIT"].includes(a.status));

  useEffect(() => {
    clearInterval(timer.current);
    if (!watching) return;
    timer.current = setInterval(async () => {
      const d = await fetch(`/api/invoices/${info.id}/status`).then(r => r.json()).catch(() => null);
      if (d?.attempts) setAttempts(d.attempts);
    }, 3000);
    return () => clearInterval(timer.current);
  }, [watching, info.id]);

  // when the selected part gets paid, move to the next unpaid part
  useEffect(() => { if (partState(inv, sel) === "paid" && state !== "paid") setSel(firstOpen(attempts)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [attempts]);

  async function quote(dry: boolean) {
    setBusy(true); setErr(""); setPreview("");
    const res = await fetch(`/api/invoices/${info.id}/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originAssetId: asset, refundTo, dry, partIndex: sel }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { setErr(d.error ?? "Could not get a quote."); return; }
    if (dry) setPreview(`You would send about ${d.quote.amountInFormatted} ${d.quote.symbol} on ${d.quote.chain}.`);
    else { setAttempts([...attempts, d.attempt]); setQr(d.qr); }
  }
  async function act(action: string, extra: object = {}) {
    setErr("");
    const res = await fetch(`/api/invoices/${info.id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, attemptId: attempt?.id, ...extra }) });
    if (!res.ok) setErr((await res.json()).error ?? "Request failed.");
  }

  // ---------- fully paid ----------
  if (state === "paid") {
    const paid = attempts.filter(a => a.status === "SUCCESS");
    return (
      <div className="card">
        <div className="paidhero">
          <span className="paidcircle"><Icon name="check" /></span>
          <h2>Paid</h2>
          <div className="total">{formatUsd(info.totalCents)}</div>
          <p className="mut">Thank you{info.clientName && !["Client", "Guest"].includes(info.clientName) ? `, ${info.clientName}` : ""}. {info.payeeName} has been paid.</p>
          <p className="btnrow" style={{ justifyContent: "center" }}><a className="btn" href={`/r/${info.id}`}><Icon name="invoice" /> View receipt</a></p>
        </div>
        <details className="more">
          <summary>More details <Icon name="chevron" /></summary>
          <div style={{ paddingBottom: 6 }}>
            {paid.map(a => (
              <div key={a.id}>
                {info.multi && <div className="kv"><span>Payment</span><span>{info.parts[partIndexOf(a)]?.label}</span></div>}
                <div className="kv"><span>Paid with</span><span>{a.amountInFormatted} {a.originSymbol} on {a.originChain}</span></div>
                <div className="kv"><span>Paid on</span><span>{new Date(a.updatedAt).toLocaleString()}</span></div>
                {a.txHashes.map(t => <div className="kv" key={t.hash}><span>{t.kind === "origin" ? "Your transaction" : "Payee transaction"}</span><span>{t.url ? <a href={t.url} target="_blank" rel="noreferrer">{t.hash}</a> : t.hash}</span></div>)}
              </div>))}
            <div className="kv"><span>Payee received</span><span>{info.receiveLabel}</span></div>
            <div className="kv"><span>Delivered to</span><span>{info.deliverLabel}</span></div>
            <div className="kv"><span>Invoice</span><span>{info.id}</span></div>
          </div>
        </details>
      </div>
    );
  }

  const step = attempt ? STEP[attempt.status] ?? 0 : 0;
  const inv0 = asInvoice(attempts);
  return (
    <>
      {info.multi && (
        <div className="card">
          <h2>Payments</h2>
          <div className="stack">
            {info.parts.map((p, i) => { const st = partState(inv0, i); return (
              <button key={i} type="button" className={`part${sel === i ? " sel" : ""}`} disabled={st === "paid"} onClick={() => { setSel(i); setPreview(""); setErr(""); }}>
                <span><b>{p.label}</b><br /><span className="mut">{formatUsd(p.cents)}</span></span>
                <span className={`badge ${st === "paid" ? "paid" : st === "pending" ? "pending" : "open"}`}>{st === "paid" ? "Paid" : st === "pending" ? "In progress" : sel === i ? "Selected" : "Pay"}</span>
              </button>); })}
          </div>
          <p className="hint">Pick a payment, then pay it below. Each part is paid on its own.</p>
          {state === "partial" && <p className="btnrow"><a className="btn sec" href={`/r/${info.id}`}><Icon name="invoice" /> Receipt so far</a></p>}
        </div>)}

      <div className="card">
        <h2>{info.multi ? `Pay ${info.parts[sel]?.label.toLowerCase()}` : "Pay this invoice"}</h2>
        {!attempt || final ? (
          <div className="grid">
            <div><label>Pay with</label>
              <select value={asset} onChange={e => { setAsset(e.target.value); setPreview(""); }}>{tokens.map(t => <option key={t.assetId} value={t.assetId}>{t.symbol} on {t.blockchain}</option>)}</select></div>
            <div><label>Your refund address on that chain (used only if the payment fails)</label><input value={refundTo} onChange={e => setRefundTo(e.target.value)} placeholder="0x… / your wallet address" /></div>
            {attempt && final && <div className="err">{LABEL[attempt.status]}</div>}
            {preview && <div className="mut">{preview}</div>}
            <div className="btnrow">
              <button className="sec" disabled={busy || !asset || refundTo.length < 8} onClick={() => quote(true)}>Preview price</button>
              <button disabled={busy || !asset || refundTo.length < 8} onClick={() => quote(false)}>{busy ? "Working…" : <>Get deposit address <Icon name="arrow" size={16} /></>}</button>
            </div>
            <p className="hint">Preview price: shows how much you'd send, and commits to nothing. Get deposit address: locks the price and shows where to send it.</p>
          </div>
        ) : (
          <div className="grid">
            <CopyRow label="Amount to send" value={`${attempt.amountInFormatted} ${attempt.originSymbol}`} copy={attempt.amountInFormatted} />
            <CopyRow label={`Address on ${attempt.originChain}`} value={attempt.depositAddress} mono />
            <p className="hint" style={{ margin: 0 }}>Send exactly this amount, on {attempt.originChain}, to this address. Use the copy buttons to avoid typos.</p>
            {qr && <img src={qr} alt="Deposit address QR code" width={150} height={150} style={{ justifySelf: "center" }} />}
            <div className="mut">Valid until {new Date(attempt.deadline).toLocaleTimeString()}. Sending less, or after that, triggers a refund.</div>
            <div className="steps" aria-label="progress">{[1, 2, 3, 4].map(n => <div key={n} className={`step ${step >= n ? "on" : ""}`} />)}</div>
            <div id="attempt-status"><b>{LABEL[attempt.status] ?? attempt.status}</b></div>
            {attempt.status === "PENDING_DEPOSIT" && (
              <details className="more">
                <summary>Already sent it? <Icon name="chevron" /></summary>
                <div style={{ paddingBottom: 14 }}>
                  <label>Transaction hash</label><input value={txHash} onChange={e => setTxHash(e.target.value)} />
                  <p><button className="sec" disabled={!txHash} onClick={() => act("submit-tx", { txHash })}>Submit hash</button></p>
                  <p className="hint">Optional. Only tells the system about your transfer sooner. Payment is detected automatically either way.</p>
                </div>
              </details>)}
            {demo && attempt.demo && attempt.status === "PENDING_DEPOSIT" && <button onClick={() => act("simulate-deposit")}>DEMO: simulate my deposit</button>}
          </div>
        )}
        {err && <div className="err">{err}</div>}
      </div>
    </>
  );
}
