import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { listUsers, listInvoices, getSettings } from "@/lib/db";

export const runtime = "nodejs";

type R = Record<string, unknown>;

function iso(x: unknown): string {
  if (x === null || x === undefined || x === "") return "";
  const d = typeof x === "number" ? new Date(x) : new Date(String(x));
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function invoiceDate(i: R): string {
  for (const k of ["date", "ts", "createdAt", "created", "paidAt"]) {
    const v = iso(i[k]);
    if (v) return v;
  }
  return "";
}

// Un membre est « actif » si son abonnement l'est (on essaie les noms de champ courants).
function isActive(u: R): boolean {
  const v = String(u.subscriptionStatus ?? u.subStatus ?? u.status ?? u.abonnement ?? "").toLowerCase();
  return ["active", "actif", "paye", "payé", "ok"].includes(v);
}

export const GET = safe(async () => {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const users = ((await listUsers()) as unknown as R[]).filter((u) => u.role !== "admin");
  const invoices = (await listInvoices()) as unknown as R[];
  const settings = (await getSettings()) as unknown as { packs?: { key: string; interval: string; price: number }[] };

  const byId = new Map(users.map((u) => [String(u.id), u]));
  const paid = invoices.filter((i) => i.status === "paye");
  const pending = invoices.filter((i) => i.status !== "paye");

  const revenuTotal = paid.reduce((s, i) => s + (Number(i.amount) || 0), 0) / 100;

  // MRR : somme des packs des membres actifs, ramenée au mois (année / 12).
  const packs = new Map((settings.packs ?? []).map((p) => [p.key, p]));
  let mrr = 0;
  for (const u of users) {
    if (!isActive(u)) continue;
    const p = packs.get(String(u.plan ?? u.pack ?? ""));
    if (p) mrr += (p.interval === "year" ? p.price / 12 : p.price) / 100;
  }

  const recentMembres = [...users]
    .sort((a, b) => iso(b.createdAt).localeCompare(iso(a.createdAt)))
    .slice(0, 6)
    .map((u) => ({
      name: String(u.name ?? ""),
      email: String(u.email ?? ""),
      createdAt: iso(u.createdAt) || undefined,
      status: String(u.status ?? ""),
    }));

  const recentInvoices = [...invoices]
    .sort((a, b) => invoiceDate(b).localeCompare(invoiceDate(a)))
    .slice(0, 6)
    .map((i) => ({
      id: String(i.id ?? i.number ?? Math.random()),
      number: String(i.number ?? i.id ?? ""),
      userName: String(i.userName ?? byId.get(String(i.userId))?.name ?? byId.get(String(i.userId))?.email ?? ""),
      amount: Number(i.amount) || 0,
      status: String(i.status ?? ""),
      date: invoiceDate(i),
    }));

  return NextResponse.json({
    stats: {
      totalMembres: users.length,
      actifs: users.filter(isActive).length,
      revenuTotal,
      mrr,
      enAttente: pending.length,
      numeros: 0,
    },
    recentMembres,
    recentInvoices,
  });
});