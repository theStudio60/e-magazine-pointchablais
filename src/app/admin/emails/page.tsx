"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";

type Em = { id: string; ts: string; from: string; subject: string; audience: string; count: number; status: string };

export default function Emails() {
  const [rows, setRows] = useState<Em[]>([]);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/emails"); if (r.ok) setRows((await r.json()).emails);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const r = await postJson("/api/admin/emails", { subject: f.get("subject"), body: f.get("body"), audience: f.get("audience") });
    const d = r.data;
    if (r.ok) {
      setMsg({ t: d.smtp ? `E-mail envoyé à ${d.email.count} destinataire(s).` : `Campagne enregistrée (${d.email.count} destinataires). Aucun SMTP configuré : brancher un service e-mail en production.`, ok: true });
      form.reset(); load();
    } else setMsg({ t: r.error, ok: false });
  }
  const fmt = (iso: string) => new Date(iso).toLocaleString("fr-CH");
  return (
    <>
      <h1 className="t">Emails</h1>
      <p className="sub">Envoyez une annonce à vos abonnés (nouveau numéro, information…).</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <div className="card">
        <h2>Nouvelle campagne</h2>
        <form onSubmit={send}>
          <div className="field"><label>Destinataires</label>
            <select name="audience" style={{ maxWidth: 260 }}><option value="tous">Tous les abonnés</option><option value="actifs">Abonnés actifs seulement</option></select>
          </div>
          <div className="field"><label>Sujet</label><input name="subject" type="text" required /></div>
          <div className="field"><label>Message</label><textarea name="body" rows={5} required></textarea></div>
          <button className="btn btn-b" type="submit">Envoyer</button>
        </form>
      </div>
      <div className="card">
        <h2>Historique</h2>
        <table>
          <thead><tr><th>Date</th><th>Sujet</th><th>Destinataires</th><th>Statut</th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}><td>{fmt(m.ts)}</td><td>{m.subject}</td><td>{m.audience} ({m.count})</td>
                <td><span className={"pill " + (m.status === "envoye" ? "a" : "w")}>{m.status === "envoye" ? "Envoyé" : "En file"}</span></td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>Aucune campagne.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
