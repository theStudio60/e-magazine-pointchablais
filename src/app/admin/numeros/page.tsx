"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";
import { useConfirm } from "../confirm";
import { Icon } from "../icons";

type Ed = { id: string; date: string; title: string; publishAt?: string | null };
type MenuState = { ed: Ed; x: number; top?: number; bottom?: number };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function Numeros() {
  const [eds, setEds] = useState<Ed[]>([]);
  const { confirm, confirmDialog } = useConfirm();
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<MenuState | null>(null);

  const [editing, setEditing] = useState<Ed | null>(null);
  const [eDate, setEDate] = useState("");
  const [eTitle, setETitle] = useState("");
  const [ePublish, setEPublish] = useState("");
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/editions");
    if (r.ok) setEds((await r.json()).editions);
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 4000); }

  // Ferme le menu ⋮ (clic ailleurs, défilement, Échap).
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const shown = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return eds;
    return eds.filter((e) => norm(`${e.title} ${e.date} ${e.publishAt || ""}`).includes(needle));
  }, [eds, q]);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current) return;
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

  function startEdit(ed: Ed) {
    setEditing(ed);
    setEDate(ed.date);
    setETitle(ed.title);
    setEPublish((ed.publishAt || "").slice(0, 10));
  }
  useEffect(() => {
    if (editing) editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || saving) return;
    if (!eDate.trim()) return flash("Indiquez la période (ex. Octobre 2026).", false);
    setSaving(true);
    const r = await postJson(
      "/api/admin/editions",
      { id: editing.id, date: eDate.trim(), title: eTitle.trim() || "Le Point Chablais", publishAt: ePublish || null },
      "PATCH",
    );
    setSaving(false);
    if (r.ok) { flash("Numéro modifié."); setEditing(null); load(); }
    else flash(r.error, false);
  }

  async function del(ed: Ed) {
    const ok = await confirm({
      title: "Supprimer ce numéro ?",
      message: <><b>{ed.title} - {ed.date}</b> et son PDF seront supprimés définitivement.</>,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const r = await call(`/api/admin/editions?id=${ed.id}`, { method: "DELETE" });
    if (r.ok) {
      flash("Numéro supprimé.");
      if (editing?.id === ed.id) setEditing(null);
      load();
    } else flash(r.error, false);
  }

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, ed: Ed) {
    e.stopPropagation();
    if (menu?.ed.id === ed.id) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(8, Math.min(r.right - 180, window.innerWidth - 196));
    const flip = r.bottom + 180 > window.innerHeight;
    setMenu(flip ? { ed, x, bottom: window.innerHeight - r.top + 6 } : { ed, x, top: r.bottom + 6 });
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

      {editing && (
        <div className="card" ref={editRef}>
          <h2>Modifier le numéro</h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 14px" }}>
            Le PDF et la couverture restent inchangés. Pour les remplacer, supprimez le numéro puis ajoutez-le de nouveau.
          </p>
          <form onSubmit={saveEdit}>
            <div className="grid2">
              <div className="field"><label>Période (ex. Octobre 2026) *</label><input type="text" value={eDate} onChange={(e) => setEDate(e.target.value)} required disabled={saving} /></div>
              <div className="field"><label>Titre</label><input type="text" value={eTitle} onChange={(e) => setETitle(e.target.value)} disabled={saving} /></div>
              <div className="field"><label>Date de sortie (optionnel)</label><input type="date" value={ePublish} onChange={(e) => setEPublish(e.target.value)} disabled={saving} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-b" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button>
              <button className="btn btn-o" type="button" onClick={() => setEditing(null)} disabled={saving}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Numéros en ligne ({q.trim() ? `${shown.length} sur ${eds.length}` : eds.length})</h2>

        <div className="tools" style={{ marginBottom: 14 }}>
          <div className="sbox">
            <Icon name="search" size={17} />
            <input type="text" placeholder="Rechercher un numéro (période, titre)…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {eds.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Aucun numéro pour le moment.</p>
        ) : shown.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Aucun numéro ne correspond à « {q.trim()} ».</p>
        ) : (
          <div className="eds">
            {shown.map((e) => (
              <div className="edc" key={e.id}>
                <img src={`/api/cover/${e.id}`} alt={`Couverture ${e.date}`} />
                <div className="b">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--blue-ink)", fontSize: 13.5 }}>{e.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>{e.date}{e.publishAt ? ` · sortie ${e.publishAt}` : ""}</div>
                    </div>
                    <button className="kebab" aria-label="Actions" onClick={(ev) => openMenu(ev, e)}><Icon name="dots" size={20} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {menu && (
        <div className="menu" style={{ left: menu.x, top: menu.top, bottom: menu.bottom }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { const id = menu.ed.id; setMenu(null); window.open(`/lire/${id}`, "_blank", "noopener"); }}>Aperçu</button>
          <button onClick={() => { const ed = menu.ed; setMenu(null); startEdit(ed); }}>Modifier</button>
          <hr />
          <button className="danger" onClick={() => { const ed = menu.ed; setMenu(null); del(ed); }}>Supprimer</button>
        </div>
      )}
      {confirmDialog}
    </>
  );
}