# NearZap

**Track:** Real-World Money (`realworld`), also touching Agent Economy · **Built for:** NEAR HACKATHON, Nov 2026
**Live app:** https://nearzap.vercel.app

Make a payment link. Your client pays with whatever chain and token they already hold. You receive exactly the amount you asked for, with no gas and nothing to install.

## The problem

Freelancers with international clients get paid in whatever the client happens to hold. Asking a client to "send USDC on NEAR" loses the sale; asking a freelancer to bridge, swap and top up gas on three chains loses the freelancer. Bookkeepers then get wallet transactions with no invoice attached.

## What it does

- **Invoice in one field.** Type an amount, get a link. Line items, a due date, deposits and milestones are optional ("More options").
- **Client pays from any chain.** They pick a token (ETH, SOL, BTC, USDC on Base and more), get a deposit address with the exact amount (copy buttons), and watch it turn to a big **Paid**.
- **Choose what you receive.** Default is USDC. Any token on the live 1Click list works, delivered to your Intents balance (gasless) or straight to a wallet address on that chain.
- **Pay me page.** Claim a handle and share `/u/<handle>`: a profile, QR code and amount box. Whoever visits creates an invoice to you in one tap.
- **Deposits and milestones.** Split an invoice into parts (for example 30/70, or named milestones). Each part is paid on its own and the invoice shows *partial* until all are paid.
- **Receipts.** Every paid invoice has a printable receipt at `/r/<id>`, and the dashboard refreshes statuses on its own.
- **Referral shares.** Send 1 to 4% of an invoice to up to two other NEAR accounts, taken as 1Click app fees. 1Click caps app fees at 5%, so shares are capped at 4%; the amount you receive stays exact.
- **Agent-payable.** `GET /api/invoices/<id>/pay` returns HTTP 402 with machine-readable payment options while unpaid, and 200 with a receipt link once paid. `/agents` documents the flow.
- **Accountant CSV** of your invoices.
- **Profile** remembers your name, NEAR account and defaults on this device. There is no login: invoices you create are kept in your browser, and a Pay me page is edited with a private key stored on your device.

## How NEAR is used

| Piece | What it does here |
| --- | --- |
| **NEAR Intents 1Click API** (`/v0/tokens`, `/v0/quote`, `/v0/status`, `/v0/deposit/submit`) | Cross-chain swap and settlement. `EXACT_OUTPUT` quotes so you receive exactly the invoiced amount, `ORIGIN_CHAIN` deposits so the client needs no NEAR account, status polling by deposit address. |
| **App fees** | Referral shares are sent as the `appFees` array on the quote. |
| **Intents balance payout** | Default payout is `recipientType: INTENTS`: no gas, no storage registration. It does not show in wallet apps; view and withdraw it at near-intents.org. `DESTINATION_CHAIN` pays a wallet directly. |
| **NEAR accounts** | Payees are identified by NEAR account IDs (named or implicit). |

## Try it without funds: demo mode

Node 20+.

```bash
git clone https://github.com/Sirjamnesy/nearzap && cd nearzap
npm install
DEMO_MODE=1 npm run dev        # http://localhost:3000
```

Demo mode simulates 1Click so you can run the whole flow with no money; a banner shows on every page.

| # | Do | See |
| --- | --- | --- |
| 1 | Open `/` and click **Create an invoice** | The new-invoice form, amount first |
| 2 | Enter `25`, your name, a NEAR account such as `ada.near`, click **Create** | "Invoice created" with a link to copy |
| 3 | Open the link, pick a token, enter a refund address, click **Get deposit address** | Amount and address rows, each with a copy button |
| 4 | Click **DEMO: simulate my deposit** | Progress, then a big round **Paid** |
| 5 | Click **View receipt** | Receipt page; "More details" holds the transaction info |
| 6 | Open `/invoices` | Received `$25.00`, status paid |
| 7 | `curl localhost:3000/api/invoices/<id>/pay` | `200` with a receipt link (it returns `402` while unpaid) |

Tests: `npm test` (30 tests: money math, parts, validation, fee gross-up and the 4% cap, address checks, CSV, 1Click request mapping).

## Live mode

```bash
cp .env.example .env.local     # DEMO_MODE=0; ONECLICK_JWT is optional
npm run dev
```

There is no Intents testnet, so live mode uses mainnet: use tiny invoices and your own wallets. Without a JWT 1Click adds a small unauthenticated fee. **Preview price** sends a `dry` quote that moves nothing.

**Verification status (honest):**
- Verified with real money: one cross-chain payment of an invoice, paid out to an Intents balance. Details in `docs/LIVE_TEST.md`.
- Verified live without money: quote requests with the `appFees` array are accepted, and the 5% cap is enforced by 1Click.
- Covered by tests and demo mode only: referral shares, receive-as for non-USDC tokens, wallet payouts, deposits and milestones.

## Architecture

```
app/page.tsx            landing
app/(app)/*             dashboard, new invoice, pay page, receipt, Pay me page, profile, agents docs
app/api/*               route handlers  ── lib/oneclick.ts ──► 1Click API (or demo fixtures)
lib/store.ts            Postgres if DATABASE_URL, else data/db.json
lib/payees.ts           Pay me handles (hashed edit key)
```

Statuses: `open`, `pending`, `partial`, `paid`, `refunded`, `overdue` (only when a due date is set).

## Known limits

- No accounts. Invoices are listed from ids kept on your device; clearing browser data loses the list (links still work).
- No paid alerts or email yet (see the roadmap on the landing page).
- Basic rate limiting is on the API (best effort on the free Vercel plan).
- Referral shares are capped at 4% total by the 1Click fee limit.
- Intents-balance payouts are not visible in wallet apps until withdrawn at near-intents.org.
- Demo mode simulates 1Click and is for evaluation only.

## Libraries

Next.js 15, React 19, TypeScript, `qrcode`, `pg`, Vitest. All application code was written during the hackathon window with AI assistance (Claude).

## License

MIT
