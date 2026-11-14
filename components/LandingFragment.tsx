"use client";
import { useEffect, useMemo, useState } from "react";

interface Tok { symbol: string; blockchain: string; price?: number; decimals: number }
const WANT: { symbol: string; chain: string; label: string }[] = [
  { symbol: "USDC", chain: "base", label: "USDC on Base" },
  { symbol: "ETH", chain: "eth", label: "ETH on Ethereum" },
  { symbol: "SOL", chain: "sol", label: "SOL on Solana" },
  { symbol: "BTC", chain: "btc", label: "BTC on Bitcoin" },
];
const fmt = (v: number) => (v >= 100 ? v.toFixed(2) : v >= 1 ? v.toFixed(3) : v >= 0.01 ? v.toFixed(4) : v.toFixed(6));

/** The hero's working fragment of the product: type an amount, see what a client could pay with, live prices from 1Click. */
export default function LandingFragment() {
  const [amount, setAmount] = useState("50");
  const [prices, setPrices] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch("/api/tokens").then(r => r.json()).then(d => {
      const toks: Tok[] = d.tokens ?? []; const out: Record<string, number> = {};
      for (const w of WANT) { const t = toks.find(x => x.symbol === w.symbol && x.blockchain === w.chain) ?? toks.find(x => x.symbol === w.symbol); if (t?.price) out[w.label] = t.price; }
      setPrices(out);
    }).catch(() => undefined);
  }, []);
  const usd = useMemo(() => Math.max(0, parseFloat(amount) || 0), [amount]);
  return (
    <div className="frag" data-ui>
      <div className="frag-head"><span>Invoice for NearZap</span><span className="frag-chip">Payment link</span></div>
      <label className="frag-label" htmlFor="frag-amount">Amount (USD)</label>
      <div className="frag-amount"><span>$</span><input id="frag-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} aria-label="Amount in US dollars" /></div>
      <div className="frag-sub">Your client can pay with</div>
      <ul className="frag-list">
        {WANT.map(w => (
          <li key={w.label}>
            <span>{w.label}</span>
            <b>{w.symbol === "USDC" ? `${fmt(usd)} USDC` : prices?.[w.label] ? `${fmt(usd / prices[w.label])} ${w.symbol}` : "…"}</b>
          </li>))}
      </ul>
      <noscript><p>Pay with ETH, SOL, BTC, USDC and 20+ more.</p></noscript>
      <div className="frag-get"><span>You receive</span><b>${usd.toFixed(2)} USDC</b></div>
      <div className="frag-note">Exactly that amount. No gas. Nothing to install.</div>
    </div>
  );
}
