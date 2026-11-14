"use client";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/profile";
import { Icon } from "./Icon";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

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
