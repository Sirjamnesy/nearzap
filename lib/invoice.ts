import type { Invoice, InvoiceState, LineItem, Part, PaymentAttempt, ReceiveAsset, Split } from "./types";

export const USDC_DECIMALS = 6;

export function totalCents(items: LineItem[]): number {
  return items.reduce((s, i) => s + Math.round(i.qty * i.unitCents), 0);
}

/** cents -> USDC smallest unit (6 decimals) as a string, exact integer math. */
export function centsToUsdcUnits(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error("cents must be a non-negative integer");
  return (BigInt(cents) * 10_000n).toString();
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatUnits(units: string, decimals: number, maxFrac = 6): string {
  const neg = units.startsWith("-");
  const u = BigInt(neg ? units.slice(1) : units);
  const base = 10n ** BigInt(decimals);
  const whole = u / base;
  let frac = (u % base).toString().padStart(decimals, "0").slice(0, maxFrac).replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole.toString()}${frac ? "." + frac : ""}`;
}

const ACTIVE: PaymentAttempt["status"][] = ["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "PROCESSING", "INCOMPLETE_DEPOSIT"];

/** The payable parts of an invoice. A plain invoice is one part for the full amount. */
export function partsOf(inv: Pick<Invoice, "parts" | "totalCents">): Part[] {
  return inv.parts?.length ? inv.parts : [{ label: "Full payment", cents: inv.totalCents }];
}
export const partIndexOf = (a: PaymentAttempt) => a.partIndex ?? 0;

export function partState(inv: Invoice, i: number, now = new Date()): "paid" | "pending" | "open" {
  const mine = inv.attempts.filter(a => partIndexOf(a) === i);
  if (mine.some(a => a.status === "SUCCESS")) return "paid";
  if (mine.some(a => (ACTIVE.includes(a.status) && new Date(a.deadline) > now) || ["KNOWN_DEPOSIT_TX", "PROCESSING"].includes(a.status))) return "pending";
  return "open";
}

export function invoiceState(inv: Invoice, now = new Date()): InvoiceState {
  const n = partsOf(inv).length;
  const states = Array.from({ length: n }, (_, i) => partState(inv, i, now));
  const paid = states.filter(s => s === "paid").length;
  if (paid === n) return "paid";
  if (paid > 0) return "partial";
  if (states.includes("pending")) return "pending";
  if (inv.attempts.length && inv.attempts[inv.attempts.length - 1].status === "REFUNDED") return "refunded";
  if (inv.dueDate && new Date(inv.dueDate + "T23:59:59Z") < now) return "overdue";
  return "open";
}

/** When the invoice was fully paid: the latest successful attempt. */
export function paidAt(inv: Invoice): string | null {
  const ok = inv.attempts.filter(a => a.status === "SUCCESS");
  return ok.length ? ok.map(a => a.updatedAt).sort().at(-1)! : null;
}

const NEAR_ACCOUNT = /^((?:[a-z\d]+[-_])*[a-z\d]+\.)*(?:[a-z\d]+[-_])*[a-z\d]+$/;
export function validNearAccount(a: string): boolean {
  return a.length >= 2 && a.length <= 64 && NEAR_ACCOUNT.test(a);
}

/** 1Click caps app fees at 5% (500 bps) per quote. The share is paid as an app fee, grossed up so the payer still pays about the invoice amount, so 4% keeps it under the cap. */
export const MAX_SPLIT_TOTAL = 4;
const EVM = ["eth", "base", "arb", "op", "bsc", "pol", "avax", "gnosis", "bera", "monad", "aurora", "adi", "xlayer", "plasma"];
/** Format check for an address on a chain. Strict where the format is well known, lenient otherwise. */
export function validAddress(chain: string, a: string): boolean {
  if (chain === "near") return validNearAccount(a);
  if (EVM.includes(chain)) return /^0x[0-9a-fA-F]{40}$/.test(a);
  if (chain === "sol") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  if (chain === "btc") return /^(bc1[a-z0-9]{20,70}|[13][a-km-zA-HJ-NP-Z1-9]{25,40})$/.test(a);
  return a.length >= 8 && a.length <= 128 && !/\s/.test(a);
}

export interface InvoiceInput {
  freelancerName: string; freelancerNear: string; clientName?: string; clientEmail?: string;
  items: LineItem[]; dueDate?: string; memo?: string;
  payout?: "intents-balance" | "wallet" | "near-wallet";
  receive?: ReceiveAsset; splits?: Split[]; parts?: Part[];
}

export function validateInput(i: Partial<InvoiceInput>): string[] {
  const e: string[] = [];
  const wallet = i.payout === "wallet" || i.payout === "near-wallet";
  const chain = wallet ? (i.receive?.blockchain ?? "near") : "near";
  if (!i.freelancerName || i.freelancerName.trim().length < 2) e.push("Your name is required.");
  if (!i.freelancerNear || !validAddress(chain, i.freelancerNear.trim()))
    e.push(chain === "near" ? "Enter a valid NEAR account, e.g. alice.near or a 64-char implicit account." : `Enter a valid ${chain} address to receive on.`);
  if (i.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(i.dueDate)) e.push("Due date must be YYYY-MM-DD.");
  if (!i.items?.length) e.push("Add at least one line item.");
  for (const it of i.items ?? []) {
    if (!it.description?.trim()) e.push("Every line item needs a description.");
    if (!(it.qty > 0)) e.push("Quantity must be greater than 0.");
    if (!Number.isInteger(it.unitCents) || it.unitCents <= 0) e.push("Unit price must be a positive amount.");
  }
  const total = i.items ? totalCents(i.items) : 0;
  if (i.items && total <= 0) e.push("Invoice total must be greater than 0.");
  if (i.items && total > 10_000_000_00) e.push("Invoice total too large for this prototype.");
  if (i.receive && !(i.receive.assetId && i.receive.symbol && i.receive.blockchain && i.receive.decimals >= 0)) e.push("Unknown receive asset.");
  if (i.parts?.length) {
    if (i.parts.length < 2 || i.parts.length > 6) e.push("Use between 2 and 6 payments.");
    if (i.parts.some(p => !p.label?.trim() || !Number.isInteger(p.cents) || p.cents <= 0)) e.push("Each payment needs a label and a positive amount.");
    if (i.parts.reduce((s, p) => s + p.cents, 0) !== total) e.push("Payments must add up to the invoice total.");
  }
  if (i.splits?.length) {
    if (i.splits.length > 2) e.push("At most 2 recipients.");
    for (const sp of i.splits) {
      if (!validNearAccount(sp.account ?? "")) e.push("Split recipients must be NEAR accounts.");
      if (!(sp.percent >= 1 && sp.percent <= MAX_SPLIT_TOTAL)) e.push(`Each share must be between 1% and ${MAX_SPLIT_TOTAL}%.`);
      if (sp.account === i.freelancerNear) e.push("A split recipient must be a different account from yours.");
    }
    if (i.splits.reduce((s, x) => s + x.percent, 0) > MAX_SPLIT_TOTAL) e.push(`Shares cannot total more than ${MAX_SPLIT_TOTAL}%.`);
  }
  return e;
}
