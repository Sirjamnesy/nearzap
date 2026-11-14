import type { Metadata } from "next";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingMotion from "@/components/LandingMotion";

export const metadata: Metadata = { title: "NearZap roadmap: the next 6 months", description: "What NearZap plans to build next: alerts, local currencies and agent payments." };

const phases = [
  { cls: "p1", when: "Months 1 and 2", title: "Get paid, get told", items: ["Email and push alerts the moment you are paid", "Recurring invoices and gentle payment reminders", "Accounts, so your invoices follow you across devices"] },
  { cls: "p2", when: "Months 3 and 4", title: "Payroll, remittances and local money", items: ["Payroll: pay a whole team in one run, each person in the token they choose", "Remittances: send money home with a link, received in local currency", "Invoice in naira, cedi, shilling, euro or pound, priced live", "Cash out to a local bank or mobile money through partners"] },
  { cls: "p3", when: "Months 5 and 6", title: "Agents and shared money", items: ["Agents that earn, spend, negotiate and pay for services or other agents", "Shared budgets, community rewards and collective ownership with Sputnik DAO and Trezu", "An embeddable Pay button and tax-ready reports"] },
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
