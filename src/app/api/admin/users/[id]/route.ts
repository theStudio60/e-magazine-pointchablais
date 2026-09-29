import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { updateUser, deleteUser, getUserById, getPack, createInvoice, addLog } from "@/lib/db";

export const runtime = "nodejs";

export const PATCH = safe(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const { id } = await ctx.params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.status === "active" || body.status === "inactive") patch.status = body.status;
  if (body.plan === "mensuel" || body.plan === "annuel" || body.plan === null) patch.plan = body.plan;
  if (body.role === "admin" || body.role === "user") patch.role = body.role;
  if (typeof body.name === "string") patch.name = body.name;

  const willActivate = patch.status === "active" && target.status !== "active";
  if (willActivate) {
    const d = new Date();
    patch.currentPeriodEnd = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()).toISOString();
    patch.paymentMethod = "Activé par l'admin";
  }
  const u = await updateUser(id, patch);
  if (u && willActivate) {
    const pack = await getPack(u.plan || "annuel");
    await createInvoice(u, pack?.price ?? 0, u.plan || "annuel", "paye");
  }
  await addLog(admin.email, "Membre modifié", `${target.email} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ ok: true });
});

export const DELETE = safe(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const { id } = await ctx.params;
  if (id === admin.id) return NextResponse.json({ error: "Impossible de se supprimer soi-même." }, { status: 400 });
  const target = await getUserById(id);
  await deleteUser(id);
  await addLog(admin.email, "Membre supprimé", target?.email || id);
  return NextResponse.json({ ok: true });
});
