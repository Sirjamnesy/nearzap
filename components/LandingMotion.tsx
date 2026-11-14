"use client";
import { useEffect } from "react";

/** Adds entrance classes as sections scroll into view. Content stays visible if this never runs. */
export default function LandingMotion() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".rise, .shutter"));
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-in")); return; }
    // A clipped element has no visible area, so IntersectionObserver would never see it: watch its parent instead.
    const watched = new Map<Element, HTMLElement[]>();
    for (const el of els) { const t = el.classList.contains("shutter") && el.parentElement ? el.parentElement : el; watched.set(t, [...(watched.get(t) ?? []), el]); }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { watched.get(en.target)?.forEach(e => e.classList.add("is-in")); io.unobserve(en.target); } }), { threshold: 0.15 });
    watched.forEach((_, t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return null;
}
