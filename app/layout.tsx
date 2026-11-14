import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "NearZap", description: "Invoice anyone. Get paid in USDC on NEAR. Your client pays from any chain." };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      {process.env.DEMO_MODE === "1" && <div className="banner">DEMO MODE: 1Click responses are simulated. No real funds move.</div>}
      <header className="top"><b>NearZap</b><nav><a href="/">Invoices</a> · <a href="/new">New invoice</a> · <a href="/profile">Profile</a></nav></header>
      <main>{children}</main>
    </body></html>
  );
}
