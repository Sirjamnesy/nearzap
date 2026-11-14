"use client";
import { useEffect, useRef, useState } from "react";

interface Attempt { id: string; originSymbol: string; originChain: string; depositAddress: string; amountInFormatted: string; deadline: string; status: string; demo: boolean; txHashes: { kind: string; hash: string; url?: string }[] }
interface Token { assetId: string; symbol: string; blockchain: string }
const LABEL: Record<string, string> = { PENDING_DEPOSIT: "Waiting for your deposit", KNOWN_DEPOSIT_TX: "Deposit detected", PROCESSING: "Converting and delivering", SUCCESS: "Paid. USDC delivered", INCOMPLETE_DEPOSIT: "Deposit was too small; send the rest", REFUNDED: "Refunded to your address", FAILED: "Failed", EXPIRED: "Quote expired. Start again" };
const STEP: Record<string, number> = { PENDING_DEPOSIT: 1, INCOMPLETE_DEPOSIT: 1, KNOWN_DEPOSIT_TX: 2, PROCESSING: 3, SUCCESS: 4 };

export default function PayPanel({ invoiceId, initialState, initialAttempts }: { invoiceId: string; initialState: string; initialAttempts: Attempt[] }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [demo, setDemo] = useState(false);
  const [asset, setAsset] = useState("");
  const [refundTo, setRefundTo] = useState("");
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState<Attempt | null>(() => initialAttempts.filter(a => ["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "PROCESSING", "SUCCESS", "INCOMPLETE_DEPOSIT"].includes(a.status)).at(-1) ?? null);
  const [qr, setQr] = useState("");
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState("");
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => { fetch("/api/tokens").then(r => r.json()).then(d => { if (d.error) setErr(d.error); else { setTokens(d.tokens); setDemo(d.demo); setAsset(d.tokens[0]?.assetId ?? ""); } }); }, []);

  const final = attempt && ["SUCCESS", "REFUNDED", "FAILED", "EXPIRED"].includes(attempt.status);
  useEffect(() => {
    clearInterval(timer.current);
    if (!attempt || final) return;
    timer.current = setInterval(async () => {
      const d = await fetch(`/api/invoices/${invoiceId}/status`).then(r => r.json()).catch(() => null);
      if (!d?.attempts) return;
      setState(d.state); const a = d.attempts.find((x: Attempt) => x.id === attempt.id); if (a) setAttempt(a);
    }, 3000);
    return () => clearInterval(timer.current);
  }, [attempt?.id, final, invoiceId]);

  async function quote(dry: boolean) {
    setBusy(true); setErr(""); setPreview("");
    const res = await fetch(`/api/invoices/${invoiceId}/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originAssetId: asset, refundTo, dry }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { setErr(d.error ?? "Could not get a quote."); return; }
    if (dry) setPreview(`You would send about ${d.quote.amountInFormatted} ${d.quote.symbol} (${d.quote.chain}).`);
    else { setAttempt(d.attempt); setQr(d.qr); setState("pending"); }
  }
  async function act(action: string, extra: object = {}) {
    setErr("");
    const res = await fetch(`/api/invoices/${invoiceId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, attemptId: attempt?.id, ...extra }) });
    if (!res.ok) setErr((await res.json()).error ?? "Request failed.");
  }

  if (state === "paid" && attempt?.status === "SUCCESS")
    return (<div className="card"><h2 style={{ color: "var(--acc)" }}>Paid ✓</h2><p>{attempt.amountInFormatted} {attempt.originSymbol} was converted and delivered as USDC on NEAR.</p>
      {attempt.txHashes.map(t => <div key={t.hash} className="mut">{t.kind} tx: {t.url ? <a href={t.url} target="_blank" rel="noreferrer">{t.hash}</a> : t.hash}</div>)}</div>);

  const step = attempt ? STEP[attempt.status] ?? 0 : 0;
  return (
    <div className="card">
      <h2>Pay this invoice</h2>
      {!attempt || final ? (
        <div className="grid">
          <div><label>Pay with</label>
            <select value={asset} onChange={e => { setAsset(e.target.value); setPreview(""); }}>{tokens.map(t => <option key={t.assetId} value={t.assetId}>{t.symbol} on {t.blockchain}</option>)}</select></div>
          <div><label>Your refund address on that chain (used only if the payment fails)</label><input value={refundTo} onChange={e => setRefundTo(e.target.value)} placeholder="0x… / your wallet address" /></div>
          {attempt && final && <div className="err">{LABEL[attempt.status]}</div>}
          {preview && <div className="mut">{preview}</div>}
          <div><button className="sec" disabled={busy || !asset || refundTo.length < 8} onClick={() => quote(true)}>Preview price</button>{" "}
            <button disabled={busy || !asset || refundTo.length < 8} onClick={() => quote(false)}>{busy ? "Working…" : "Get deposit address"}</button></div>
        </div>
      ) : (
        <div className="grid">
          <div>Send exactly <b>{attempt.amountInFormatted} {attempt.originSymbol}</b> on <b>{attempt.originChain}</b> to:</div>
          <div className="addr" id="deposit-address">{attempt.depositAddress}</div>
          {qr && <img src={qr} alt="Deposit address QR code" width={160} height={160} />}
          <div className="mut">Quote valid until {new Date(attempt.deadline).toLocaleTimeString()}. Sending less than the amount, or after the deadline, triggers a refund.</div>
          <div className="steps" aria-label="progress">{[1, 2, 3, 4].map(n => <div key={n} className={`step ${step >= n ? "on" : ""}`} />)}</div>
          <div id="attempt-status"><b>{LABEL[attempt.status] ?? attempt.status}</b></div>
          {attempt.status === "PENDING_DEPOSIT" && <div><label>Optional: paste your transaction hash to speed up detection</label><input value={txHash} onChange={e => setTxHash(e.target.value)} />
            <p><button className="sec" disabled={!txHash} onClick={() => act("submit-tx", { txHash })}>Submit hash</button></p></div>}
          {demo && attempt.demo && attempt.status === "PENDING_DEPOSIT" && <button onClick={() => act("simulate-deposit")}>DEMO: simulate my deposit</button>}
        </div>
      )}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
