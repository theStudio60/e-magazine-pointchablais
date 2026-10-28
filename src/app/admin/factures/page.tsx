"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";
import { Icon } from "../icons";

type Inv = { id: string; number: string; userName: string; userEmail: string; amount: number; plan: string; status: string; date: string };

const SIZE = 10;

const PG_CSS = `
.tfoot .pg button{color:var(--ink)}
.tfoot .pg button:disabled{color:var(--muted);opacity:.6;cursor:not-allowed}
.tfoot .pg button:hover:not(:disabled){background:var(--primary);color:#fff;border-color:var(--primary)}
.tfoot .pg button.on,.tfoot .pg button.on:hover{background:var(--primary);color:#fff;border-color:var(--primary)}
`;

export default function Factures() {
  const [rows, setRows] = useState<Inv[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/invoices?q=" + encodeURIComponent(q));
    if (r.ok) setRows((await r.json()).invoices);
  }, [q]);
  useEffect(() => { load(); }, [load]);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-CH");

  async function toggle(id: string, status: string) {
    const r = await postJson(`/api/admin/invoices/${id}`, { status: status === "paye" ? "en_attente" : "paye" }, "PATCH");
    setErr(r.ok ? "" : r.error);
    load();
  }

  const total = rows.filter((r) => r.status === "paye").reduce((s, r) => s + r.amount, 0) / 100;

  // Pagination (côté page).
  const count = rows.length;
  const pages = Math.max(1, Math.ceil(count / SIZE));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * SIZE, cur * SIZE);
  const from = count === 0 ? 0 : (cur - 1) * SIZE + 1;
  const to = Math.min(cur * SIZE, count);
  const firstNum = Math.max(1, Math.min(cur - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => firstNum + i);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PG_CSS }} />
      <h1 className="t">Factures</h1>
      <p className="sub">{count} facture(s) — total encaissé : CHF {total.toFixed(2)}</p>
      {err && <div className="msg err">{err}</div>}
      <div className="toolbar">
        <input className="grow" type="text" placeholder="Rechercher (n°, nom, e-mail)…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} style={{ maxWidth: 340 }} />
      </div>
      <div className="card flush">
        <table>
          <thead><tr><th>N° facture</th><th>Client</th><th>Formule</th><th>Montant</th><th>Date</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id}>
                <td><b>{r.number}</b></td>
                <td>{r.userName}<br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{r.userEmail}</span></td>
                <td style={{ textTransform: "capitalize" }}>{r.plan}</td>
                <td>CHF {(r.amount / 100).toFixed(2)}</td>
                <td>{fmt(r.date)}</td>
                <td><span className={"pill " + (r.status === "paye" ? "a" : "w")}>{r.status === "paye" ? "Payé" : "En attente"}</span></td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <a className="btn btn-o" href={`/api/account/invoice/${r.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, padding: "7px 12px" }}>Télécharger</a>
                    <button className="btn btn-o" onClick={() => toggle(r.id, r.status)} style={{ fontSize: 13, padding: "7px 12px" }}>{r.status === "paye" ? "Marquer en attente" : "Marquer payé"}</button>
                  </div>
                </td>
              </tr>
            ))}
            {count === 0 && <tr><td colSpan={7} style={{ color: "var(--muted)" }}>Aucune facture.</td></tr>}
          </tbody>
        </table>
        <div className="tfoot">
          <span>Affichage de <b style={{ color: "var(--ink)" }}>{from}</b> à <b style={{ color: "var(--ink)" }}>{to}</b> sur <b style={{ color: "var(--ink)" }}>{count}</b> facture(s)</span>
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