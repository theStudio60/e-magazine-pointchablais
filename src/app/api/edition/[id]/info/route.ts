import { NextResponse } from "next/server";
import { readerAccess } from "@/lib/reader";
import { editionInfo } from "@/lib/pdf-render";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await readerAccess(id);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const info = await editionInfo(id).catch(() => null);
  if (!info) return NextResponse.json({ error: "Fichier manquant" }, { status: 404 });
  return NextResponse.json(info, { headers: { "Cache-Control": "private, no-store" } });
}