"use client";

import { useState } from "react";
import { useEffect } from "react";
import { Icon } from "../icons";

type Log = { id: string; ts: string; actor: string; action: string; detail: string };

const SIZE = 10;

const PG_CSS = `
.tfoot .pg button{color:var(--ink)}
.tfoot .pg button:disabled{color:var(--muted);opacity:.6;cursor:not-allowed}
.tfoot .pg button:hover:not(:disabled){background:var(--primary);color:#fff;border-color:var(--primary)}
.tfoot .pg button.on,.tfoot .pg button.on:hover{background:var(--primary);color:#fff;border-color:var(--primary)}
`;

export default function Logs() {
  const [rows, setRows] = useState<Log[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/logs").then((r) => r.json()).then((d) => setRows(d.logs || [])).catch(() => {});
  }, []);

  const fmt = (iso: string) => new Date(iso).toLocaleString("fr-CH");

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * SIZE, cur * SIZE);
  const from = total === 0 ? 0 : (cur - 1) * SIZE + 1;
  const to = Math.min(cur * SIZE, total);
  const first = Math.max(1, Math.min(cur - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PG_CSS }} />
      <h1 className="t">Logs d&apos;activité</h1>
      <p className="sub">Historique des actions (création, activation, tarifs, numéros, factures…).</p>
      <div className="card flush">
        <table>
          <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détail</th></tr></thead>
          <tbody>
            {slice.map((l) => (
              <tr key={l.id}><td style={{ whiteSpace: "nowrap" }}>{fmt(l.ts)}</td><td>{l.actor}</td><td><b>{l.action}</b></td><td style={{ color: "var(--muted)" }}>{l.detail}</td></tr>
            ))}
            {total === 0 && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>Aucune activité.</td></tr>}
          </tbody>
        </table>
        <div className="tfoot">
          <span>Affichage de <b style={{ color: "var(--ink)" }}>{from}</b> à <b style={{ color: "var(--ink)" }}>{to}</b> sur <b style={{ color: "var(--ink)" }}>{total}</b> action(s)</span>
          <div className="pg">
            <button disabled={cur <= 1} onClick={() => setPage(cur - 1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={14} /></span> Précédent</button>
            {nums.map((nmb) => <button key={nmb} className={nmb === cur ? "on" : ""} onClick={() => setPage(nmb)}>{nmb}</button>)}
            <button disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Suivant <Icon name="chevron" size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
}