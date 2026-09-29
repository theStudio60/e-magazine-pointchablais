"use client";

import { useState } from "react";

export default function SubscribeButtons({
  prixMensuel = "5",
  prixAnnuel = "49",
}: {
  prixMensuel?: string;
  prixAnnuel?: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);

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