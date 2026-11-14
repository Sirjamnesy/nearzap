import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "NearZap: get paid from any chain",
  description: "Make a payment link. Your client pays from whatever chain they hold. You receive exactly what you asked for, with no gas.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      {process.env.DEMO_MODE === "1" && <div className="banner">DEMO MODE: 1Click responses are simulated. No real funds move.</div>}
      {children}
    </body></html>
  );
}
