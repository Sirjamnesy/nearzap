# Live test log

Status: **not yet run**. This file is updated with the result of a real mainnet run (tiny amount) before submission.

## Steps to reproduce

1. `cp .env.example .env.local` and keep `DEMO_MODE=0`.
2. `npm run dev`, create a $1 invoice with your own NEAR account.
3. Open the invoice link, choose a token you hold, enter your refund address on that chain, click **Preview price** (a `dry` quote, moves nothing).
4. Click **Get deposit address**, send exactly the displayed amount to it from your own wallet.
5. Watch the invoice move to **paid**; check the deposit address in https://explorer.near-intents.org.

## Result

_(fill in: date, token and chain used, amount, final status, tx links)_
