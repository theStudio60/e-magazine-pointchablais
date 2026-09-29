import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { listUsers, createUser, getUserByEmail, addLog, getPack, createInvoice, type User } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

function pub(u: User) {
  return {
    id: u.id, email: u.email, name: u.name, subscriberNo: u.subscriberNo,
    role: u.role, plan: u.plan, status: u.status, currentPeriodEnd: u.currentPeriodEnd, createdAt: u.createdAt,
  };
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const role = url.searchParams.get("role"); // "user" | "admin" | null
  const status = url.searchParams.get("status"); // "active" | "inactive" | null
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const size = Math.min(100, Math.max(5, Number(url.searchParams.get("size") || 10)));

  const all = await listUsers();
  const members = all.filter((u) => u.role !== "admin");
  const now = new Date();
  const stats = {
    total: members.length,
    actifs: members.filter((u) => u.status === "active").length,
    inactifs: members.filter((u) => u.status !== "active").length,
    nouveaux: members.filter((u) => u.createdAt && new Date(u.createdAt).getMonth() === now.getMonth() && new Date(u.createdAt).getFullYear() === now.getFullYear()).length,
  };
  const sort = url.searchParams.get("sort"); // "recent" (défaut) | "ancien" | "nom"

  let rows = all;
  if (role) rows = rows.filter((u) => u.role === role);
  if (status) rows = rows.filter((u) => u.status === status);
  if (q) rows = rows.filter((u) => (u.name + " " + u.email + " " + u.subscriberNo).toLowerCase().includes(q));
  rows = rows.sort(
    sort === "ancien" ? (a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")
    : sort === "nom" ? (a, b) => (a.name || a.email).localeCompare(b.name || b.email, "fr")
    : (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")
  );
  const total = rows.length;
  const start = (page - 1) * size;
  const items = rows.slice(start, start + size).map(pub);
  return NextResponse.json({ items, total, page, size, pages: Math.max(1, Math.ceil(total / size)), stats });
}

export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const { email, name, role, plan, status } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "E-mail requis." }, { status: 400 });
  if (await getUserByEmail(email)) return NextResponse.json({ error: "Cet e-mail existe déjà." }, { status: 409 });
  const tempPassword = crypto.randomBytes(5).toString("hex"); // 10 caractères
  const passwordHash = await hashPassword(tempPassword);
  const isActive = status === "active";
  const now = new Date();
  const u = await createUser({
    email, passwordHash, name: name || "", address: "",
    role: role === "admin" ? "admin" : "user",
    plan: plan === "mensuel" || plan === "annuel" ? plan : null,
    status: isActive ? "active" : "inactive",
    currentPeriodEnd: isActive ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString() : null,
    paymentMethod: isActive ? "Créé par l'admin" : undefined,
  });
  if (isActive && u.plan) {
    const pack = await getPack(u.plan);
    await createInvoice(u, pack?.price ?? 0, u.plan, "paye");
  }
  await addLog(admin.email, "Membre créé", `${u.email}${isActive ? " (actif)" : ""}`);
  return NextResponse.json({ ok: true, id: u.id, tempPassword });
});
