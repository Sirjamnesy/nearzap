import type { Metadata } from "next";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingMotion from "@/components/LandingMotion";

export const metadata: Metadata = { title: "NearZap roadmap: the next 6 months", description: "What NearZap plans to build next: alerts, payroll, local money and agent payments." };

const phases = [
  { cls: "p1", when: "Months 1 and 2", title: "Get paid, get told", items: ["A ping the moment money lands", "Invoices that repeat themselves, with polite nudges for late ones", "Sign in once and see your invoices on any device"] },
  { cls: "p2", when: "Months 3 and 4", title: "Teams, family and local money", items: ["Payroll: one run pays everyone, each in the coin they prefer", "Remittances: a link that sends money home and lands as local cash", "Price invoices in naira, cedis, shillings, euros or pounds", "Hand money off to a bank or mobile wallet near you"] },
  { cls: "p3", when: "Months 5 and 6", title: "Agents and shared pots", items: ["Software agents with their own wallets that can earn, spend, haggle and settle with people or with each other", "Pooled budgets, rewards and joint ownership for communities, run through Sputnik DAO and Trezu", "A Pay button for any website, and reports ready for tax time"] },
];

export default function Roadmap() {
  return (
    <div className="lp">
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <LandingMotion />
      <LandingNav />
      <main className="lp-page">
        <h1 className="rise">The next six months</h1>
        <p className="lp-roadsub rise" style={{ ["--d" as string]: "60ms" }}>Today NearZap turns one amount into a link that anyone can pay from any chain. This is where it goes from here.</p>
        <div className="lp-phases">
          {phases.map((p, i) => (
            <article key={p.cls} className={`lp-phase ${p.cls} rise`} style={{ ["--d" as string]: `${i * 90}ms` }}>
              <small>{p.when}</small><h3>{p.title}</h3>
              <ul>{p.items.map(t => <li key={t}>{t}</li>)}</ul>
            </article>))}
        </div>
        <p className="lp-note rise">Planned, not built yet. Dates move; the order is the point.</p>
        <p className="rise"><a className="lp-btn" href="/new">Create an invoice</a></p>
      </main>
    </div>
  );
}
