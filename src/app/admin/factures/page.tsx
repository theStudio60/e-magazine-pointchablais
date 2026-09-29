"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";

type Inv = { id: string; number: string; userName: string; userEmail: string; amount: number; plan: string; status: string; date: string };

export default function Factures() {
  const [rows, setRows] = useState<Inv[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
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
  return (
    <>
      <h1 className="t">Factures</h1>
      <p className="sub">{rows.length} facture(s) — total encaissé : CHF {total.toFixed(2)}</p>
      {err && <div className="msg err">{err}</div>}
      <div className="toolbar">
        <input className="grow" type="text" placeholder="Rechercher (n°, nom, e-mail)…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 340 }} />
      </div>
      <div className="card">
        <table>
          <thead><tr><th>N° facture</th><th>Client</th><th>Formule</th><th>Montant</th><th>Date</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><b>{r.number}</b></td>
                <td>{r.userName}<br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{r.userEmail}</span></td>
                <td style={{ textTransform: "capitalize" }}>{r.plan}</td>
                <td>CHF {(r.amount / 100).toFixed(2)}</td>
                <td>{fmt(r.date)}</td>
                <td><span className={"pill " + (r.status === "paye" ? "a" : "w")}>{r.status === "paye" ? "Payé" : "En attente"}</span></td>
                <td><button className="btn btn-o" onClick={() => toggle(r.id, r.status)}>{r.status === "paye" ? "Marquer en attente" : "Marquer payé"}</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ color: "var(--muted)" }}>Aucune facture.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
