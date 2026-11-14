import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Invoice } from "./types";

/**
 * Storage has two backends behind one tiny interface:
 *  - Postgres when DATABASE_URL is set (used for the hosted demo, works on serverless)
 *  - a local JSON file otherwise (zero setup for `npm run dev`)
 */
export const newId = () => "inv_" + randomUUID().replace(/-/g, "").slice(0, 10);

interface Backend {
  list(): Promise<Invoice[]>;
  get(id: string): Promise<Invoice | null>;
  create(inv: Invoice): Promise<Invoice>;
  update(id: string, fn: (i: Invoice) => void): Promise<Invoice | null>;
}

// ---------- file backend ----------
function fileBackend(): Backend {
  const FILE = process.env.DB_FILE ?? path.join(process.cwd(), "data", "db.json");
  let chain: Promise<unknown> = Promise.resolve();
  const readAll = async (): Promise<Invoice[]> => {
    try { return JSON.parse(await fs.readFile(FILE, "utf8")) as Invoice[]; }
    catch (e: any) { if (e.code === "ENOENT") return []; throw e; }
  };
  const writeAll = async (v: Invoice[]) => {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = FILE + "." + randomUUID() + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(v, null, 2));
    await fs.rename(tmp, FILE);
  };
  // Serialise read-modify-write so concurrent requests cannot lose updates.
  const locked = <T,>(fn: () => Promise<T>): Promise<T> => { const next = chain.then(fn, fn); chain = next.catch(() => undefined); return next; };
  return {
    list: () => locked(readAll),
    get: id => locked(async () => (await readAll()).find(i => i.id === id) ?? null),
    create: inv => locked(async () => { const all = await readAll(); all.unshift(inv); await writeAll(all); return inv; }),
    update: (id, fn) => locked(async () => {
      const all = await readAll(); const inv = all.find(i => i.id === id);
      if (!inv) return null; fn(inv); await writeAll(all); return inv;
    }),
  };
}

// ---------- postgres backend ----------
function pgBackend(url: string): Backend {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool({ connectionString: url, max: 3, ssl: /sslmode=disable|localhost/.test(url) ? undefined : { rejectUnauthorized: true } });
  let ready: Promise<unknown> | null = null;
  const init = () => (ready ??= pool.query(`CREATE TABLE IF NOT EXISTS nearpay_invoices (
      id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL)`));
  return {
    async list() { await init(); const r = await pool.query("SELECT data FROM nearpay_invoices ORDER BY created_at DESC LIMIT 500"); return r.rows.map(x => x.data as Invoice); },
    async get(id) { await init(); const r = await pool.query("SELECT data FROM nearpay_invoices WHERE id=$1", [id]); return (r.rows[0]?.data as Invoice) ?? null; },
    async create(inv) { await init(); await pool.query("INSERT INTO nearpay_invoices (id, data) VALUES ($1, $2)", [inv.id, inv]); return inv; },
    async update(id, fn) {
      await init(); const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const r = await c.query("SELECT data FROM nearpay_invoices WHERE id=$1 FOR UPDATE", [id]);
        if (!r.rows[0]) { await c.query("ROLLBACK"); return null; }
        const inv = r.rows[0].data as Invoice; fn(inv);
        await c.query("UPDATE nearpay_invoices SET data=$2 WHERE id=$1", [id, inv]);
        await c.query("COMMIT"); return inv;
      } catch (e) { await c.query("ROLLBACK").catch(() => undefined); throw e; }
      finally { c.release(); }
    },
  };
}

let backend: Backend | null = null;
const b = () => (backend ??= process.env.DATABASE_URL ? pgBackend(process.env.DATABASE_URL) : fileBackend());

export const listInvoices = () => b().list();
export const getInvoice = (id: string) => b().get(id);
export const createInvoice = (inv: Invoice) => b().create(inv);
export const updateInvoice = (id: string, fn: (i: Invoice) => void) => b().update(id, fn);
