import "./landing.css";
import LandingFragment from "@/components/LandingFragment";
import LandingMotion from "@/components/LandingMotion";
import { Logo } from "@/components/Icon";

const Bolt = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="M18.2 3.5L7 18h7.4l-1.2 10.5L25 13.5h-7.6z" /></svg>
);

export default function Landing() {
  return (
    <div className="lp">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <LandingMotion />
      <header className="lp-nav">
        <a href="/" className="lp-brand"><Logo size={26} /> NearZap</a>
        <nav aria-label="Main">
          <a href="#how">How it works</a><a href="#roadmap">Roadmap</a><a href="/profile">Pay me page</a><a href="/agents">For agents</a><a href="/invoices">Open app</a>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-copy">
          <h1 className="rise" style={{ ["--d" as string]: "0ms" }}>Get paid from any chain</h1>
          <p className="lp-sub rise" style={{ ["--d" as string]: "80ms" }}>Make a payment link. Your client pays with whatever they hold. You receive exactly what you asked for, with no gas.</p>
          <p className="rise" style={{ ["--d" as string]: "160ms" }}><a className="lp-btn" href="/new">Create an invoice</a></p>
          <p className="lp-alt rise" style={{ ["--d" as string]: "220ms" }}><a href="/profile">Or receive money with your own Pay me page</a></p>
        </div>
        <div className="lp-stage shutter"><LandingFragment /></div>
      </section>

      <section className="lp-how" id="how">
        <h2 className="rise">How a payment moves</h2>
        <div className="lp-bar">
          <div className="lp-seg s1 rise" style={{ ["--d" as string]: "0ms" }}><span>Ten seconds</span>
            <div className="mini" data-ui><small>Amount (USD)</small><b>$50.00</b><i className="mini-btn">Copy link</i></div></div>
          <div className="lp-seg s2 rise" style={{ ["--d" as string]: "90ms" }}><span>Whenever they pay</span>
            <div className="mini" data-ui>
              <div className="mini-row"><div><small>Amount to send</small><b>0.0166 ETH</b></div><i className="mini-ic" /></div>
              <div className="mini-row"><div><small>Address on Ethereum</small><b className="mono">0x7a3f…c91e</b></div><i className="mini-ic" /></div>
            </div></div>
          <div className="lp-seg s3 rise" style={{ ["--d" as string]: "180ms" }}><span>A minute or two</span>
            <div className="mini mini-paid" data-ui><i className="mini-ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></i><b>Paid</b><small>$50.00 received</small></div></div>
        </div>
        <ol className="lp-clauses">
          <li className="rise" style={{ ["--d" as string]: "0ms" }}><Bolt />First, you type an amount and copy the link.</li>
          <li className="rise" style={{ ["--d" as string]: "90ms" }}><Bolt />Then your client pays from any chain, with any token.</li>
          <li className="rise" style={{ ["--d" as string]: "180ms" }}><Bolt />Last, it settles and you get the exact amount.</li>
        </ol>
      </section>

      <section className="lp-road" id="roadmap">
        <h2 className="rise">Where NearZap goes next</h2>
        <p className="lp-roadsub rise" style={{ ["--d" as string]: "60ms" }}>Planned, not built yet. Today is the invoice link; this is the next year.</p>
        <div className="lp-phases">
          <article className="lp-phase p1 rise" style={{ ["--d" as string]: "0ms" }}>
            <h3>Next 3 months</h3>
            <ul><li>Email and push alerts the moment you are paid</li><li>Recurring invoices and gentle payment reminders</li><li>Accounts, so your invoices follow you across devices</li></ul>
          </article>
          <article className="lp-phase p2 rise" style={{ ["--d" as string]: "90ms" }}>
            <h3>Months 4 to 6</h3>
            <ul><li>Invoice in local currencies: naira, cedi, shilling, euro and pound, priced live</li><li>Cash out to a local bank or mobile money through partners</li><li>Shared workspaces for small teams and agencies</li></ul>
          </article>
          <article className="lp-phase p3 rise" style={{ ["--d" as string]: "180ms" }}>
            <h3>Months 7 to 12</h3>
            <ul><li>Agents that invoice and pay each other, built on the pay endpoint</li><li>An embeddable Pay button for any website</li><li>Tax-ready reports and exports for your accountant</li></ul>
          </article>
        </div>
      </section>

      <section className="lp-close">
        <div className="lp-tile t-side t-a rise"><Bolt /></div>
        <div className="lp-tile t-main rise" style={{ ["--d" as string]: "80ms" }}>
          <h2>Make your first link</h2>
          <p>It takes ten seconds. Your client needs nothing but a wallet they already have.</p>
          <p><a className="lp-btn dark" href="/new">Create an invoice</a></p>
          <div className="payme" data-ui aria-hidden="true"><i className="payme-av">A</i><b>Pay Ada</b><small>nearzap.vercel.app/u/ada</small><i className="payme-qr" /></div>
        </div>
        <div className="lp-tile t-side t-b rise" style={{ ["--d" as string]: "160ms" }}><Bolt /></div>
      </section>

      <footer className="lp-foot rise">
        <span>NearZap · settled with NEAR Intents</span>
        <nav aria-label="Footer"><a href="/invoices">Invoices</a><a href="/profile">Profile</a><a href="/agents">For agents</a></nav>
      </footer>
    </div>
  );
}
