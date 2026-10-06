"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "@/lib/admin-fetch";
import { useConfirm } from "../confirm";

type Ed = { id: string; date: string; title: string; publishAt?: string | null };

export default function Numeros() {
  const [eds, setEds] = useState<Ed[]>([]);
  const { confirm, confirmDialog } = useConfirm();
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false); // verrou synchrone anti-doublon
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/editions");
    if (r.ok) setEds((await r.json()).editions);
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 4000); }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current) return; // verrou immédiat (le state React arrive trop tard)
    sending.current = true;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    setMsg({ t: "Envoi et préparation du numéro en cours…", ok: true });
    const r = await call("/api/admin/editions", { method: "POST", body: fd });
    setBusy(false);
    sending.current = false;
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
    const r = await call(`/api/admin/editions?id=${ed.id}`, { method: "DELETE" });
    if (r.ok) { flash("Numéro supprimé."); load(); } else flash(r.error, false);
  }

  return (
    <>
      <h1 className="t">Numéros (E-paper)</h1>
      <p className="sub">Gérez les éditions PDF proposées aux abonnés.</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}

      <div className="card">
        <h2>Ajouter un numéro</h2>
        <form onSubmit={add}>
          <div className="grid2">
            <div className="field"><label>Période (ex. Octobre 2026) *</label><input name="date" type="text" required disabled={busy} /></div>
            <div className="field"><label>Titre</label><input name="title" type="text" defaultValue="Le Point Chablais" disabled={busy} /></div>
            <div className="field"><label>Date de sortie (optionnel)</label><input name="publishAt" type="date" disabled={busy} /></div>
            <div className="field"><label>Fichier PDF *</label><input name="pdf" type="file" accept="application/pdf" required disabled={busy} /></div>
            <div className="field"><label>Couverture (image, optionnel)</label><input name="cover" type="file" accept="image/*" disabled={busy} /></div>
          </div>
          <button className="btn btn-b" type="submit" disabled={busy}>
            {busy ? "Envoi en cours…" : "Ajouter le numéro"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Numéros en ligne ({eds.length})</h2>
        {eds.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Aucun numéro pour le moment.</p>
        ) : (
          <div className="eds">
            {eds.map((e) => (
              <div className="edc" key={e.id}>
                <img src={`/api/cover/${e.id}`} alt={`Couverture ${e.date}`} />
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
        )}
      </div>
      {confirmDialog}
    </>
  );
}