"use client";

import { useEffect, useState } from "react";
import { Icon, StatCard } from "../icons";

type Stats = { totalMembres: number; actifs: number; revenuTotal: number; mrr: number; enAttente: number; numeros: number };

export default function Rapports() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/admin/overview").then((r) => r.json()).then((d) => setS(d.stats)).catch(() => {}); }, []);
  const taux = s && s.totalMembres ? Math.round((s.actifs / s.totalMembres) * 100) : 0;
  return (
    <>
      <h1 className="t">Rapports</h1>
      <p className="sub">Synthèse de l&apos;activité et export des données.</p>
      <div className="stats">
        <StatCard icon="users" color="blue" value={s?.totalMembres ?? "—"} label="Membres" />
        <StatCard icon="userCheck" color="green" value={s?.actifs ?? "—"} label="Abonnés actifs" />
        <StatCard icon="chart" color="purple" value={taux + "%"} label="Taux d'abonnés actifs" />
        <StatCard icon="cash" color="orange" value={s ? "CHF " + s.mrr.toFixed(0) : "—"} label="Revenu mensuel récurrent (est.)" />
      </div>
      <div className="card">
        <h2>Exports</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 14px" }}>Téléchargez la liste des abonnés au format CSV (ouvrable dans Excel).</p>
        <a className="btn btn-b" href="/api/admin/export"><Icon name="download" size={17} /> Exporter les abonnés (CSV)</a>
      </div>
    </>
  );
}
