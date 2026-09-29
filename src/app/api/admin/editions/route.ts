import { NextResponse } from "next/server";
import fs from "fs";
import { EDITIONS_DIR, COVERS_DIR, editionPdfPath, coverPath } from "@/lib/storage";
import { requireAdmin, safe } from "@/lib/admin";
import { addEdition, removeEdition, getSettings, addLog } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  return NextResponse.json({ editions: (await getSettings()).editions });
}

export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const form = await req.formData();
  const date = String(form.get("date") || "").trim();
  const title = String(form.get("title") || "Le Point Chablais").trim();
  const publishAt = String(form.get("publishAt") || "").trim() || null;
  const pdf = form.get("pdf") as File | null;
  const cover = form.get("cover") as File | null;
  if (!date) return NextResponse.json({ error: "La date/période est requise." }, { status: 400 });
  if (!pdf || typeof pdf.arrayBuffer !== "function")
    return NextResponse.json({ error: "Le fichier PDF est requis." }, { status: 400 });

  const ed = await addEdition(date, title, publishAt);
  try {
    fs.mkdirSync(EDITIONS_DIR, { recursive: true });
    fs.mkdirSync(COVERS_DIR, { recursive: true });
    fs.writeFileSync(editionPdfPath(ed.id), Buffer.from(await pdf.arrayBuffer()));
    if (cover && typeof cover.arrayBuffer === "function" && cover.size > 0) {
      fs.writeFileSync(coverPath(ed.id), Buffer.from(await cover.arrayBuffer()));
    }
  } catch (e) {
    // pas de numéro « fantôme » si l'écriture du fichier échoue
    await removeEdition(ed.id);
    const err = e as NodeJS.ErrnoException;
    throw new Error(`Enregistrement du fichier impossible (${err.code || err.message}). Vérifiez que les dossiers « storage/editions » et « storage/covers » sont inscriptibles.`);
  }
  await addLog(admin.email, "Numéro ajouté", `${ed.title} — ${ed.date}${publishAt ? ` (sortie ${publishAt})` : ""}`);
  return NextResponse.json({ ok: true, edition: ed });
});

export const DELETE = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^ed\d+$/.test(id)) return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  await removeEdition(id);
  await addLog(admin.email, "Numéro supprimé", id);
  try { fs.unlinkSync(editionPdfPath(id)); } catch {}
  try { fs.unlinkSync(coverPath(id)); } catch {}
  return NextResponse.json({ ok: true });
});
