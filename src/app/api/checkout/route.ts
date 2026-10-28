import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getUserById, updateUser, getPack, createInvoice, addLog } from "@/lib/db";
import { sendMail, mails, appUrl } from "@/lib/mailer";
import { stripe, stripeEnabled } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Adresse publique du site, utilisée pour le retour depuis Stripe.
// 1) la variable APP_URL (à définir en production), 2) sinon l'adresse réelle vue par le navigateur
// (en-têtes du proxy de l'hébergeur), 3) en dernier recours l'adresse de la requête.
function siteOrigin(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (host && /^(localhost|127\.)/.test(host) ? "http" : "https");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const user = await getUserById(uid);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  if (user.blocked) return NextResponse.json({ error: "Votre compte est suspendu. Contactez-nous pour le réactiver." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  // Le pack est lu dans la base : n'importe quelle clé de pack actif est acceptée.
  const key: string = typeof body?.plan === "string" && body.plan ? body.plan : "annuel";
  const pack = await getPack(key);
  if (!pack || !pack.active) return NextResponse.json({ error: "Offre indisponible." }, { status: 400 });
  const origin = appUrl(siteOrigin(req));

  if (stripeEnabled && stripe) {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const c = await stripe.customers.create({ email: user.email, name: user.name || undefined });
      customerId = c.id;
      await updateUser(user.id, { stripeCustomerId: customerId });
    }
    const line: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "chf",
        unit_amount: pack.price,
        recurring: { interval: pack.interval },
        product_data: { name: `Abonnement ${pack.name}- Le Point Chablais` },
      },
      quantity: 1,
    };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [line],
      success_url: `${origin}/espace?ok=1`,
      cancel_url: `${origin}/espace?canceled=1`,
      metadata: { uid: user.id, plan: key },
      subscription_data: { metadata: { uid: user.id, plan: key } },
    });
    return NextResponse.json({ url: session.url });
  }

  // Mode simulé (aucune clé Stripe) : active + facture "payée" (démo).
  const now = new Date();
  const end =
    pack.interval === "year"
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  await updateUser(user.id, {
    plan: key,
    status: "active",
    currentPeriodEnd: end.toISOString(),
    paymentMethod: "Simulé (démo)",
  });
  await createInvoice(user, pack.price, key, "paye");
  await addLog(user.email, "Abonnement", `Souscription ${pack.name} (simulé)`);
  const m = mails.paymentReceived(user.name, key, pack.price, end.toISOString(), `${origin}/espace`);
  await sendMail(user.email, m.subject, m.html);
  return NextResponse.json({ url: `${origin}/espace?sim=1` });
}