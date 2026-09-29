"use client";

import { useEffect, useState } from "react";

type Log = { id: string; ts: string; actor: string; action: string; detail: string };

export default function Logs() {
  const [rows, setRows] = useState<Log[]>([]);
  useEffect(() => { fetch("/api/admin/logs").then((r) => r.json()).then((d) => setRows(d.logs)).catch(() => {}); }, []);
  const fmt = (iso: string) => new Date(iso).toLocaleString("fr-CH");
  return (
    <>
      <h1 className="t">Logs d&apos;activité</h1>
      <p className="sub">Historique des actions (création, activation, tarifs, numéros, factures…).</p>
      <div className="card">
        <table>
          <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détail</th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}><td style={{ whiteSpace: "nowrap" }}>{fmt(l.ts)}</td><td>{l.actor}</td><td><b>{l.action}</b></td><td style={{ color: "var(--muted)" }}>{l.detail}</td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>Aucune activité.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
