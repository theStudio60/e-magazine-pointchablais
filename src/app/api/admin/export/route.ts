import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listUsers } from "@/lib/db";

export const runtime = "nodejs";

const RE = /^\d{4}-\d{2}-\d{2}$/;
const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—");
const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("fr-CH") : "—");

// Protège Excel contre l'injection de formule (=, +, -, @) et échappe les guillemets.
function csvCell(v: string): string {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const hasRange = RE.test(from) && RE.test(to);

  // Abonnés = membres (hors admins).
  let members = (await listUsers()).filter((u) => u.role !== "admin");

  // Variante « inscrits sur la période » : filtre par date d'inscription.
  if (hasRange) {
    members = members.filter((u) => {
      if (!u.createdAt) return false;
      const d = u.createdAt.slice(0, 10);
      return d >= from && d <= to;
    });
  }

  // Plus récents d'abord.
  members.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const head = ["N° abonné", "Nom", "E-mail", "Formule", "Statut", "Inscription", "Échéance"];
  const body = members.map((u) => [
    u.subscriberNo,
    u.name || "",
    u.email,
    cap(u.plan),
    u.status === "active" ? "Actif" : "Inactif",
    fmt(u.createdAt),
    fmt(u.currentPeriodEnd),
  ]);

  // BOM + séparateur « ; » : s'ouvre proprement dans Excel (accents inclus).
  const lines = [head, ...body];
  const csv = "\uFEFF" + lines.map((l) => l.map(csvCell).join(";")).join("\r\n");

  const suffix = hasRange ? `${from}_${to}` : new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnes-${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}