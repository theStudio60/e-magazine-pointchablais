import { NextResponse } from "next/server";
import fs from "fs";
import { editionPdfPath } from "@/lib/storage";
import { getSessionUserId } from "@/lib/auth";
import { getUserById, getSettings } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const known = (await getSettings()).editions.some((e) => e.id === id);
  if (!known || !/^ed\d+$/.test(id)) return new NextResponse("Introuvable", { status: 404 });

  const uid = await getSessionUserId();
  const user = uid ? await getUserById(uid) : undefined;
  if (!user || user.status !== "active") {
    return new NextResponse("Accès réservé aux abonnés actifs", { status: 403 });
  }

  const file = editionPdfPath(id);
  if (!fs.existsSync(file)) return new NextResponse("Fichier manquant", { status: 404 });

  const buf = fs.readFileSync(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="le-point-chablais-${id}.pdf"`,
    },
  });
}
