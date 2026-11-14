import { Logo } from "@/components/Icon";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Neon footer. The social icons are decorative on purpose: flat, not links. */
export default function LandingFooter() {
  return (
    <footer className="lp-foot2">
      <div className="lp-foot2-in">
        <p className="lp-foot2-tag">Get paid from any chain, settled with NEAR Intents.</p>
        <div className="lp-social" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" /></svg>
          <svg viewBox="0 0 24 24" {...stroke}><path d="M22 3 2 11l7 2.5L11.5 21l3-5.5L19 19z" /><path d="m9 13.5 13-10.5" /></svg>
          <svg viewBox="0 0 24 24" {...stroke}><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z" /></svg>
        </div>
        <nav className="lp-foot2-nav" aria-label="Footer">
          <a href="/roadmap">Roadmap</a><a href="/invoices">Invoices</a><a href="/profile">Pay me page</a><a href="/agents">For agents</a><a href="/embed">Checkout button</a>
        </nav>
        <p className="lp-foot2-fine">© 2026 NearZap. Built solo for the NEAR Hackathon.</p>
      </div>
      <h2 className="lp-word" aria-label="NearZap">
        <span>Near</span><Logo /><span>Zap</span>
      </h2>
    </footer>
  );
}
