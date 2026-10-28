import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { listUsers, createUser, getUserByEmail, updateUser, addLog, getPack, createInvoice, type User } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { smtpEnabled, sendMail, appUrl } from "@/lib/mailer";
import crypto from "crypto";

export const runtime = "nodejs";

function pub(u: User) {
  return {
    id: u.id, email: u.email, name: u.name, subscriberNo: u.subscriberNo,
    role: u.role, plan: u.plan, status: u.status, currentPeriodEnd: u.currentPeriodEnd, createdAt: u.createdAt,
    blocked: !!u.blocked,
  };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const role = url.searchParams.get("role"); // "admin" pour la page Administrateurs ; sinon : membres uniquement
  const status = url.searchParams.get("status"); // "active" | "inactive" | null
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const size = Math.min(100, Math.max(5, Number(url.searchParams.get("size") || 10)));

  const all = await listUsers();
  const members = all.filter((u) => u.role !== "admin");
  const admins = all.filter((u) => u.role === "admin");

  // Les cartes du haut comptent les membres uniquement.
  const now = new Date();
  const stats = {
    total: members.length,
    actifs: members.filter((u) => u.status === "active").length,
    inactifs: members.filter((u) => u.status !== "active").length,
    nouveaux: members.filter((u) => u.createdAt && new Date(u.createdAt).getMonth() === now.getMonth() && new Date(u.createdAt).getFullYear() === now.getFullYear()).length,
  };
  const sort = url.searchParams.get("sort"); // "recent" (défaut) | "ancien" | "nom"

  // Le tableau part de la même base que les cartes : les admins n'y figurent plus,
  // sauf si la page Administrateurs les demande explicitement (role=admin).
  let rows = role === "admin" ? admins : members;
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
  // "me" : identifiant de l'admin connecté (la page Administrateurs désactive son propre bouton « Retirer admin »).
  return NextResponse.json({ items, total, page, size, pages: Math.max(1, Math.ceil(total / size)), stats, me: admin.id });
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

  // Nouvel administrateur : on lui envoie un e-mail pour choisir lui-même son mot de passe
  // (même page /reinitialiser que « Mot de passe oublié »). Lien valable 48 h.
  let emailSent = false;
  if (u.role === "admin" && smtpEnabled) {
    const token = crypto.randomUUID().replace(/-/g, "");
    await updateUser(u.id, { resetToken: token, resetExpires: Date.now() + 48 * 3600_000 });
    const resetUrl = `${appUrl(new URL(req.url).origin)}/reinitialiser?token=${token}`;
    const html =
      `<p>Bonjour${u.name ? " " + esc(u.name) : ""},</p>` +
      `<p>Un accès administrateur au back-office du Point Chablais vient d'être créé pour vous (${esc(u.email)}).</p>` +
      `<p><a href="${resetUrl}">Choisir mon mot de passe</a></p>` +
      `<p>Ce lien est valable 48 heures. Si vous n'attendiez pas ce message, ignorez-le.</p>` +
      `<p>Le Point Chablais</p>`;
    emailSent = !!(await sendMail(u.email, "Votre accès administrateur – Le Point Chablais", html));
  }

  await addLog(admin.email, "Membre créé", `${u.email}${isActive ? " (actif)" : ""}${u.role === "admin" ? (emailSent ? " (admin, e-mail envoyé)" : " (admin)") : ""}`);
  // Le mot de passe temporaire n'est renvoyé que si l'e-mail n'a pas pu partir (ou pour un membre).
  return NextResponse.json({ ok: true, id: u.id, emailSent, ...(emailSent ? {} : { tempPassword }) });
});