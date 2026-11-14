"use client";
import { useState } from "react";
import { Icon } from "./Icon";

/** A labelled value with a copy button beside it. `copy` is what lands on the clipboard (defaults to the value). */
export default function CopyRow({ label, value, copy, mono }: { label: string; value: string; copy?: string; mono?: boolean }) {
  const [done, setDone] = useState(false);
  async function go() {
    const text = copy ?? value;
    try { await navigator.clipboard.writeText(text); } catch { window.prompt("Copy this", text); }
    setDone(true); setTimeout(() => setDone(false), 1600);
  }
  return (
    <div className="copyrow">
      <div className="copytext"><span className="k">{label}</span><span className={`v${mono ? " mono" : ""}`}>{value}</span></div>
      <button type="button" className={`iconbtn${done ? " done" : ""}`} onClick={go} aria-label={`Copy ${label.toLowerCase()}`}>
        <Icon name={done ? "check" : "copy"} />
      </button>
    </div>
  );
}
