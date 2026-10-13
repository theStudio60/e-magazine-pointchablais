import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { requireAdmin, safe } from "@/lib/admin";
import { appUrl } from "@/lib/mailer";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
// Dossier de stockage (hors "public").
const DIR = path.join(process.cwd(), "uploads", "emails");
const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

// On détermine le vrai type d'après le contenu du fichier, pas d'après son nom.
function detect(buf: Buffer): "png" | "jpg" | "gif" | "webp" | null {
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 6 && buf.subarray(0, 4).toString("ascii") === "GIF8") return "gif";
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

// POST : envoi d'une image (réservé à l'admin).
export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (2 Mo maximum)." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detect(buf);
  if (!ext) return NextResponse.json({ error: "Format non accepté : utilisez une image JPG, PNG, GIF ou WebP." }, { status: 400 });

  const name = crypto.randomBytes(16).toString("hex") + "." + ext;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, name), buf);

  const url = `${appUrl(new URL(req.url).origin)}/api/admin/emails/upload?f=${name}`;
  return NextResponse.json({ ok: true, url });
});

// GET : affichage d'une image (public, pour les boîtes mail des abonnés).
// Seuls les noms générés par l'envoi sont acceptés : aucun accès à d'autres fichiers.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("f") || "";
  const m = /^[a-f0-9]{32}\.(png|jpg|gif|webp)$/.exec(name);
  if (!m) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(DIR, name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[m[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}