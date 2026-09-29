import { ESPACE_CSS } from "@/lib/styles";
import { getSessionUserId } from "@/lib/auth";
import { getUserById, updateUser, getSettings, getPack, recordStripeInvoice } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { redirect } from "next/navigation";
import LogoutButton from "./logout-button";
import SubscribeButtons from "./subscribe-buttons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXTRA_CSS = `
  .paid-ok{display:flex;gap:14px;align-items:flex-start;background:#e9f7ef;border:1px solid #b7e3c6;color:#14663a;border-radius:14px;padding:16px 18px;margin:0 0 26px;font-size:14.5px;line-height:1.5}
  .paid-ok .ico{flex:0 0 26px;width:26px;height:26px;border-radius:50%;background:#1f9d55;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700}
  .offers{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:560px}
  @media(max-width:560px){.offers{grid-template-columns:1fr}}
  .offer{position:relative;border:1px solid var(--line);border-radius:14px;padding:22px 20px;text-align:center;background:#fbfcfc}
  .offer.feat{border:1.5px solid var(--mauve)}
  .offer .on{font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-size:13px;margin-bottom:6px}
  .offer .op{color:var(--blue-ink);margin-bottom:16px;font-size:15px}
  .offer .op b{font-size:26px}
  .offer .btn{width:100%}
  .btn-mauve{background:var(--mauve);color:#fff}.btn-mauve:hover{background:var(--mauve-deep)}
  .offer .tag{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--mauve);color:#fff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:5px 12px;border-radius:999px}
  .pays{align-items:center}
  .pay{height:32px;padding:6px 9px;display:inline-flex;align-items:center;gap:6px}
  .pay img{height:20px;width:auto;display:block}
  .head .r .btn,.head .out{white-space:nowrap}
  @media(max-width:620px){
    .head{flex-direction:column;gap:12px;padding-block:12px}
    .head img{height:34px}
    .head .r{width:100%;justify-content:center;gap:clamp(10px,4vw,18px);font-size:13.5px}
    .head .r .btn{padding:8px 16px;font-size:13px}
  }
`;

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-CH");
  } catch {
    return "—";
  }
}

export default async function Espace({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const uid = await getSessionUserId();
  if (!uid) redirect("/connexion?next=/espace");
  let user = await getUserById(uid);
  if (!user) redirect("/connexion?next=/espace");
  if (user.role === "admin") redirect("/admin");

  // Retour d'un paiement Stripe (test/live) : on synchronise le statut
  // directement depuis Stripe, sans dépendre du webhook (utile en local).
  let justPaid = false;
  if (sp?.ok && stripeEnabled && stripe && user.stripeCustomerId && (user.status !== "active" || !user.currentPeriodEnd)) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 1,
      });
      const sub = subs.data[0];
      if (sub && (sub.status === "active" || sub.status === "trialing")) {
        // Nouvelle API Stripe : la fin de période est sur l'item, plus sur la subscription.
        const periodEnd =
          sub.items?.data?.[0]?.current_period_end ??
          (sub as unknown as { current_period_end?: number }).current_period_end ??
          null;
        const plan = (sub.metadata?.plan as "mensuel" | "annuel") || user.plan || "annuel";
        await updateUser(user.id, {
          status: "active",
          plan,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : user.currentPeriodEnd,
          stripeSubscriptionId: sub.id,
          paymentMethod: "Stripe (test)",
        });
        // Facture liée à l'id Stripe : jamais de doublon avec le webhook.
        const invId = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;
        if (invId) {
          const pack = await getPack(plan);
          await recordStripeInvoice({ stripeInvoiceId: invId, user, amount: pack?.price ?? 0, plan, status: "paye" });
        }
        user = (await getUserById(uid))!;
        justPaid = true;
      }
    } catch {
      // silencieux : on affiche l'espace tel quel
    }
  }
  const showPaid = justPaid || (sp?.ok === "1" && user.status === "active") || sp?.sim === "1";

  const active = user.status === "active";
  const settings = await getSettings();
  const editions = settings.editions;
  const prixMensuel = String(Math.round((settings.packs.find((p) => p.key === "mensuel")?.price ?? 500) / 100));
  const prixAnnuel = String(Math.round((settings.packs.find((p) => p.key === "annuel")?.price ?? 4900) / 100));

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: ESPACE_CSS + EXTRA_CSS }} />

      <header>
        <div className="wrap head">
                    <a href="/espace" aria-label="Accueil de mon espace" style={{ display: "flex" }}><img src="/logo.png" alt="Le Point Chablais" /></a>
          <div className="r">
            {active && <a className="btn btn-blue" href="#editions">E-paper</a>}
            <a className="out" href="/compte">Mon compte</a>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="page-title">
        <h1>Bonjour 👋</h1>
        <p>Bienvenue dans votre espace abonné du Point Chablais.</p>
      </div>

      {showPaid && (
        <div className="wrap">
          <div className="paid-ok">
            <span className="ico">✓</span>
            <div>
              <b>Paiement confirmé, merci !</b> Votre abonnement est actif. Une facture est disponible et vous avez maintenant accès à tous les numéros ci-dessous.
            </div>
          </div>
        </div>
      )}

      <section className="blk">
        <div className="wrap">
          <h2 className="sec">Mon compte abonné</h2>
          <div className="rule"></div>
          <div className="panel account">
            <div>
              <p className="num">ABONNÉ N° : {user.subscriberNo}</p>
              <div className="coord">
                <span>{user.name || "—"}</span>
                <span>{user.address || "—"}</span>
                <span>{user.email}</span>
              </div>
            </div>
            <div className="actions">
              <a className="act-tile" href="/compte">
                <div className="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8M5 10v10h14V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                <span>Déménagement</span>
              </a>
              <a className="act-tile" href="/compte">
                <div className="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.7" /></svg></div>
                <span>Changement de login</span>
              </a>
              <a className="act-tile" href="/compte">
                <div className="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /><path d="M12.5 12H21l-2 2 2 2-3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                <span>Changement de mot de passe</span>
              </a>
            </div>
          </div>

          <h2 className="sec">Mon abonnement</h2>
          <div className="rule"></div>

          {active ? (
            <div className="panel">
              <p className="subtype">
                Abonnement {user.plan === "mensuel" ? "mensuel" : "annuel"} (numérique)
                <span className="chip"><span className="dot"></span>Actif</span>
              </p>
              <div className="subrow"><span className="k">Date de fin d&apos;abonnement</span><span className="v">{fmt(user.currentPeriodEnd)}</span></div>
              <div className="subrow"><span className="k">Méthode de paiement</span><span className="v">{user.paymentMethod || "—"}</span></div>
              <div className="subrow"><span className="k">Abonnement payé jusqu&apos;au</span><span className="v">{fmt(user.currentPeriodEnd)}</span></div>
            </div>
          ) : (
            <div className="panel">
              <p className="subtype">Aucun abonnement actif</p>
              <p style={{ color: "var(--muted)", fontSize: 14.5, margin: "0 0 20px" }}>
                Choisissez une formule pour accéder à toutes les éditions numériques.
              </p>
              <SubscribeButtons prixMensuel={prixMensuel} prixAnnuel={prixAnnuel} />
            </div>
          )}

          {active && (
            <div className="panel lib" id="editions">
              <div className="head-row">
                <h3>Mes éditions (E-paper)</h3>
                <span className="hint">Cliquez sur un numéro pour l&apos;ouvrir dans la liseuse.</span>
              </div>
              <div className="grid">
                {editions.map((e) => (
                  <div className="ed" key={e.id}>
                                        <a className="cov" href={`/lire/${e.id}`} style={{ display: "block" }}><img src={`/api/cover/${e.id}`} alt="" /></a>
                    <div className="body">
                      <div className="t">{e.title}</div>
                      <div className="d">{e.date}</div>
                      <div className="act">
                        <a className="btn btn-blue" href={`/lire/${e.id}`}>Lire le numéro</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="links"><a href="/conditions-vente">Conditions de vente</a> · <a href="/conditions-abonnement">Conditions d&apos;abonnement</a> · <a href="/confidentialite">Politique de confidentialité</a></div>
           <div className="pays"><span className="pay"><img src="/pay/visa.svg" alt="Visa" /></span><span className="pay"><img src="/pay/mastercard.webp" alt="Mastercard" /></span><span className="pay"><img src="/pay/twint.png" alt="TWINT" /></span></div>
        </div>
      </footer>
    </main>
  );
}