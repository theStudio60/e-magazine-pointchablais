import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { updateInvoice, addLog } from "@/lib/db";

export const runtime = "nodejs";

export const PATCH = safe(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = body.status === "paye" || body.status === "en_attente" ? body.status : undefined;
  if (!status) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  const inv = await updateInvoice(id, { status });
  if (!inv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await addLog(admin.email, "Facture mise à jour", `${inv.number} → ${status}`);
  return NextResponse.json({ ok: true });
});
