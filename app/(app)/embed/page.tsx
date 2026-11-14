"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { loadProfile } from "@/lib/profile";

export default function Embed() {
  const [handle, setHandle] = useState(""); const [amount, setAmount] = useState(""); const [label, setLabel] = useState("Pay with any crypto");
  const [theme, setTheme] = useState<"dark" | "light">("dark"); const [origin, setOrigin] = useState(""); const [copied, setCopied] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); const h = loadProfile().handle; if (h) setHandle(h); }, []);

  const clean = handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const attrs = [`class="nearzap-button"`, `data-handle="${clean || "your-handle"}"`, amount ? `data-amount="${amount.replace(/[^0-9.]/g, "")}"` : "", label.trim() ? `data-label="${label.trim().replace(/"/g, "")}"` : "", theme === "light" ? `data-theme="light"` : ""].filter(Boolean).join(" ");
  const snippet = `<div ${attrs}></div>\n<script async src="${origin}/embed.js"></script>`;
  const doc = `<body style="margin:0;display:grid;place-items:center;height:100vh;background:${theme === "light" ? "#0f0f0f" : "#fff"}">${snippet}</body>`;

  async function copy() { try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this snippet", snippet); } }

  return (
    <>
      <div className="iconh"><span className="ic"><Icon name="code" /></span><h1 style={{ margin: 0 }}>Checkout button for your site</h1></div>
      <p className="mut">Paste two lines on any website. Visitors click, pay from whatever wallet and chain they hold, and you receive exactly what they send.</p>
      <div className="card">
        <label>Your Pay me handle</label>
        <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="ada" autoCapitalize="none" />
        <p className="hint">No Pay me page yet? <a href="/profile">Make one in a minute</a>.</p>
        <label>Amount (USD, optional)</label>
        <input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Leave empty to let the payer choose" />
        <label>Button text</label>
        <input value={label} onChange={e => setLabel(e.target.value)} maxLength={40} />
        <label>Style</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["dark", "light"] as const).map(t => <button key={t} type="button" className={theme === t ? "" : "sec"} onClick={() => setTheme(t)} style={{ flex: 1 }}>{t === "dark" ? "Dark" : "Light"}</button>)}
        </div>
      </div>
      <div className="card">
        <h2>Preview</h2>
        <iframe title="Button preview" sandbox="allow-scripts allow-popups" srcDoc={doc} style={{ width: "100%", height: 90, border: "1px solid var(--line)", borderRadius: 14 }} />
      </div>
      <div className="card">
        <h2>Your snippet</h2>
        <pre className="addr" style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}><code>{snippet}</code></pre>
        <p><button onClick={copy} disabled={!clean}><Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy snippet"}</button></p>
        <p className="hint">Works in plain HTML and should work anywhere that accepts a custom HTML snippet, such as Webflow, Framer, WordPress or a Shopify theme. It is a link to your Pay me page, so there is nothing to host and no keys to share.</p>
      </div>
    </>
  );
}
