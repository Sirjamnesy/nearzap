import { NextResponse, type NextRequest } from "next/server";

/**
 * Best-effort rate limiting for the API. Counters live in each server instance's memory, so on serverless they are
 * per instance and reset on cold starts. It stops a single client hammering the site; it is not a global limit.
 * Pair it with a Vercel Firewall rate-limit rule for a real shared limit.
 */
type Rule = { match: (m: string, p: string) => boolean; limit: number; windowMs: number; name: string };
const rules: Rule[] = [
  { name: "create-invoice", match: (m, p) => m === "POST" && p === "/api/invoices", limit: 20, windowMs: 3_600_000 },
  { name: "payee-invoice", match: (m, p) => m === "POST" && /^\/api\/payees\/[^/]+\/invoice$/.test(p), limit: 20, windowMs: 3_600_000 },
  { name: "payee-write", match: (m, p) => m === "POST" && p === "/api/payees", limit: 10, windowMs: 3_600_000 },
  { name: "quote", match: (m, p) => m === "POST" && /\/(quote|pay)$/.test(p), limit: 40, windowMs: 600_000 },
  { name: "status", match: (_m, p) => /\/status$/.test(p), limit: 200, windowMs: 60_000 },
  { name: "any", match: () => true, limit: 300, windowMs: 60_000 },
];
const hits = new Map<string, { n: number; reset: number }>();

export function middleware(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rule = rules.find(r => r.match(req.method, req.nextUrl.pathname))!;
  const key = `${rule.name}:${ip}`, now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + rule.windowMs }); return NextResponse.next(); }
  if (++h.n > rule.limit) {
    return NextResponse.json({ error: "Too many requests. Please wait a bit and try again." }, { status: 429, headers: { "Retry-After": String(Math.ceil((h.reset - now) / 1000)) } });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
