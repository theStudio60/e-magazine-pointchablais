import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { getSettings, updatePacks, updateSite, addLog, type Pack } from "@/lib/db";

export const runtime = "nodejs";

// Domaine complet obligatoire (refuse test@example).
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()./-]{6,20}$/;
const URL_RE = /^https?:\/\/\S+\.\S+/;

// Champs du site acceptés, avec leur longueur maximale.
const SITE_FIELDS: Record<string, number> = {
  contactEmail: 200,
  phone: 30,
  address: 300,
  heroTitle: 200,
  facebook: 300,
  instagram: 300,
  linkedin: 300,
  legalNotice: 20000,
};

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  return NextResponse.json({ settings: await getSettings() });
}

export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body.packs)) {
    // Garde-fou : jamais de liste vide (le site n'aurait plus aucune formule à proposer).
    if (body.packs.length === 0) {
      return NextResponse.json({ error: "Il faut garder au moins un pack." }, { status: 400 });
    }

    const packs: Pack[] = [];
    const seen = new Set<string>();
    for (const p of body.packs as (Pack & { description?: unknown; features?: unknown })[]) {
      const key = String(p.key ?? "").trim();
      const name = String(p.name || key).trim();
      const price = Math.round(Number(p.price) * 100);
      if (!key) return NextResponse.json({ error: "Clé de pack manquante." }, { status: 400 });
      if (!name) return NextResponse.json({ error: "Chaque pack doit avoir un nom." }, { status: 400 });
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: `Prix invalide pour « ${name} ».` }, { status: 400 });
      }
      if (seen.has(key)) return NextResponse.json({ error: `Clé en double : « ${key} ».` }, { status: 400 });
      seen.add(key);
      // Description courte et liste d'avantages (une ligne = un avantage).
      const features = Array.isArray(p.features)
        ? (p.features as unknown[]).map((f) => str(f, 120)).filter(Boolean).slice(0, 12)
        : [];
      packs.push({
        key,
        name,
        interval: p.interval === "year" ? "year" : "month",
        price,
        active: !!p.active,
        recommended: !!p.recommended,
        description: str(p.description, 200),
        features,
      } as Pack);
    }

    await updatePacks(packs);
    await addLog(admin.email, "Tarifs/packs mis à jour", packs.map((p) => `${p.name}:${p.price / 100}`).join(", "));
  }

  if (body.site && typeof body.site === "object") {
    const s = body.site as Record<string, unknown>;
    // On ne retient que les champs connus, nettoyés ; un champ absent n'est pas touché.
    const site: Record<string, string> = {};
    for (const [k, max] of Object.entries(SITE_FIELDS)) if (k in s) site[k] = str(s[k], max);

    if ("contactEmail" in site) {
      if (!site.contactEmail) return NextResponse.json({ error: "L'e-mail de contact est obligatoire." }, { status: 400 });
      if (!EMAIL_RE.test(site.contactEmail)) {
        return NextResponse.json({ error: "L'e-mail de contact est invalide : indiquez un domaine complet (exemple : contact@exemple.ch)." }, { status: 400 });
      }
    }
    if (site.phone && !PHONE_RE.test(site.phone)) {
      return NextResponse.json({ error: "Le numéro de téléphone est invalide (exemple : +41 24 123 45 67)." }, { status: 400 });
    }
    for (const [k, label] of [["facebook", "Facebook"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"]] as const) {
      if (site[k] && !URL_RE.test(site[k])) {
        return NextResponse.json({ error: `Le lien ${label} doit commencer par https://.` }, { status: 400 });
      }
    }

    await updateSite(site as Parameters<typeof updateSite>[0]);
    await addLog(admin.email, "Paramètres du site mis à jour", "");
  }
  return NextResponse.json({ ok: true, settings: await getSettings() });
});