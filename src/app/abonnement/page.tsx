import { ESPACE_CSS } from "@/lib/styles";
import { getSessionUserId } from "@/lib/auth";
import { getUserById, getSettings } from "@/lib/db";
import { redirect } from "next/navigation";
import LogoutButton from "../espace/logout-button";
import PayButton from "./pay-button";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CSS = `
  .recap{max-width:560px;margin:0 auto}
  .recap .line{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid var(--line);font-size:15px}
  .recap .line:first-of-type{border-top:0}
  .recap .k{color:var(--muted)}
  .recap .v{font-weight:600;color:var(--ink)}
  .recap .total{font-size:20px;color:var(--blue-ink)}
  .recap .note{color:var(--muted);font-size:13px;margin:6px 0 0}
  .cgv{display:flex;gap:10px;align-items:flex-start;margin:22px 0 6px;font-size:14px;color:var(--ink)}
  .cgv input{margin-top:3px;width:17px;height:17px;accent-color:var(--blue)}
  .cgv a{color:var(--blue);text-decoration:underline}
`;

export default async function Abonnement({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const uid = await getSessionUserId();
  if (!uid) redirect("/connexion?next=/abonnement");
  const user = await getUserById(uid);
  if (!user) redirect("/connexion?next=/abonnement");
  if (user.role === "admin") redirect("/admin");
  if (user.status === "active") redirect("/espace");

  const settings = await getSettings();
  const key = sp?.plan === "mensuel" ? "mensuel" : "annuel";
  const pack = settings.packs.find((p) => p.key === key && p.active) || settings.packs.find((p) => p.active);
  if (!pack) redirect("/espace");

  const prix = (pack.price / 100).toFixed(2);
  const par = pack.interval === "year" ? "an" : "mois";

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: ESPACE_CSS + CSS }} />

      <header>
        <div className="wrap head">
          <img src="/logo.png" alt="Le Point Chablais" />
          <div className="r">
            <a className="out" href="/espace">Mon espace</a>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="page-title">
        <h1>Finaliser votre abonnement</h1>
        <p>Vérifiez votre commande avant le paiement sécurisé.</p>
      </div>

      <section className="blk">
        <div className="wrap">
          <div className="panel recap">
            <div className="line"><span className="k">Formule</span><span className="v">Abonnement {pack.name.toLowerCase()} (numérique)</span></div>
            <div className="line"><span className="k">Facturation</span><span className="v">Par {par}, renouvelé automatiquement</span></div>
            <div className="line"><span className="k">Abonné</span><span className="v">{user.name || user.email}</span></div>
            <div className="line"><span className="k total">Total</span><span className="v total">CHF {prix} / {par}</span></div>
            <p className="note">Sans engagement : résiliable à tout moment depuis votre espace. La résiliation prend effet à la fin de la période payée.</p>

            <PayButton plan={pack.key} />
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="links"><a href="/conditions-vente">Conditions de vente</a> · <a href="/conditions-abonnement">Conditions d&apos;abonnement</a> · <a href="/confidentialite">Politique de confidentialité</a></div>
        </div>
      </footer>
    </main>
  );
}