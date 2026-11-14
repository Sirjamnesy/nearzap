// Optional profile, stored only in this browser (localStorage). No account, no server copy.
export interface Profile {
  name: string; near: string; recent: string[];
  receiveAssetId?: string;                 // default asset to receive (USDC on NEAR when unset)
  payout?: "intents-balance" | "wallet";   // default delivery
  handle?: string; editKey?: string;       // your Pay me page and its secret edit key
  mine?: string[];                         // ids of invoices created on this device
}
const KEY = "nearzap.profile";
export const emptyProfile = (): Profile => ({ name: "", near: "", recent: [], mine: [] });

export function loadProfile(): Profile {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (p && typeof p === "object") return {
      name: String(p.name ?? ""), near: String(p.near ?? ""), recent: Array.isArray(p.recent) ? p.recent.map(String).slice(0, 8) : [],
      receiveAssetId: p.receiveAssetId ? String(p.receiveAssetId) : undefined, payout: p.payout === "wallet" ? "wallet" : p.payout === "intents-balance" ? "intents-balance" : undefined,
      handle: p.handle ? String(p.handle) : undefined, editKey: p.editKey ? String(p.editKey) : undefined,
      mine: Array.isArray(p.mine) ? p.mine.map(String).slice(0, 300) : [],
    };
  } catch { /* storage unavailable or corrupt: behave as empty */ }
  return emptyProfile();
}
export function saveProfile(p: Profile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); window.dispatchEvent(new Event("nearzap-profile")); } catch { /* ignore */ }
}
export function clearProfile() { try { localStorage.removeItem(KEY); window.dispatchEvent(new Event("nearzap-profile")); } catch { /* ignore */ } }

/** Remember a used address (most recent first, no duplicates, max 8) and make it the default. */
export function rememberUse(p: Profile, name: string, near: string): Profile {
  return { ...p, name, near, recent: [near, ...p.recent.filter(a => a !== near)].slice(0, 8) };
}
/** Remember that this device created an invoice, so the dashboard can list it. */
export function rememberInvoice(p: Profile, id: string): Profile {
  return { ...p, mine: [id, ...(p.mine ?? []).filter(x => x !== id)].slice(0, 300) };
}
