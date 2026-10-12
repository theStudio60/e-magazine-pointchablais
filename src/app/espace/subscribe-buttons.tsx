"use client";

import { useEffect, useState } from "react";

export default function SubscribeButtons({
  prixMensuel = "5",
  prixAnnuel = "49",
}: {
  prixMensuel?: string;
  prixAnnuel?: string;
}) {
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

  function subscribe(plan: "mensuel" | "annuel") {
    setLoading(plan);
    window.location.href = `/abonnement?plan=${plan}`;
  }

  return (
    <div>
      <div className="offers">
        <div className="offer">
          <div className="on">Mensuel</div>
          <div className="op"><b>CHF {prixMensuel}.–</b> / mois</div>
          <button className="btn btn-blue" onClick={() => subscribe("mensuel")} disabled={loading !== null}>
            {loading === "mensuel" ? "…" : "Choisir le mensuel"}
          </button>
        </div>
        <div className="offer feat">
          <span className="tag">Recommandé</span>
          <div className="on">Annuel</div>
          <div className="op"><b>CHF {prixAnnuel}.–</b> / an</div>
          <button className="btn btn-mauve" onClick={() => subscribe("annuel")} disabled={loading !== null}>
            {loading === "annuel" ? "…" : "Choisir l'annuel"}
          </button>
        </div>
      </div>
    </div>
  );
}