MOTION BRIEF: NearZap launch film, A. Launch film

ROLE
You are a senior motion designer and creative developer at a world-class studio.
Your work is meticulously art-directed, never template-looking.

GOAL
Audience: NEAR Hackathon judges and crypto-literate X/Twitter. They know chains, tokens and gas; they don't know NearZap.
They should: get the promise in one view (one link, client pays from any chain, you get the exact amount) and remember the name.
One message: "Get paid from any chain"
Concept: "One link, four chains." A $50 invoice is typed and its link copied; the link fans out into USDC / ETH / SOL / BTC;
the client pays in ETH; it lands as a big round "Paid $50.00". Then the same idea goes onto any website as a checkout button.
One white product card travels through every scene on the brand's lime stage.

FORMAT
Length 24 s · Aspect 16:9 1920x1080 · 30 fps · Engine brag-slim (HTML drawn as a pure function of time, Playwright capture, ffmpeg)
Extra cuts: vertical 9:16 after approval (not now)

SCENES
1 [0:00–5.25] Hook, the real /new form: "New invoice"; amount types 50, Client name "Kite Studio", What's it for "Logo design"; Your name "Ada" / NEAR account "ada.near" pre-filled (Remember my details); click "Create link for $50.00" -> "Send this link" screen with https://nearzap.vercel.app/i/k7m2qx, Copy link -> Copied, "Invoice created" toast. Text: "Type an amount. Copy the link." (v3)
2 [0:03.5–0:07.5] The card's token list fans out one row per beat: USDC on Base 50.000 USDC, ETH on Ethereum 0.0272 ETH, SOL on Solana 0.6882 SOL, BTC on Bitcoin 0.000759 BTC. Text: "Your client pays with whatever they hold."
3 [0:07.5–0:11] ETH row is picked; card turns into the pay view: Amount to send 0.0272 ETH, Address on Ethereum 0x7a3f…c91e, progress bar fills. Text: "Any chain. Any token."
4 [0:11–0:14] Slow on purpose: progress completes, big round green Paid pops, "$50.00 received". Text: "You receive exactly $50.00. No gas."
5 [0:14–0:18] Card slides into the embed demo: "Your site / Design course, $25" with the real "Pay with any crypto" button; two-line snippet types below; cursor clicks the button. Text: "Add a checkout button to any website."
6 [0:18–0:22] End card: everything clears; the two-tone bolt mark draws in, "NearZap" wordmark, subline "Get paid from any chain". Holds ~2.5 s. No URL (per request).

ON-SCREEN COPY (exact words)
S1 eyebrow "Ten seconds" · headline "Type an amount. Copy the link."
S2 headline "Your client pays with whatever they hold."
S3 eyebrow "Whenever they pay" · headline "Any chain. Any token."
S4 headline "You receive exactly $50.00." · subline "No gas. Nothing to install."
S5 headline "Add a checkout button to any website." · subline "Paste two lines." (v2: renamed from Pay button, per commit 5058c9e)
S6 "NearZap" · "Get paid from any chain"
Card UI text: "Invoice for NearZap", "Payment link", "Amount (USD)", "Your client can pay with", token rows as above, "You receive $50.00 USDC", "Copy link", "Link copied", "Amount to send", "Address on Ethereum", "Paid", "$50.00 received", "Your site", "Design course, $25", "Pay with any crypto", snippet from the landing page.

VISUAL STYLE
Palette: ink #0f0f0f (ground), lime #dafa9c (stage + accent text), green #2fd98b / #0a9b63 (Paid only), white #fff cards, #f1f1ec rows, muted #a3a3a3.
Background: flat ink; lime stage uses the site's notched clip-path polygon. No gradients or glows.
References: nearzap.vercel.app hero (.lp-stage + .frag) and embed section (.lp-embed).

TYPOGRAPHY
Albert Sans (variable, bundled locally). Headlines 600, -0.035em, 96px, max 2 lines; eyebrow 22px muted; card UI at ~1.6x site scale.
Text enters by line: 24px rise + fade, 0.5 s expo-out; exits: fade + 12px rise, 0.3 s. Max ~8 words of headline on screen.

MOTION LANGUAGE
Feel confident, quick, precise · Primary motion: expo-out (cubic-bezier(.16,1,.3,1), the site's --ease) and damped springs with slight overshoot for the Paid pop and button press.
Transitions: the card stays on stage and morphs between states (old content out, then new in). Headline swaps are staggered, never crossfaded on top of each other.
Slow on purpose: the Paid moment (scene 4).
Every element moves with intent. Nothing appears without a reason.

AUDIO
Narration none · Music: generated, 120 BPM (beat 0.5 s), A minor / C major, warm synth bass, soft kick, hats, pluck melody.
Sync: scene cuts on bar or half-bar lines (3.5, 7.5, 11, 14, 18 s); token rows on beats; Paid pop on the downbeat at 12.0 s; end card on 18.0 s, music resolves and rings out.
SFX: soft key ticks on typing, a click on Copy and the Pay button, a short chime on Paid, all in key and under the music. Loudness -14 LUFS.

ASSETS
work/fonts/albert-latin.woff2 · logo SVG from app/icon.svg (two-tone bolt) · copy and UI from app/landing.css, components/LandingFragment.tsx, public/embed.js

DO NOT
- Generic fade-ins or default easing
- Stock-looking gradients or glows
- More than 12 words on screen at once (excluding card UI)
- Show the URL on the end card
- Invent claims, numbers or testimonials (all numbers come from the live site)

ASSUMPTIONS
- 22 s rather than 20 to fit the Pay button beat without rushing.
- Token amounts reuse the site's hero sample (0.0272 ETH for $50).
- No voiceover; text carries the message muted.

DELIVERABLES
brag-output/nearzap-launch-v2.mp4 (poster baked into frame 0), nearzap-launch-v1.jpg, contact sheet, share-copy.txt, source in work/

VERSIONS
v1 22 s original · v2 checkout-button wording (5058c9e) · v3 scene 1 shows the real create-invoice form and generated link; film 24 s, later scenes +2 s, music gains one bar.
