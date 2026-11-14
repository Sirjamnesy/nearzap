import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ReceiveAsset } from "./types";

/** A public Pay me page: a handle that anyone can open to send you any amount. Edited with a secret key kept on the owner's device (no accounts). */
export interface Payee {
  handle: string; name: string; near: string;
  payout: "intents-balance" | "wallet";
  receive?: ReceiveAsset;
  keyHash: string; createdAt: string;
}
export type PublicPayee = Omit<Payee, "keyHash">;

export const HANDLE = /^[a-z0-9][a-z0-9_-]{2,23}$/;
const RESERVED = new Set(["api", "new", "invoices", "profile", "agents", "u", "i", "r", "admin", "pay", "me", "nearzap", "near", "login", "about"]);
export const handleOk = (h: string) => HANDLE.test(h) && !RESERVED.has(h);
export const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");
export const newKey = () => randomBytes(18).toString("base64url");
export const publicPayee = ({ keyHash: _k, ...p }: Payee): PublicPayee => p;

interface PBackend { get(h: string): Promise<Payee | null>; put(p: Payee): Promise<void> }

function filePayees(): PBackend {
  const FILE = process.env.PAYEE_FILE ?? path.join(process.cwd(), "data", "payees.json");
  let chain: Promise<unknown> = Promise.resolve();
  const read = async (): Promise<Payee[]> => { try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch (e: any) { if (e.code === "ENOENT") return []; throw e; } };
  const locked = <T,>(fn: () => Promise<T>) => { const n = chain.then(fn, fn); chain = n.catch(() => undefined); return n; };
  return {
    get: h => locked(async () => (await read()).find(p => p.handle === h) ?? null),
    put: p => locked(async () => {
      const all = (await read()).filter(x => x.handle !== p.handle); all.push(p);
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      const tmp = FILE + "." + randomUUID() + ".tmp"; await fs.writeFile(tmp, JSON.stringify(all, null, 2)); await fs.rename(tmp, FILE);
    }),
  };
}

function pgPayees(url: string): PBackend {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool({ connectionString: url, max: 2, ssl: /sslmode=disable|localhost/.test(url) ? undefined : { rejectUnauthorized: true } });
  let ready: Promise<unknown> | null = null;
  const init = () => (ready ??= pool.query(`CREATE TABLE IF NOT EXISTS nearzap_payees (handle text PRIMARY KEY, data jsonb NOT NULL)`));
  return {
    async get(h) { await init(); const r = await pool.query("SELECT data FROM nearzap_payees WHERE handle=$1", [h]); return (r.rows[0]?.data as Payee) ?? null; },
    async put(p) { await init(); await pool.query("INSERT INTO nearzap_payees (handle, data) VALUES ($1,$2) ON CONFLICT (handle) DO UPDATE SET data=EXCLUDED.data", [p.handle, p]); },
  };
}

let be: PBackend | null = null;
const b = () => (be ??= process.env.DATABASE_URL ? pgPayees(process.env.DATABASE_URL) : filePayees());
export const getPayee = (h: string) => b().get(h);
export const putPayee = (p: Payee) => b().put(p);
