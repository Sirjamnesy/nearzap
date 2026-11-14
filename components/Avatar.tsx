"use client";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/profile";
import { Icon } from "./Icon";

// First character (grapheme) of the first and last word, so emoji and accents are not cut in half.
const first = (w: string) => { try { return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(w)][0]?.segment ?? ""; } catch { return Array.from(w)[0] ?? ""; } };
const initials = (n: string) => { const w = n.trim().split(/\s+/).filter(Boolean); if (!w.length) return ""; const pick = w.length > 1 ? [w[0], w[w.length - 1]] : [w[0]]; return pick.map(x => first(x).toUpperCase()).join(""); };

/** Round profile button for the header. Shows initials once a name is saved, otherwise a person icon. */
export default function Avatar() {
  const [name, setName] = useState("");
  useEffect(() => { const sync = () => setName(loadProfile().name); sync(); window.addEventListener("storage", sync); window.addEventListener("nearzap-profile", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("nearzap-profile", sync); }; }, []);
  return (
    <a href="/profile" className="avatar" aria-label="Your profile" title="Your profile">
      {initials(name) || <Icon name="user" size={20} />}
    </a>
  );
}
