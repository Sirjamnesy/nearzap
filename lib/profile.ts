// Optional profile, stored only in this browser (localStorage). No account, no server copy.
export interface Profile { name: string; near: string; recent: string[] }
const KEY = "nearzap.profile";
export const emptyProfile = (): Profile => ({ name: "", near: "", recent: [] });

export function loadProfile(): Profile {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (p && typeof p === "object") return { name: String(p.name ?? ""), near: String(p.near ?? ""), recent: Array.isArray(p.recent) ? p.recent.map(String).slice(0, 8) : [] };
  } catch { /* storage unavailable or corrupt: behave as empty */ }
  return emptyProfile();
}
export function saveProfile(p: Profile) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ } }
export function clearProfile() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

/** Remember a used address (most recent first, no duplicates, max 8) and make it the default. */
export function rememberUse(p: Profile, name: string, near: string): Profile {
  return { name, near, recent: [near, ...p.recent.filter(a => a !== near)].slice(0, 8) };
}
