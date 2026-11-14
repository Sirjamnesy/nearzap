import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { getPayee } from "@/lib/payees";
import PayMeForm from "./PayMeForm";

export const dynamic = "force-dynamic";

export default async function PayMe({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ amount?: string }> }) {
  const p = await getPayee((await params).handle.toLowerCase());
  if (!p) notFound();
  const amt = (await searchParams).amount ?? "";
  const initialAmount = /^\d{1,9}(\.\d{1,2})?$/.test(amt) ? amt : "";
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const qr = await QRCode.toDataURL(`${origin}/u/${p.handle}`, { margin: 1, width: 220 });
  const initials = p.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
  return (
    <div style={{ textAlign: "center" }}>
      <span className="avatar" style={{ width: 84, height: 84, fontSize: 30, margin: "10px 0 0" }}>{initials}</span>
      <h1>Pay {p.name}</h1>
      <p className="mut">Send any amount from any chain. {p.name.split(" ")[0]} gets {p.receive ? p.receive.symbol : "USDC"}.</p>
      <PayMeForm handle={p.handle} first={p.name.split(" ")[0]} initialAmount={initialAmount} />
      <div className="card" style={{ display: "inline-block" }}>
        <img src={qr} alt={`QR code for ${origin}/u/${p.handle}`} width={160} height={160} />
        <div className="hint" style={{ margin: 0 }}>Scan to open this page</div>
      </div>
    </div>
  );
}
