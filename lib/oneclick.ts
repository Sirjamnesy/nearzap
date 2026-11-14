import { createHash, randomUUID } from "node:crypto";
import type { AttemptStatus, Invoice, PaymentAttempt, ReceiveAsset, TokenInfo } from "./types";
import { formatUnits, partsOf } from "./invoice";

const BASE = "https://1click.chaindefuser.com";
export const isDemo = () => process.env.DEMO_MODE === "1";

export class OneClickError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ONECLICK_JWT) headers.Authorization = `Bearer ${process.env.ONECLICK_JWT}`;
  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers: { ...headers, ...(init?.headers as any) }, signal: AbortSignal.timeout(20_000) });
  } catch (e: any) {
    throw new OneClickError(`Could not reach the 1Click API (${e?.message ?? "network error"}). Set DEMO_MODE=1 to run without it.`);
  }
  const text = await res.text();
  let body: any; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) throw new OneClickError(`1Click API ${res.status}: ${body?.message ?? text.slice(0, 200)}`, res.status === 400 ? 400 : 502);
  return body as T;
}

// ---------- tokens ----------
const DEMO_TOKENS: TokenInfo[] = [
  { assetId: "demo:usdc.near", decimals: 6, blockchain: "near", symbol: "USDC", price: 1 },
  { assetId: "demo:usdc.eth", decimals: 6, blockchain: "eth", symbol: "USDC", price: 1 },
  { assetId: "demo:usdt.eth", decimals: 6, blockchain: "eth", symbol: "USDT", price: 1 },
  { assetId: "demo:usdc.base", decimals: 6, blockchain: "base", symbol: "USDC", price: 1 },
  { assetId: "demo:eth", decimals: 18, blockchain: "eth", symbol: "ETH", price: 3000 },
  { assetId: "demo:sol", decimals: 9, blockchain: "sol", symbol: "SOL", price: 150 },
  { assetId: "demo:btc", decimals: 8, blockchain: "btc", symbol: "BTC", price: 90000 },
];

let tokenCache: { at: number; tokens: TokenInfo[] } | null = null;
export async function getTokens(): Promise<TokenInfo[]> {
  if (isDemo()) return DEMO_TOKENS;
  if (tokenCache && Date.now() - tokenCache.at < 5 * 60_000) return tokenCache.tokens;
  const raw = await call<any[]>("/v0/tokens");
  const tokens = raw
    .filter(t => t?.assetId && typeof t.decimals === "number" && t.symbol && t.blockchain)
    .map(t => ({ assetId: t.assetId, decimals: t.decimals, blockchain: t.blockchain, symbol: t.symbol, price: t.price }));
  tokenCache = { at: Date.now(), tokens };
  return tokens;
}

/** The asset the freelancer is paid in: USDC on NEAR. Looked up from the live token list, never hard-coded. */
export function findPayoutAsset(tokens: TokenInfo[]): TokenInfo {
  const forced = process.env.NEAR_USDC_ASSET;
  const t = (forced && tokens.find(x => x.assetId === forced)) ||
    tokens.find(x => x.symbol.toUpperCase() === "USDC" && x.blockchain === "near");
  if (!t) throw new OneClickError("USDC on NEAR was not found in the 1Click token list.");
  return t;
}

/** Major assets a payer is likely to hold. The live list has hundreds of long-tail and deprecated tokens; a checkout should not show them. */
const COMMON = ["USDC", "USDT", "USDT0", "DAI", "ETH", "WETH", "BTC", "WBTC", "cbBTC", "SOL", "NEAR", "wNEAR", "BNB", "AVAX", "POL", "ARB", "OP", "XRP", "DOGE", "LTC", "SUI", "TRX", "ADA", "APT", "TON"];

/** Tokens a payer may choose: common assets with a price, never deprecated, stablecoins first. The payout asset itself stays selectable (an on-NEAR payer pays in USDC directly). */
export function payableTokens(tokens: TokenInfo[]): TokenInfo[] {
  const order = (t: TokenInfo) => COMMON.indexOf(t.symbol);
  return tokens
    .filter(t => (t.price ?? 0) > 0 && !/deprecated/i.test(t.symbol) && COMMON.includes(t.symbol))
    .sort((a, b) => order(a) - order(b) || a.blockchain.localeCompare(b.blockchain));
}

// ---------- quote ----------
const STABLE = ["USDC", "USDT", "USDT0", "DAI", "PYUSD", "USDE", "FDUSD"];

/** What the payee receives: the invoice's chosen asset, or USDC on NEAR. */
export function receiveAssetFor(inv: Invoice, tokens: TokenInfo[]): ReceiveAsset {
  if (inv.receive) return tokens.find(t => t.assetId === inv.receive!.assetId) ?? inv.receive;
  return findPayoutAsset(tokens);
}

/** USD cents -> smallest unit of the receive asset. Stablecoins are 1:1; other assets use the live price at quote time. */
export function centsToAssetUnits(cents: number, a: ReceiveAsset): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error("cents must be a non-negative integer");
  if (STABLE.includes(a.symbol.toUpperCase()) || !a.price) {
    if (!STABLE.includes(a.symbol.toUpperCase())) throw new OneClickError(`No live price for ${a.symbol}; choose a stablecoin to receive.`, 400);
    return ((BigInt(cents) * 10n ** BigInt(a.decimals)) / 100n).toString();
  }
  const micro = BigInt(Math.max(1, Math.round((cents / 100 / a.price) * 1e8)));   // 1e-8 units of the asset
  return ((micro * 10n ** BigInt(a.decimals)) / 10n ** 8n).toString();
}

/** App fees for 1Click, which are charged on top of the payer's input. Splits give another account a share of each payment:
 *  with a total split share S, the payee gets (1-S) of the amount as output and a recipient with share s gets fee = s/(1-S),
 *  so the payer pays about the invoice amount in total and the shares come out right. */
export function appFeesFor(inv: Invoice): { fees: { recipient: string; fee: number }[]; payeeShare: number } {
  const splits = inv.splits ?? [];
  const S = splits.reduce((n, x) => n + x.percent, 0) / 100;
  const fees = splits.map(x => ({ recipient: x.account, fee: Math.round((x.percent / 100 / (1 - S)) * 10_000) }));
  const platform = Number(process.env.APP_FEE_BPS ?? 0), who = process.env.APP_FEE_RECIPIENT;
  if (platform > 0 && who) fees.push({ recipient: who, fee: platform });
  return { fees, payeeShare: 1 - S };
}

export interface QuoteParams { invoice: Invoice; origin: TokenInfo; refundTo: string; dry: boolean; minutes?: number; partIndex?: number }

export function buildQuoteRequest(p: QuoteParams, dest: ReceiveAsset) {
  const toIntents = p.invoice.payout === "intents-balance";
  const part = partsOf(p.invoice)[p.partIndex ?? 0];
  const { fees, payeeShare } = appFeesFor(p.invoice);
  const payeeCents = Math.round(part.cents * payeeShare);
  return {
    dry: p.dry,
    swapType: "EXACT_OUTPUT",                       // the payee gets exactly the invoiced amount
    slippageTolerance: 100,                          // 1%
    originAsset: p.origin.assetId,
    depositType: "ORIGIN_CHAIN",
    destinationAsset: dest.assetId,
    amount: centsToAssetUnits(payeeCents, dest),
    recipient: p.invoice.freelancerNear,
    recipientType: toIntents ? "INTENTS" : "DESTINATION_CHAIN",
    refundTo: p.refundTo,
    refundType: "ORIGIN_CHAIN",
    deadline: new Date(Date.now() + (p.minutes ?? 30) * 60_000).toISOString(),
    ...(fees.length ? { appFees: fees } : {}),
  };
}

export async function requestQuote(p: QuoteParams): Promise<PaymentAttempt & { dry: boolean }> {
  const tokens = await getTokens();
  const dest = receiveAssetFor(p.invoice, tokens);
  const now = new Date().toISOString();
  const partIndex = p.partIndex ?? 0;
  if (isDemo()) {
    const usd = partsOf(p.invoice)[partIndex].cents / 100;
    const units = BigInt(Math.ceil((usd / (p.origin.price ?? 1)) * 1.003 * 10 ** Math.min(p.origin.decimals, 9))) *
      10n ** BigInt(Math.max(p.origin.decimals - 9, 0));
    const unitsStr = units.toString();
    return {
      id: randomUUID(), createdAt: now, originAsset: p.origin.assetId, originSymbol: p.origin.symbol, originChain: p.origin.blockchain,
      depositAddress: "demo-" + randomUUID().replace(/-/g, "").slice(0, 24), amountIn: unitsStr,
      amountInFormatted: formatUnits(unitsStr, p.origin.decimals, 8), deadline: new Date(Date.now() + 30 * 60_000).toISOString(),
      refundTo: p.refundTo, status: "PENDING_DEPOSIT", txHashes: [], updatedAt: now, demo: true, dry: p.dry, partIndex,
    };
  }
  const res = await call<any>("/v0/quote", { method: "POST", body: JSON.stringify(buildQuoteRequest(p, dest)) });
  const q = res?.quote ?? res;
  if (!q?.amountIn || (!p.dry && !q?.depositAddress)) throw new OneClickError("1Click returned an unexpected quote response.");
  return {
    id: randomUUID(), createdAt: now, originAsset: p.origin.assetId, originSymbol: p.origin.symbol, originChain: p.origin.blockchain,
    depositAddress: q.depositAddress ?? "", amountIn: String(q.amountIn),
    amountInFormatted: q.amountInFormatted ?? formatUnits(String(q.amountIn), p.origin.decimals, 8),
    deadline: q.deadline ?? res?.quoteRequest?.deadline ?? new Date(Date.now() + 30 * 60_000).toISOString(),
    refundTo: p.refundTo, status: "PENDING_DEPOSIT", txHashes: [], updatedAt: now, demo: false, dry: p.dry, partIndex,
  };
}

// ---------- status ----------
export function normaliseStatus(s: unknown): AttemptStatus {
  const v = String(s ?? "").toUpperCase();
  const known: AttemptStatus[] = ["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "PROCESSING", "SUCCESS", "INCOMPLETE_DEPOSIT", "REFUNDED", "FAILED"];
  return (known as string[]).includes(v) ? (v as AttemptStatus) : "PENDING_DEPOSIT";
}

export function extractTxHashes(res: any): PaymentAttempt["txHashes"] {
  const out: PaymentAttempt["txHashes"] = [];
  const d = res?.swapDetails ?? {};
  for (const [key, kind] of [["originChainTxHashes", "origin"], ["destinationChainTxHashes", "destination"]] as const)
    for (const t of Array.isArray(d[key]) ? d[key] : [])
      if (t?.hash) out.push({ kind, hash: String(t.hash), url: typeof t.explorerUrl === "string" ? t.explorerUrl : undefined });
  return out;
}

export async function fetchStatus(a: PaymentAttempt): Promise<Pick<PaymentAttempt, "status" | "txHashes">> {
  if (a.demo) {
    if (!a.demoDepositAt) return { status: new Date(a.deadline) < new Date() ? "EXPIRED" : "PENDING_DEPOSIT", txHashes: [] };
    const t = (Date.now() - new Date(a.demoDepositAt).getTime()) / 1000;
    const status: AttemptStatus = t < 2 ? "KNOWN_DEPOSIT_TX" : t < 5 ? "PROCESSING" : "SUCCESS";
    const tx = (k: string) => "0xdemo" + createHash("sha256").update(a.depositAddress + k).digest("hex").slice(0, 40);
    return { status, txHashes: status === "SUCCESS" ? [{ kind: "origin", hash: tx("o") }, { kind: "destination", hash: tx("d") }] : [{ kind: "origin", hash: tx("o") }] };
  }
  const res = await call<any>(`/v0/status?depositAddress=${encodeURIComponent(a.depositAddress)}`);
  let status = normaliseStatus(res?.status);
  if (status === "PENDING_DEPOSIT" && new Date(a.deadline) < new Date()) status = "EXPIRED";
  return { status, txHashes: extractTxHashes(res) };
}

export async function submitDepositTx(depositAddress: string, txHash: string) {
  if (isDemo()) return;
  await call("/v0/deposit/submit", { method: "POST", body: JSON.stringify({ depositAddress, txHash }) });
}
