"use client";
import { useEffect, useState } from "react";
import { Logo } from "./Icon";

const links = [["#how", "How it works"], ["/roadmap", "Roadmap"], ["/profile", "Pay me page"], ["/agents", "For agents"], ["/embed", "Pay button"], ["/invoices", "Open app"]];

/** Landing header: inline links on desktop, a hamburger sheet on phones. */
export default function LandingNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <header className="lp-nav">
      <a href="/" className="lp-brand"><Logo size={28} /> NearZap</a>
      <nav aria-label="Main" className="lp-links">{links.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
      <button type="button" className="lp-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="lp-sheet" onClick={() => setOpen(o => !o)}>
        <span /><span />
      </button>
      <div id="lp-sheet" className={`lp-sheet${open ? " open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Menu">{links.map(([h, t]) => <a key={h} href={h} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{t}</a>)}</nav>
        <a className="lp-btn" href="/new" tabIndex={open ? 0 : -1}>Create an invoice</a>
      </div>
    </header>
  );
}
