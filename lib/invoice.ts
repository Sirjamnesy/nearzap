import type { Invoice, InvoiceState, LineItem } from "./types";

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

export function invoiceState(inv: Invoice, now = new Date()): InvoiceState {
  if (inv.attempts.some(a => a.status === "SUCCESS")) return "paid";
  if (inv.attempts.some(a => ["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "PROCESSING", "INCOMPLETE_DEPOSIT"].includes(a.status)
      && new Date(a.deadline) > now || ["KNOWN_DEPOSIT_TX", "PROCESSING"].includes(a.status))) return "pending";
  if (inv.attempts.length && inv.attempts[inv.attempts.length - 1].status === "REFUNDED") return "refunded";
  const due = new Date(inv.dueDate + "T23:59:59Z");
  return due < now ? "overdue" : "open";
}

const NEAR_ACCOUNT = /^((?:[a-z\d]+[-_])*[a-z\d]+\.)*(?:[a-z\d]+[-_])*[a-z\d]+$/;
export function validNearAccount(a: string): boolean {
  return a.length >= 2 && a.length <= 64 && NEAR_ACCOUNT.test(a);
}

export interface InvoiceInput {
  freelancerName: string; freelancerNear: string; clientName: string; clientEmail?: string;
  items: LineItem[]; dueDate: string; memo?: string; payout?: "intents-balance" | "near-wallet";
}

export function validateInput(i: Partial<InvoiceInput>): string[] {
  const e: string[] = [];
  if (!i.freelancerName || i.freelancerName.trim().length < 2) e.push("Your name is required.");
  if (!i.freelancerNear || !validNearAccount(i.freelancerNear)) e.push("Enter a valid NEAR account, e.g. alice.near or a 64-char implicit account.");
  if (!i.clientName || i.clientName.trim().length < 2) e.push("Client name is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.dueDate ?? "")) e.push("Due date must be YYYY-MM-DD.");
  if (!i.items?.length) e.push("Add at least one line item.");
  for (const it of i.items ?? []) {
    if (!it.description?.trim()) e.push("Every line item needs a description.");
    if (!(it.qty > 0)) e.push("Quantity must be greater than 0.");
    if (!Number.isInteger(it.unitCents) || it.unitCents <= 0) e.push("Unit price must be a positive amount.");
  }
  if (i.items && totalCents(i.items) <= 0) e.push("Invoice total must be greater than 0.");
  if (i.items && totalCents(i.items) > 10_000_000_00) e.push("Invoice total too large for this prototype.");
  return e;
}
