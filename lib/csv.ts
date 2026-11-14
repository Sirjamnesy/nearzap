import type { Invoice } from "./types";
import { invoiceState } from "./invoice";

const esc = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_HEADER = [
  "invoice_id", "issued_date", "due_date", "client", "description", "status",
  "amount_usdc", "paid_date", "paid_with", "paid_amount_in", "deposit_address", "tx_hashes",
];

/** One row per line item so an accountant can pivot it; paid info repeats on each row. */
export function invoicesToCsv(invoices: Invoice[], now = new Date()): string {
  const rows: string[] = [CSV_HEADER.join(",")];
  for (const inv of invoices) {
    const paid = inv.attempts.find(a => a.status === "SUCCESS");
    const state = invoiceState(inv, now);
    for (const it of inv.items) {
      const amount = (Math.round(it.qty * it.unitCents) / 100).toFixed(2);
      rows.push([
        inv.id, inv.createdAt.slice(0, 10), inv.dueDate, inv.clientName,
        `${it.qty} x ${it.description}`, state, amount,
        paid ? paid.updatedAt.slice(0, 10) : "",
        paid ? `${paid.originSymbol} on ${paid.originChain}` : "",
        paid ? paid.amountInFormatted : "",
        paid ? paid.depositAddress : "",
        paid ? paid.txHashes.map(t => t.hash).join(" ") : "",
      ].map(esc).join(","));
    }
  }
  return rows.join("\n") + "\n";
}
