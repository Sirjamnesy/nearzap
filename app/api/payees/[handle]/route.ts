import { NextResponse } from "next/server";
import { getPayee, publicPayee } from "@/lib/payees";

export const dynamic = "force-dynamic";
export async function GET(_: Request, ctx: { params: Promise<{ handle: string }> }) {
  const p = await getPayee((await ctx.params).handle.toLowerCase());
  return p ? NextResponse.json({ payee: publicPayee(p) }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
