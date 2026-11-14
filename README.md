# NearPay Invoices

**Track:** Real-World Money (`realworld`) · **Built for:** NEAR HACKATHON, Nov 2026

A freelancer creates an invoice and gets a link. The client pays from **whatever chain and token they already hold**. The freelancer receives **exactly the invoiced amount in USDC on NEAR** and never has to buy NEAR for gas. Every invoice has a status the freelancer can trust (open, pending, paid, refunded, overdue) and a CSV export an accountant can open without questions.

## The problem

Freelancers with international clients get paid in whatever their client happens to hold. Asking a client to "send USDC on NEAR" loses the sale; asking a freelancer to bridge, swap and top up gas on three chains loses the freelancer. Bookkeepers then get a pile of wallet transactions with no invoice attached.

## What it does

1. Freelancer fills in one form (name, NEAR account, client, line items, due date) and gets `/i/<id>`.
2. Client opens the link, picks a token and chain (ETH, USDC on Base, SOL, BTC, ...), enters a refund address, and receives a one-time deposit address with the exact amount.
3. The client sends funds. [NEAR Intents](https://docs.near-intents.org/) swaps and settles. The page shows progress live: deposit detected, converting, paid.
4. The invoice flips to **paid** with transaction links. If the deposit is late or too small, the funds are refunded and the invoice shows **refunded**.
5. `Export CSV` gives one row per line item with status, paid date, what the client paid with, deposit address and tx hashes.

## How NEAR is used

| Piece | What it does here |
| --- | --- |
| **NEAR Intents 1Click API** (`/v0/tokens`, `/v0/quote`, `/v0/status`, `/v0/deposit/submit`) | Cross-chain swap and settlement. We request an `EXACT_OUTPUT` quote so the freelancer receives exactly the invoice total, `ORIGIN_CHAIN` deposits so the client needs no NEAR account, and poll status by deposit address. |
| **USDC on NEAR** | Payout asset, resolved from the live token list at runtime (never hard-coded). |
| **Gasless payout** | Default payout mode sends USDC to the freelancer's balance on NEAR Intents (`recipientType: INTENTS`). No gas and no storage registration is needed on the freelancer's account. A second mode pays straight to the NEAR wallet (`DESTINATION_CHAIN`). |
| **NEAR accounts** | Payee is identified by a validated NEAR account ID (named or implicit). |

## Try it in 2 minutes (no wallet, no funds): demo mode

Requires Node 20+.

```bash
git clone <this repo> && cd <repo>
npm install
DEMO_MODE=1 npm run dev        # http://localhost:3000
```

Demo mode replaces the network calls to 1Click with simulated responses so anyone can run the full flow. A yellow banner shows on every page while it is on. It never touches real money.

Do X, see Y:

| # | Do | See |
| --- | --- | --- |
| 1 | Open `http://localhost:3000` | Empty dashboard: "Received $0.00 / Outstanding $0.00" |
| 2 | Click **New invoice**, enter name `Ada`, NEAR account `ada.near`, client `Acme`, one line `Design`, qty `2`, price `1500`, click **Create invoice link** | Redirect to `/i/inv_...` showing total **$3,000.00 USDC** and status `open` |
| 3 | Under **Pay this invoice**, leave `USDC on base`, enter refund address `0x1234567890abcdef`, click **Get deposit address** | A deposit address, a QR code, the exact amount, and "Waiting for your deposit" |
| 4 | Click **DEMO: simulate my deposit** | Progress bar moves: "Deposit detected", then "Converting and delivering", then **Paid ✓** with tx hashes (about 5 seconds) |
| 5 | Open **Invoices** | Received `$3,000.00`, invoice status `paid` |
| 6 | Click **CSV** | Download `invoices.csv` with one row per line item, status `paid`, amount `3000.00`, `USDC on base` |
| 7 | Try step 3 on the paid invoice via the API: `curl -X POST localhost:3000/api/invoices/<id>/quote -H 'content-type: application/json' -d '{"originAssetId":"demo:eth","refundTo":"0x1234567890abcdef"}'` | `409 {"error":"This invoice is already paid."}` |

Run the tests: `npm test` (20 tests: money math, validation, status logic, CSV escaping and formula-injection guard, 1Click request mapping).

## Live mode (real 1Click API)

```bash
cp .env.example .env.local     # leave DEMO_MODE=0; ONECLICK_JWT is optional
npm run dev
```

- There is **no Intents testnet** (per the hackathon FAQ), so live mode uses mainnet. Use tiny invoices (for example $1) and your own wallets.
- Without a JWT, 1Click charges an extra unauthenticated fee. Get a key at https://partners.near-intents.org.
- The **Preview price** button sends a `dry: true` quote that moves nothing. **Get deposit address** creates a real quote; only funds sent to that address are swapped.
- Minimum swap sizes per chain apply: https://docs.near-intents.org/resources/swap-limits

**Verification status (honest):** the 1Click client is written against the official docs and its request/response mapping is unit-tested. The build environment used to write this code had no route to `1click.chaindefuser.com`, so the live path was *not* exercised from there. See `docs/LIVE_TEST.md` for the result of the live run (filled in after it was done) and for the exact steps to reproduce.

## Architecture

```
Browser ── /i/[id] (PayPanel) ── polls /api/invoices/[id]/status every 3s
              │
Next.js route handlers (app/api/*)  ── lib/oneclick.ts ──► 1Click API (or demo fixtures)
              │
        lib/store.ts: Postgres if DATABASE_URL, else data/db.json
```

- `lib/invoice.ts` integer-cents money math, validation, status derivation
- `lib/oneclick.ts` token list, quote request builder, status polling, demo mode
- `lib/csv.ts` accountant CSV
- `lib/store.ts` storage (file or Postgres; read-modify-write is serialised / row-locked)
- `app/` pages and API routes

Statuses: `open` (no attempt, before due) · `pending` (a live deposit is awaited or processing) · `paid` · `refunded` (last attempt was refunded) · `overdue` (past due, unpaid).

## Known limits (prototype)

- The dashboard has **no login**. Anyone with the URL sees all invoices. Real use needs auth.
- The prompt suggests a meta-transaction relayer. We did not build one: gasless payout comes from paying into the Intents balance instead. Withdrawing from that balance to a wallet is outside this app.
- One payout asset (USDC on NEAR). One invoice currency (USD-denominated, paid as USDC).
- Status relies on the 1Click `/v0/status` endpoint; transaction links are shown when the API returns them.
- Demo mode simulates 1Click; it is for evaluation only.

## Libraries and boilerplate used

Next.js 15, React 19, TypeScript, `qrcode`, `pg`, Vitest. All application code was written during the hackathon window with AI assistance (Claude).

## License

MIT
