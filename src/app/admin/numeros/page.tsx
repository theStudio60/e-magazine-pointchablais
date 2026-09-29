"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";
import { useConfirm } from "../confirm";

type Ed = { id: string; date: string; title: string; publishAt?: string | null };

export default function Numeros() {
  const [eds, setEds] = useState<Ed[]>([]);
  const { confirm, confirmDialog } = useConfirm();
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/editions"); if (r.ok) setEds((await r.json()).editions);
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 3500); }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const r = await call("/api/admin/editions", { method: "POST", body: fd });
    if (r.ok) { flash("Numéro ajouté."); form.reset(); load(); }
    else flash(r.error, false);
  }
  async function del(ed: Ed) {
    const ok = await confirm({
      title: "Supprimer ce numéro ?",
      message: <><b>{ed.title} — {ed.date}</b> et son PDF seront supprimés définitivement.</>,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const id = ed.id;
    const r = await call(`/api/admin/editions?id=${id}`, { method: "DELETE" });
    if (r.ok) { flash("Numéro supprimé."); load(); } else flash(r.error, false);
  }

  return (
    <>
      <h1 className="t">Numéros (E-paper)</h1>
      <p className="sub">Gérez les éditions PDF proposées aux abonnés.</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <div className="card">
        <h2>Numéros en ligne ({eds.length})</h2>
        <div className="eds">
          {eds.map((e) => (
            <div className="edc" key={e.id}>
              <img src={`/api/cover/${e.id}`} alt="" />
              <div className="b">
                <div style={{ fontWeight: 600, color: "var(--blue-ink)", fontSize: 13.5 }}>{e.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>{e.date}{e.publishAt ? ` · sortie ${e.publishAt}` : ""}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <a className="btn btn-o" href={`/lire/${e.id}`} target="_blank" rel="noreferrer">Aperçu</a>
                  <button className="btn btn-d" onClick={() => del(e)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Ajouter un numéro</h2>
        <form onSubmit={add}>
          <div className="grid2">
            <div className="field"><label>Période (ex. Octobre 2026) *</label><input name="date" type="text" required /></div>
            <div className="field"><label>Titre</label><input name="title" type="text" defaultValue="Le Point Chablais" /></div>
            <div className="field"><label>Date de sortie (optionnel)</label><input name="publishAt" type="date" /></div>
            <div className="field"><label>Fichier PDF *</label><input name="pdf" type="file" accept="application/pdf" required /></div>
            <div className="field"><label>Couverture (image, optionnel)</label><input name="cover" type="file" accept="image/*" /></div>
          </div>
          <button className="btn btn-b" type="submit">Ajouter le numéro</button>
        </form>
      </div>
      {confirmDialog}
    </>
  );
}