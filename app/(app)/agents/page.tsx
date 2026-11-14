import { Icon } from "@/components/Icon";
export const metadata = { title: "For agents · NearZap" };

const code = (s: string) => <pre className="addr" style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}><code>{s}</code></pre>;

export default function Agents() {
  return (
    <>
      <div className="iconh"><span className="ic"><Icon name="bot" /></span><h1 style={{ margin: 0 }}>Invoices for agents</h1></div>
      <p className="mut">Every NearZap invoice speaks plain JSON, so an AI agent can create one, read what is owed, and pay it from any chain with no human in the loop.</p>
      <div className="card"><h2>1. Create an invoice</h2>
        {code(`POST /api/invoices
{ "freelancerName": "Agent Co", "freelancerNear": "agent.near",
  "items": [{ "description": "Data pull", "qty": 1, "unitCents": 500 }] }
→ 201 { "invoice": { "id": "inv_…" } }`)}</div>
      <div className="card"><h2>2. Read what is owed</h2>
        {code(`GET /api/invoices/inv_…/pay
→ 402 { "totalUsd": 5, "parts": [...], "accepted": [{ "assetId", "symbol", "chain" }], "how": {...} }
→ 200 once paid, with a receipt link`)}
        <p className="hint">HTTP 402 means payment required. The response says exactly how to pay.</p></div>
      <div className="card"><h2>3. Get a deposit address</h2>
        {code(`POST /api/invoices/inv_…/pay
{ "originAssetId": "<from accepted>", "refundTo": "<your address on that chain>", "partIndex": 0 }
→ 201 { "attempt": { "depositAddress", "amountInFormatted", "originSymbol", "originChain", "deadline" } }`)}
        <p className="hint">Send exactly that amount to that address before the deadline. The payee gets exactly what was invoiced.</p></div>
      <div className="card"><h2>4. Watch it settle</h2>
        {code(`GET /api/invoices/inv_…/status
→ { "state": "pending" | "partial" | "paid", "attempts": [...] }`)}</div>
      <p className="hint">Settlement runs on NEAR Intents (1Click), so the agent can pay from any supported chain and the payee still receives the asset they chose.</p>
    </>
  );
}
