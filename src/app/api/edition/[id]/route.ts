import { NextResponse } from "next/server";
import fs from "fs";
import { editionPdfPath } from "@/lib/storage";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

// Fichier PDF original : réservé aux administrateurs (vérification d'un upload).
// Les abonnés lisent via la liseuse (/lire/[id]), sans accès au fichier.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^ed\d+$/.test(id)) return new NextResponse("Introuvable", { status: 404 });
  if (!(await requireAdmin())) return new NextResponse("Accès réservé", { status: 403 });
  const file = editionPdfPath(id);
  if (!fs.existsSync(file)) return new NextResponse("Fichier manquant", { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${id}.pdf"` },
  });
}