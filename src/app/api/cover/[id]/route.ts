import { NextResponse } from "next/server";
import fs from "fs";
import { coverPath } from "@/lib/storage";
import { getSettings } from "@/lib/db";

export const runtime = "nodejs";

// Couverture neutre (générée) quand aucune image n'a été téléversée : on n'affiche
// plus une « fausse » couverture qui pourrait être prise pour un vrai numéro.
function placeholder(label: string): NextResponse {
  const safe = label.replace(/[<&>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
  <rect width="600" height="850" fill="#124f68"/>
  <rect y="0" width="600" height="230" fill="#0e3f53"/>
  <text x="300" y="130" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#ffffff">LE POINT</text>
  <text x="300" y="180" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="26" fill="#9fc0cb">Chablais</text>
  <text x="300" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="600" fill="#ffffff">${safe}</text>
  <text x="300" y="520" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#9fc0cb">Édition numérique</text>
</svg>`;
  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^ed\d+$/.test(id)) return new NextResponse("Introuvable", { status: 404 });
  const file = coverPath(id);
  if (fs.existsSync(file)) {
    return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
    });
  }
  const ed = (await getSettings()).editions.find((e) => e.id === id);
  return placeholder(ed?.date || "Le Point Chablais");
}