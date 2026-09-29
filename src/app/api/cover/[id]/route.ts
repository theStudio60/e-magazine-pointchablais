import { NextResponse } from "next/server";
import fs from "fs";
import { coverPath, COVER_PLACEHOLDER } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!/^ed\d+$/.test(id)) return new NextResponse("Introuvable", { status: 404 });
  const file = coverPath(id);
  if (!fs.existsSync(file)) {
    // couverture par défaut si absente
    const fb = COVER_PLACEHOLDER;
    if (fs.existsSync(fb)) {
      return new NextResponse(new Uint8Array(fs.readFileSync(fb)), {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
      });
    }
    return new NextResponse("Introuvable", { status: 404 });
  }
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
  });
}
