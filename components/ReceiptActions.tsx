"use client";
import { useState } from "react";
import { Icon } from "./Icon";

export default function ReceiptActions({ link }: { link: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="btnrow noprint" style={{ justifyContent: "center" }}>
      <button onClick={async () => { try { await navigator.clipboard.writeText(location.origin + link); setDone(true); setTimeout(() => setDone(false), 1600); } catch { window.prompt("Copy this link", location.origin + link); } }}><Icon name={done ? "check" : "link"} /> {done ? "Copied" : "Copy receipt link"}</button>
      <button className="sec" onClick={() => window.print()}><Icon name="print" /> Print or save PDF</button>
    </div>
  );
}
