import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import type { Invoice, User, Site } from "@/lib/db";

export async function invoicePdf(inv: Invoice, user: User, site: Site): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.14, 0.19, 0.22);
  const blue = rgb(0.05, 0.25, 0.33);
  const muted = rgb(0.42, 0.49, 0.51);
  const line = rgb(0.9, 0.92, 0.92);
  const soft = rgb(0.96, 0.97, 0.97);
  const green = rgb(0.12, 0.6, 0.33);

  const M = 50;
  const right = 545;
  const chf = (c: number) => `CHF ${(c / 100).toFixed(2)}`;
  const date = new Date(inv.date).toLocaleDateString("fr-CH");
  const email = site.contactEmail || "abo@pointchablais.ch";

  const T = (t: string, x: number, y: number, size: number, f = font, color = ink) => page.drawText(t, { x, y, size, font: f, color });
  const TR = (t: string, xr: number, y: number, size: number, f = font, color = ink) => {
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: xr - w, y, size, font: f, color });
  };

  // Logo (public/logo.png) — repli sur le nom texte si introuvable.
  let under = 792;
  try {
    const bytes = await fs.readFile(path.join(process.cwd(), "public", "logo.png"));
    const img = await pdf.embedPng(bytes);
    const h = 42;
    const w = (img.width / img.height) * h;
    page.drawImage(img, { x: M, y: 800 - h, width: w, height: h });
    under = 800 - h - 14;
  } catch {
    T("Le Point Chablais", M, 778, 20, bold, blue);
    under = 764;
  }
  T(site.address || "Rue Centrale 9, 1892 Lavey-Village", M, under, 9.5, font, muted);
  T(email, M, under - 12, 9.5, font, muted);

  // Bloc FACTURE (haut droite)
  TR("FACTURE", right, 792, 22, bold, blue);
  TR(`N° ${inv.number}`, right, 770, 10, font, ink);
  TR(`Date : ${date}`, right, 757, 10, font, ink);
  TR(inv.status === "paye" ? "Statut : Payée" : "Statut : En attente", right, 744, 10, font, inv.status === "paye" ? green : muted);

  // Facturé à
  let fy = 690;
  T("Facturé à", M, fy, 11, bold, blue); fy -= 17;
  T(user.name || user.email, M, fy, 11, font, ink); fy -= 14;
  T(user.email, M, fy, 10, font, muted); fy -= 13;
  T(`N° abonné : ${user.subscriberNo}`, M, fy, 10, font, muted);

  // Tableau
  let ty = 620;
  page.drawRectangle({ x: M, y: ty - 7, width: right - M, height: 25, color: soft });
  T("Désignation", M + 12, ty, 10.5, bold, blue);
  TR("Montant", right - 12, ty, 10.5, bold, blue);
  ty -= 26;
  T(`Abonnement ${inv.plan} (numérique)`, M + 12, ty, 11, font, ink);
  TR(chf(inv.amount), right - 12, ty, 11, font, ink);
  ty -= 12;
  page.drawLine({ start: { x: M, y: ty }, end: { x: right, y: ty }, thickness: 1, color: line });
  ty -= 30;

  // Total
  page.drawRectangle({ x: right - 230, y: ty - 9, width: 230, height: 32, color: soft });
  T("Total", right - 218, ty, 13, bold, blue);
  TR(chf(inv.amount), right - 12, ty, 13, bold, blue);

  // Pied de page
  T("Merci pour votre abonnement au Point Chablais.", M, 92, 9.5, font, muted);
  T(`${site.address || "Rue Centrale 9, 1892 Lavey-Village"} · ${email}`, M, 78, 9, font, muted);

  return Buffer.from(await pdf.save());
}