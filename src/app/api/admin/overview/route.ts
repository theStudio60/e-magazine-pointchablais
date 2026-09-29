import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listUsers, listInvoices, getSettings } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const users = await listUsers();
  const abonnes = users.filter((u) => u.role !== "admin");
  const actifs = abonnes.filter((u) => u.status === "active");
  const invoices = await listInvoices();
  const packs = (await getSettings()).packs;
  const priceOf = (k: string | null) => packs.find((p) => p.key === k)?.price ?? 0;
  const mrr = actifs.reduce((s, u) => {
    const p = packs.find((x) => x.key === u.plan);
    if (!p) return s;
    return s + (p.interval === "year" ? p.price / 12 : p.price);
  }, 0);
  const revenuTotal = invoices.filter((i) => i.status === "paye").reduce((s, i) => s + i.amount, 0);
  const enAttente = invoices.filter((i) => i.status === "en_attente").length;

  return NextResponse.json({
    stats: {
      totalMembres: abonnes.length,
      actifs: actifs.length,
      revenuTotal: revenuTotal / 100,
      mrr: mrr / 100,
      enAttente,
      numeros: (await getSettings()).editions.length,
    },
    recentMembres: abonnes
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 5)
      .map((u) => ({ name: u.name || u.email, email: u.email, createdAt: u.createdAt, status: u.status })),
    recentInvoices: invoices.slice(0, 6),
    _priceOf: priceOf(null),
  });
}
