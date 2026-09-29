import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { STORAGE_DIR, editionPdfPath } from "./storage";

// ---------------------------------------------------------------------------
// Rendu des numéros PDF en images, côté serveur.
// Le fichier PDF n'est jamais envoyé au navigateur : la liseuse reçoit des
// images de pages, avec le numéro d'abonné incrusté (filigrane).
// Les pages « propres » sont mises en cache sur disque (storage/pages/<id>/).
// ---------------------------------------------------------------------------

const req = createRequire(path.join(process.cwd(), "package.json"));
type Canvas = typeof import("@napi-rs/canvas");
type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfDoc = Awaited<ReturnType<PdfJs["getDocument"]>["promise"]>;

let canvasMod: Canvas | null = null;
let pdfjsMod: PdfJs | null = null;

function canvas(): Canvas {
  if (!canvasMod) canvasMod = req("@napi-rs/canvas") as Canvas;
  return canvasMod;
}
async function pdfjs(): Promise<PdfJs> {
  if (!pdfjsMod) pdfjsMod = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfJs;
  return pdfjsMod;
}

export const PAGE_WIDTHS = [900, 1500] as const;
export type PageWidth = (typeof PAGE_WIDTHS)[number];

const pagesDir = (id: string) => path.join(STORAGE_DIR, "pages", id);

function pdfStamp(id: string): string | null {
  try {
    const st = fs.statSync(editionPdfPath(id));
    return `${st.size}-${Math.round(st.mtimeMs)}`;
  } catch {
    return null;
  }
}

// ---- Documents chargés en mémoire (petit cache LRU) -----------------------
type Task = ReturnType<PdfJs["getDocument"]>;
const docs = new Map<string, { stamp: string; task: Task; doc: Promise<PdfDoc> }>();

async function loadDoc(id: string, stamp: string): Promise<PdfDoc> {
  const hit = docs.get(id);
  if (hit && hit.stamp === stamp) return hit.doc;
  if (hit) hit.task.destroy().catch(() => {});
  const lib = await pdfjs();
  const nm = path.join(process.cwd(), "node_modules", "pdfjs-dist").replace(/\\/g, "/");
  const task = lib.getDocument({
    data: new Uint8Array(fs.readFileSync(editionPdfPath(id))),
    disableFontFace: true,
    useSystemFonts: false,
    standardFontDataUrl: `${nm}/standard_fonts/`,
    cMapUrl: `${nm}/cmaps/`,
    cMapPacked: true,
    verbosity: 0,
  });
  const doc = task.promise;
  docs.set(id, { stamp, task, doc });
  doc.catch(() => docs.delete(id));
  while (docs.size > 3) {
    const [oldId, old] = docs.entries().next().value!;
    docs.delete(oldId);
    old.task.destroy().catch(() => {});
  }
  return doc;
}

// ---- Infos (nombre de pages + format) --------------------------------------
export type EditionInfo = { pages: number; ratio: number };

export async function editionInfo(id: string): Promise<EditionInfo | null> {
  const stamp = pdfStamp(id);
  if (!stamp) return null;
  const metaFile = path.join(pagesDir(id), "meta.json");
  try {
    const m = JSON.parse(fs.readFileSync(metaFile, "utf8"));
    if (m.stamp === stamp) return { pages: m.pages, ratio: m.ratio };
  } catch {
    /* pas encore calculé */
  }
  // Le PDF a changé (ou première lecture) : on repart d'un cache propre.
  fs.rmSync(pagesDir(id), { recursive: true, force: true });
  const doc = await loadDoc(id, stamp);
  const p1 = await doc.getPage(1);
  const vp = p1.getViewport({ scale: 1 });
  const info = { pages: doc.numPages, ratio: vp.height / vp.width };
  fs.mkdirSync(pagesDir(id), { recursive: true });
  fs.writeFileSync(metaFile, JSON.stringify({ stamp, ...info }));
  return info;
}

// ---- Rendu d'une page propre (mis en cache) --------------------------------
const inflight = new Map<string, Promise<Buffer>>();

async function cleanPage(id: string, n: number, width: PageWidth): Promise<Buffer> {
  const file = path.join(pagesDir(id), `${n}-${width}.jpg`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  const key = `${id}:${n}:${width}`;
  const running = inflight.get(key);
  if (running) return running;
  const job = (async () => {
    const stamp = pdfStamp(id);
    if (!stamp) throw new Error("PDF introuvable");
    const doc = await loadDoc(id, stamp);
    const page = await doc.getPage(n);
    const vp1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: width / vp1.width });
    const c = canvas().createCanvas(Math.round(vp.width), Math.round(vp.height));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport: vp,
      canvas: c as unknown as HTMLCanvasElement,
    }).promise;
    page.cleanup();
    const jpg = await c.encode("jpeg", 84);
    fs.mkdirSync(pagesDir(id), { recursive: true });
    fs.writeFileSync(file, jpg);
    return jpg;
  })();
  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

// ---- Page avec filigrane de l'abonné ---------------------------------------
// ---- Page avec filigrane de l'abonné ---------------------------------------
export async function watermarkedPage(id: string, n: number, width: PageWidth, label: string): Promise<Buffer> {
  const base = await cleanPage(id, n, width);
  const { createCanvas, loadImage } = canvas();
  const img = await loadImage(base);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // Filigrane diagonal discret, répété sur toute la page.
  const fs1 = Math.round(img.width / 34);
  ctx.save();
  ctx.font = `600 ${fs1}px sans-serif`;
  ctx.fillStyle = "rgba(14, 63, 83, 0.07)";
  ctx.translate(img.width / 2, img.height / 2);
  ctx.rotate(-Math.PI / 6);
  const stepX = fs1 * 16;
  const stepY = fs1 * 6;
  const span = Math.hypot(img.width, img.height);
  for (let y = -span; y < span; y += stepY) {
    for (let x = -span; x < span; x += stepX) ctx.fillText(label, x, y);
  }
  ctx.restore();

  // Mention lisible en bas de page.
  const fs2 = Math.max(11, Math.round(img.width / 90));
  ctx.font = `${fs2}px sans-serif`;
  ctx.fillStyle = "rgba(14, 63, 83, 0.55)";
  ctx.textAlign = "right";
  ctx.fillText(`Le Point Chablais · ${label} · usage personnel`, img.width - fs2, img.height - fs2);

  return c.encode("jpeg", 84);
}

// ---- Pré-rendu (après upload) et nettoyage ---------------------------------
export async function prerenderEdition(id: string): Promise<void> {
  const info = await editionInfo(id);
  if (!info) return;
  for (let n = 1; n <= info.pages; n++) await cleanPage(id, n, 900);
}

export function clearEditionCache(id: string): void {
  docs.get(id)?.task.destroy().catch(() => {});
  docs.delete(id);
  fs.rmSync(pagesDir(id), { recursive: true, force: true });
}