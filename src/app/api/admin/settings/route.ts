import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { getSettings, updatePacks, updateSite, addLog, type Pack } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  return NextResponse.json({ settings: await getSettings() });
}

export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body.packs)) {
    const packs: Pack[] = body.packs.map((p: Pack) => ({
      key: String(p.key),
      name: String(p.name || p.key),
      interval: p.interval === "year" ? "year" : "month",
      price: Math.max(0, Math.round(Number(p.price) * 100)),
      active: !!p.active,
      recommended: !!p.recommended,
    }));
    await updatePacks(packs);
    await addLog(admin.email, "Tarifs/packs mis à jour", packs.map((p) => `${p.name}:${p.price / 100}`).join(", "));
  }
  if (body.site && typeof body.site === "object") {
    await updateSite(body.site);
    await addLog(admin.email, "Paramètres du site mis à jour", "");
  }
  return NextResponse.json({ ok: true, settings: await getSettings() });
});
