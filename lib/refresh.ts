import { TERMINAL } from "./types";
import { fetchStatus } from "./oneclick";
import { getInvoice, updateInvoice } from "./store";
import type { Invoice } from "./types";

/** Poll 1Click for every non-final attempt of an invoice and persist the result. Never throws: a failed poll keeps the last known status. */
export async function refreshInvoice(id: string): Promise<Invoice | null> {
  const inv = await getInvoice(id);
  if (!inv) return null;
  const open = inv.attempts.filter(a => !TERMINAL.includes(a.status) && a.depositAddress);
  if (!open.length) return inv;
  const results = await Promise.all(open.map(async a => {
    try { return [a.id, await fetchStatus(a)] as const; } catch { return null; }
  }));
  const byId = new Map(results.filter(Boolean).map(r => r!));
  if (!byId.size) return inv;
  return updateInvoice(id, i => {
    for (const a of i.attempts) {
      const r = byId.get(a.id);
      if (r && (r.status !== a.status || r.txHashes.length !== a.txHashes.length)) {
        a.status = r.status; a.txHashes = r.txHashes.length ? r.txHashes : a.txHashes; a.updatedAt = new Date().toISOString();
      }
    }
  });
}
