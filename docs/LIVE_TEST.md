# Live test log

## Result so far

A real mainnet payment was made through the deployed app (https://nearzap.vercel.app): an invoice was created, a payment was sent to the deposit address, 1Click reported it settled, and the invoice moved to **paid**. The payout went to the payee's NEAR Intents balance, so a wallet app shows 0 until it is withdrawn at near-intents.org.

Details to add before submission: date, token and chain paid with, amount, final status, deposit and destination transaction links (from https://explorer.near-intents.org).

## Not yet exercised with real money

Referral shares (`appFees`), receive-as for non-USDC tokens, wallet payouts, and multi-part invoices. The 1Click `appFees` array shape was confirmed accepted by a live dry quote, and the 5% cap was confirmed.

## Steps to reproduce

1. `cp .env.example .env.local`, keep `DEMO_MODE=0`, `npm run dev`.
2. Create a $1 invoice with your own NEAR account.
3. Open the link, choose a token you hold, enter your refund address, click **Preview price** (a `dry` quote, moves nothing).
4. Click **Get deposit address** and send exactly the shown amount from your own wallet.
5. Watch the invoice reach **paid** and check the deposit address in the explorer.
