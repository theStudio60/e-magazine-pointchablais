"use client";

import { useEffect, useState } from "react";
import { StatCard, initials } from "./icons";

type Overview = {
  stats: { totalMembres: number; actifs: number; revenuTotal: number; mrr: number; enAttente: number; numeros: number };
  recentMembres: { name: string; email: string; createdAt?: string; status: string }[];
  recentInvoices: { id: string; number: string; userName: string; amount: number; status: string; date: string }[];
};

export default function Dashboard() {
  const [d, setD] = useState<Overview | null>(null);
  useEffect(() => { fetch("/api/admin/overview").then((r) => r.json()).then(setD).catch(() => {}); }, []);
  const s = d?.stats;
  const fmtd = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("fr-CH") : "—");

  return (
    <>
      <h1 className="t">Tableau de bord</h1>
      <p className="sub">Voici un aperçu de votre plateforme.</p>

      <div className="stats">
        <StatCard icon="users" color="blue" value={s?.totalMembres ?? "—"} label="Total membres" />
        <StatCard icon="card" color="green" value={s?.actifs ?? "—"} label="Abonnements actifs" />
        <StatCard icon="cash" color="purple" value={s ? "CHF " + s.revenuTotal.toFixed(0) : "—"} label="Revenu encaissé" />
        <StatCard icon="clock" color="orange" value={s?.enAttente ?? "—"} label="Paiements en attente" />
      </div>

      <div className="cols">
        <div className="card">
          <h2>Membres récents</h2>
          <div className="list">
            {d?.recentMembres.length ? d.recentMembres.map((m, i) => (
              <div className="it" key={i}>
                <div className="who"><span className="mav">{initials(m.name || m.email)}</span><div><b>{m.name || "—"}</b><br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{m.email}</span></div></div>
                <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{fmtd(m.createdAt)}</span>
              </div>
            )) : <p style={{ color: "var(--muted)", fontSize: 14 }}>Aucun membre.</p>}
          </div>
        </div>
        <div className="card">
          <h2>Activité récente (factures)</h2>
          <div className="list">
            {d?.recentInvoices.length ? d.recentInvoices.map((f) => (
              <div className="it" key={f.id}>
                <div><b>{f.number}</b><br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{f.userName}</span></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>CHF {(f.amount / 100).toFixed(2)}</div>
                  <span className={"pill " + (f.status === "paye" ? "a" : "w")}>{f.status === "paye" ? "Payé" : "En attente"}</span>
                </div>
              </div>
            )) : <p style={{ color: "var(--muted)", fontSize: 14 }}>Aucune facture.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
