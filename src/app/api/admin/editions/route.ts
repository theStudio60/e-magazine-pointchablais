import { NextResponse } from "next/server";
import fs from "fs";
import { EDITIONS_DIR, COVERS_DIR, editionPdfPath, coverPath } from "@/lib/storage";
import { prerenderEdition, clearEditionCache } from "@/lib/pdf-render";
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
  const title = String(form.get("title") || "Le Point Chablais").trim() || "Le Point Chablais";
  const publishAt = String(form.get("publishAt") || "").trim() || null;
  const pdf = form.get("pdf") as File | null;
  const cover = form.get("cover") as File | null;

  if (!date) return NextResponse.json({ error: "La période est requise (ex. « Octobre 2026 »)." }, { status: 400 });
  if (!pdf || typeof pdf.arrayBuffer !== "function" || pdf.size === 0)
    return NextResponse.json({ error: "Le fichier PDF est requis." }, { status: 400 });

  // 1) On lit (et valide) TOUT le téléversement AVANT de créer le numéro.
  //    Ainsi un envoi coupé ne laisse jamais de numéro « fantôme » en base.
  let pdfBuf: Buffer;
  let coverBuf: Buffer | null = null;
  try {
    pdfBuf = Buffer.from(await pdf.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Téléversement interrompu. Réessayez." }, { status: 400 });
  }
  if (pdfBuf.subarray(0, 5).toString("latin1") !== "%PDF-")
    return NextResponse.json({ error: "Le fichier n'est pas un PDF valide." }, { status: 400 });
  if (cover && typeof cover.arrayBuffer === "function" && cover.size > 0) {
    try {
      coverBuf = Buffer.from(await cover.arrayBuffer());
    } catch {
      return NextResponse.json({ error: "Image de couverture illisible. Réessayez." }, { status: 400 });
    }
  }

  // 2) Fichiers reçus en entier : on crée le numéro puis on écrit sur le disque.
  const ed = await addEdition(date, title, publishAt);
  try {
    fs.mkdirSync(EDITIONS_DIR, { recursive: true });
    fs.mkdirSync(COVERS_DIR, { recursive: true });
    fs.writeFileSync(editionPdfPath(ed.id), pdfBuf);
    if (coverBuf) fs.writeFileSync(coverPath(ed.id), coverBuf);
  } catch (e) {
    await removeEdition(ed.id);
    try { fs.unlinkSync(editionPdfPath(ed.id)); } catch {}
    const err = e as NodeJS.ErrnoException;
    throw new Error(`Enregistrement impossible (${err.code || err.message}). Les dossiers « storage/editions » et « storage/covers » doivent être inscriptibles.`);
  }

  clearEditionCache(ed.id);
  prerenderEdition(ed.id).catch((e) => console.error("[liseuse] pré-rendu", ed.id, e));
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
  clearEditionCache(id);
  try { fs.unlinkSync(coverPath(id)); } catch {}
  return NextResponse.json({ ok: true });
});