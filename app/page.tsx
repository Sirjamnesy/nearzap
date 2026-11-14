import "./landing.css";
import LandingFragment from "@/components/LandingFragment";
import LandingMotion from "@/components/LandingMotion";
import LandingNav from "@/components/LandingNav";

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
      <LandingNav />

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
          <div className="lp-step s1 rise" style={{ ["--d" as string]: "0ms" }}>
            <div className="lp-seg"><span>Ten seconds</span>
              <div className="mini" data-ui><small>Amount (USD)</small><b>$50.00</b><i className="mini-btn">Copy link</i></div></div>
            <p><Bolt />First, you type an amount and copy the link.</p>
          </div>
          <div className="lp-step s2 rise" style={{ ["--d" as string]: "90ms" }}>
            <div className="lp-seg"><span>Whenever they pay</span>
              <div className="mini" data-ui>
                <div className="mini-row"><div><small>Amount to send</small><b>0.0166 ETH</b></div><i className="mini-ic" /></div>
                <div className="mini-row"><div><small>Address on Ethereum</small><b className="mono">0x7a3f…c91e</b></div><i className="mini-ic" /></div>
              </div></div>
            <p><Bolt />Then your client pays from any chain, with any token.</p>
          </div>
          <div className="lp-step s3 rise" style={{ ["--d" as string]: "180ms" }}>
            <div className="lp-seg"><span>A minute or two</span>
              <div className="mini mini-paid" data-ui><i className="mini-ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></i><b>Paid</b><small>$50.00 received</small></div></div>
            <p><Bolt />Last, it settles and you get the exact amount.</p>
          </div>
        </div>
      </section>

      <section className="lp-teaser">
        <div className="lp-teaser-in rise">
          <h2>Local currencies and agents are next</h2>
          <a className="lp-btn" href="/roadmap">See the 6-month roadmap</a>
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
        <nav aria-label="Footer"><a href="/roadmap">Roadmap</a><a href="/invoices">Invoices</a><a href="/profile">Profile</a><a href="/agents">For agents</a></nav>
      </footer>
    </div>
  );
}
