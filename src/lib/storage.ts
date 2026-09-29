import path from "path";

// Fichiers uploadés (PDF des numéros + couvertures), hors du dossier public.
// En prod, STORAGE_DIR peut pointer vers un dossier persistant hors du code déployé.
export const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "storage");

export const EDITIONS_DIR = path.join(STORAGE_DIR, "editions");
export const COVERS_DIR = path.join(STORAGE_DIR, "covers");
export const COVER_PLACEHOLDER = path.join(process.cwd(), "public", "cover-placeholder.jpg");

export const editionPdfPath = (id: string) => path.join(EDITIONS_DIR, `${id}.pdf`);
export const coverPath = (id: string) => path.join(COVERS_DIR, `${id}.jpg`);
