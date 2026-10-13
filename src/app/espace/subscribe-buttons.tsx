"use client";

import { useEffect, useState } from "react";

export type PackLite = {
  key: string;
  name: string;
  interval: "month" | "year";
  price: number; // centimes
  recommended?: boolean;
};

// 4900 -> "49.–" ; 450 -> "4.50"
const amount = (centimes: number) => (centimes % 100 === 0 ? `${centimes / 100}.–` : (centimes / 100).toFixed(2));

const label = (p: PackLite) =>
  p.key === "mensuel" ? "Choisir le mensuel" : p.key === "annuel" ? "Choisir l'annuel" : "Choisir cette formule";

export default function SubscribeButtons({ packs = [] }: { packs?: PackLite[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  // Quand on revient avec la flèche « Retour » du navigateur, la page est restaurée
  // depuis le cache (bfcache) avec le bouton encore en chargement : on remet l'état à zéro.
  useEffect(() => {
    function onShow(e: PageTransitionEvent) {
      if (e.persisted) setLoading(null);
    }
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  function subscribe(plan: string) {
    setLoading(plan);
    window.location.href = `/abonnement?plan=${encodeURIComponent(plan)}`;
  }

  if (packs.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: 14.5, margin: 0 }}>Aucune formule disponible pour le moment.</p>;
  }

  return (
    <div>
      <div className="offers">
        {packs.map((p) => (
          <div className={"offer" + (p.recommended ? " feat" : "")} key={p.key}>
            {p.recommended && <span className="tag">Recommandé</span>}
            <div className="on">{p.name}</div>
            <div className="op"><b>CHF {amount(p.price)}</b> / {p.interval === "year" ? "an" : "mois"}</div>
            <button
              className={"btn " + (p.recommended ? "btn-mauve" : "btn-blue")}
              onClick={() => subscribe(p.key)}
              disabled={loading !== null}
            >
              {loading === p.key ? "…" : label(p)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}