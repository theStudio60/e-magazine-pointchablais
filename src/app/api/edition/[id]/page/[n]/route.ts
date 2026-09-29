import { NextResponse } from "next/server";
import { readerAccess, watermarkLabel } from "@/lib/reader";
import { editionInfo, watermarkedPage, PAGE_WIDTHS, type PageWidth } from "@/lib/pdf-render";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await ctx.params;
  const a = await readerAccess(id);
  if (!a.ok) return new NextResponse(a.error, { status: a.status });

  const page = Number(n);
  const info = await editionInfo(id).catch(() => null);
  if (!info) return new NextResponse("Fichier manquant", { status: 404 });
  if (!Number.isInteger(page) || page < 1 || page > info.pages) return new NextResponse("Page invalide", { status: 404 });

  const w = Number(new URL(req.url).searchParams.get("w"));
  const width: PageWidth = (PAGE_WIDTHS as readonly number[]).includes(w) ? (w as PageWidth) : 900;

  const img = await watermarkedPage(id, page, width, watermarkLabel(a.user));
  return new NextResponse(new Uint8Array(img), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=600",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noindex",
    },
  });
}