"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";

const APP_PAGES = ["/new", "/profile", "/agents"];

/** Back button for inner pages. Goes back in history when the visitor came from inside the app, otherwise to the dashboard.
 *  On shared pages (invoice, receipt, Pay me) it only shows when they arrived from inside the app, so a client opening a link never sees it. */
export default function BackButton() {
  const path = usePathname(), router = useRouter();
  const [inApp, setInApp] = useState(false);
  useEffect(() => { try { setInApp(!!document.referrer && new URL(document.referrer).origin === window.location.origin); } catch { setInApp(false); } }, [path]);
  if (path === "/invoices") return null;
  if (!inApp && !APP_PAGES.includes(path)) return null;
  const go = () => { if (inApp && window.history.length > 1) router.back(); else router.push("/invoices"); };
  return <button type="button" className="backbtn noprint" onClick={go} aria-label="Go back"><Icon name="arrow" size={18} /> Back</button>;
}
