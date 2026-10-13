import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listUsers, listInvoices } from "@/lib/db";

export const runtime = "nodejs";

const DAY = 86400000;
const RE = /^\d{4}-\d{2}-\d{2}$/;

function toIso(x: unknown): string | null {
  if (x === null || x === undefined || x === "") return null;
  const d = typeof x === "number" ? new Date(x) : new Date(String(x));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// La date d'une facture : on essaie les noms de champ courants.
function invoiceDate(i: Record<string, unknown>): string | null {
  for (const k of ["date", "ts", "createdAt", "created", "paidAt"]) {
    const v = toIso(i[k]);
    if (v) return v;
  }
  return null;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const to = sp.get("to") || new Date().toISOString().slice(0, 10);
  let from = sp.get("from") || "";
  if (!from) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 11);
    from = d.toISOString().slice(0, 10);
  }
  if (!RE.test(from) || !RE.test(to) || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }
  if (from > to) return NextResponse.json({ error: "La date de début doit précéder la date de fin." }, { status: 400 });
  const days = Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1;
  if (days > 1827) return NextResponse.json({ error: "Période trop longue (5 ans maximum)." }, { status: 400 });

  // Par jour seulement si la période est courte (92 jours max), sinon par mois.
  const group: "day" | "month" = sp.get("group") === "day" && days <= 92 ? "day" : "month";

  const keys: string[] = [];
  if (group === "day") {
    for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) keys.push(new Date(t).toISOString().slice(0, 10));
  } else {
    const s = new Date(from + "T00:00:00Z");
    const endKey = to.slice(0, 7);
    let y = s.getUTCFullYear();
    let m = s.getUTCMonth();
    for (;;) {
      const k = `${y}-${String(m + 1).padStart(2, "0")}`;
      keys.push(k);
      if (k >= endKey) break;
      m++;
      if (m > 11) { m = 0; y++; }
    }
  }
  const idx = new Map(keys.map((k, i) => [k, i]));
  const keyOf = (isoStr: string) => (group === "day" ? isoStr.slice(0, 10) : isoStr.slice(0, 7));
  const zeros = () => keys.map(() => 0);

  const nouveauxMembres = zeros();
  const abonnementsPayes = zeros();
  const revenu = zeros();

  // Membres (hors admins) : nouveaux par période, et total cumulé.
  const members = (await listUsers()).filter((u) => u.role !== "admin");
  let base = 0; // membres créés avant la période (ou sans date)
  for (const u of members) {
    const c = toIso(u.createdAt);
    if (!c) { base++; continue; }
    const day = c.slice(0, 10);
    if (day < from) { base++; continue; }
    if (day > to) continue;
    const i = idx.get(keyOf(c));
    if (i !== undefined) nouveauxMembres[i]++;
  }
  const membresTotal: number[] = [];
  let run = base;
  for (let i = 0; i < keys.length; i++) { run += nouveauxMembres[i]; membresTotal.push(run); }

  // Factures payées : abonnements payés et revenus (montants en centimes → CHF).
  const invoices = (await listInvoices()) as unknown as Record<string, unknown>[];
  let sansDate = 0;
  for (const inv of invoices) {
    if (inv.status !== "paye") continue;
    const d = invoiceDate(inv);
    if (!d) { sansDate++; continue; }
    const day = d.slice(0, 10);
    if (day < from || day > to) continue;
    const i = idx.get(keyOf(d));
    if (i === undefined) continue;
    abonnementsPayes[i]++;
    revenu[i] += (Number(inv.amount) || 0) / 100;
  }

  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
  return NextResponse.json({
    from, to, group, keys,
    series: { nouveauxMembres, membresTotal, abonnementsPayes, revenu },
    totals: {
      nouveauxMembres: sum(nouveauxMembres),
      abonnementsPayes: sum(abonnementsPayes),
      revenu: sum(revenu),
    },
    facturesSansDate: sansDate,
  });
}