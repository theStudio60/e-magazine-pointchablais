"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";
import { Icon, StatCard, initials } from "../icons";
import { useConfirm } from "../confirm";

type U = { id: string; email: string; name: string; subscriberNo: string; role: string; plan: string | null; status: string; currentPeriodEnd: string | null; createdAt?: string };
type Stats = { total: number; actifs: number; inactifs: number; nouveaux: number };
type Data = { items: U[]; total: number; pages: number; stats: Stats };
type MenuState = { u: U; x: number; top?: number; bottom?: number };

const SIZE = 10;
const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—");
const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(" à", ",") : "—";

export default function Membres() {
  const [q, setQ] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Data>({ items: [], total: 0, pages: 1, stats: { total: 0, actifs: 0, inactifs: 0, nouveaux: 0 } });
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [created, setCreated] = useState<{ email: string; pwd: string } | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("q");
    if (u) setQ(u);
  }, []);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ q, status, sort, page: String(page), size: String(SIZE) });
    const r = await call("/api/admin/users?" + p.toString());
    if (r.ok) setData(r.data as Data);
  }, [q, status, sort, page]);
  useEffect(() => { load(); }, [load]);

  // ferme le menu ⋮ (clic ailleurs, défilement, Échap)
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

  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 3500); }

  async function patch(id: string, body: Record<string, unknown>) {
    setMenu(null);
    const r = await postJson(`/api/admin/users/${id}`, body, "PATCH");
    if (r.ok) { flash("Membre mis à jour."); load(); } else flash(r.error, false);
  }
  async function del(u: U) {
    setMenu(null);
    const ok = await confirm({
      title: "Supprimer ce membre ?",
      message: <><b>{u.name || u.email}</b> sera supprimé définitivement. Ses factures sont conservées. Cette action est irréversible.</>,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const id = u.id;
    const r = await call(`/api/admin/users/${id}`, { method: "DELETE" });
    if (r.ok) { flash("Membre supprimé."); setSel((s) => s.filter((x) => x !== id)); load(); } else flash(r.error, false);
  }
  async function deactivateOne(u: U) {
    setMenu(null);
    const ok = await confirm({
      title: "Désactiver ce membre ?",
      message: <><b>{u.name || u.email}</b> n&apos;aura plus accès aux numéros. Vous pourrez le réactiver ensuite.</>,
      confirmLabel: "Désactiver",
      danger: true,
    });
    if (ok) await patch(u.id, { status: "inactive" });
  }
  async function bulk(status: "active" | "inactive") {
    if (status === "inactive") {
      const ok = await confirm({
        title: `Désactiver ${sel.length} membre(s) ?`,
        message: "Ils n'auront plus accès aux numéros. Vous pourrez les réactiver ensuite.",
        confirmLabel: "Désactiver",
        danger: true,
      });
      if (!ok) return;
    }
    let fail = "";
    for (const id of sel) {
      const r = await postJson(`/api/admin/users/${id}`, { status }, "PATCH");
      if (!r.ok) { fail = r.error; break; }
    }
    if (fail) flash(fail, false); else flash(`${sel.length} membre(s) mis à jour.`);
    setSel([]); load();
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await postJson("/api/admin/users", { email: f.get("email"), name: f.get("name"), plan: f.get("plan") || null, status: f.get("status") });
    if (r.ok) { setCreated({ email: String(f.get("email")), pwd: r.data.tempPassword }); setShowNew(false); load(); }
    else flash(r.error, false);
  }

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, u: U) {
    e.stopPropagation();
    if (menu?.u.id === u.id) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(8, Math.min(r.right - 210, window.innerWidth - 226));
    const flip = r.bottom + 300 > window.innerHeight;
    setMenu(flip ? { u, x, bottom: window.innerHeight - r.top + 6 } : { u, x, top: r.bottom + 6 });
  }

  const ids = data.items.map((u) => u.id);
  const allSel = ids.length > 0 && ids.every((id) => sel.includes(id));
  const from = data.total === 0 ? 0 : (page - 1) * SIZE + 1;
  const to = Math.min(page * SIZE, data.total);
  const first = Math.max(1, Math.min(page - 2, data.pages - 4));
  const nums = Array.from({ length: Math.min(5, data.pages) }, (_, i) => first + i);

  return (
    <>
      <h1 className="t">Gestion des Membres</h1>
      <p className="sub">Gérez et visualisez tous vos membres</p>

      <div className="stats">
        <StatCard icon="users" color="blue" value={data.stats.total} label="Total membres" />
        <StatCard icon="userCheck" color="green" value={data.stats.actifs} label="Membres actifs" />
        <StatCard icon="userX" color="pink" value={data.stats.inactifs} label="Inactifs" />
        <StatCard icon="calendar" color="purple" value={data.stats.nouveaux} label="Nouveaux ce mois" />
      </div>

      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      {created && (
        <div className="msg ok">
          Membre créé : <b>{created.email}</b> — mot de passe temporaire : <b>{created.pwd}</b> (à communiquer ; il pourra le changer).
        </div>
      )}

      <div className="tools">
        <a className="btn btn-b" href="/api/admin/export"><Icon name="download" size={17} /> Exporter CSV</a>
        <div className="sbox">
          <Icon name="search" size={17} />
          <input type="text" placeholder="Rechercher (nom, e-mail, n°)…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }}>
          <option value="recent">Plus récents</option>
          <option value="ancien">Plus anciens</option>
          <option value="nom">Nom (A–Z)</option>
        </select>
        <button className="btn btn-o" onClick={() => setShowNew((v) => !v)}><Icon name="plus" size={17} /> Créer un membre</button>
      </div>

      {sel.length > 0 && (
        <div className="tools" style={{ background: "var(--primary-soft)", borderColor: "#cfe0fb" }}>
          <span className="sel"><b style={{ color: "var(--ink)" }}>{sel.length}</b> sélectionné(s)</span>
          <button className="btn btn-b" onClick={() => bulk("active")}>Activer</button>
          <button className="btn btn-o" onClick={() => bulk("inactive")}>Désactiver</button>
          <button className="btn btn-o" onClick={() => setSel([])}>Annuler</button>
        </div>
      )}

      {showNew && (
        <div className="card">
          <h2>Nouveau membre</h2>
          <form onSubmit={create}>
            <div className="grid2">
              <div className="field"><label>Nom</label><input name="name" type="text" /></div>
              <div className="field"><label>E-mail *</label><input name="email" type="email" required /></div>
              <div className="field"><label>Formule</label>
                <select name="plan"><option value="">Aucune</option><option value="mensuel">Mensuel</option><option value="annuel">Annuel</option></select>
              </div>
              <div className="field"><label>Statut</label>
                <select name="status"><option value="inactive">Inactif</option><option value="active">Actif (abonné)</option></select>
              </div>
            </div>
            <button className="btn btn-b" type="submit">Créer le compte</button>
          </form>
        </div>
      )}

      <div className="card flush">
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? sel.filter((id) => !ids.includes(id)) : Array.from(new Set([...sel, ...ids])))} aria-label="Tout sélectionner" /></th>
              <th>Date</th><th>Membre</th><th>Email</th><th>Pack</th><th>Statut</th><th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id}>
                <td><input type="checkbox" checked={sel.includes(u.id)} onChange={() => setSel((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]))} aria-label="Sélectionner" /></td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDT(u.createdAt)}</td>
                <td>
                  <div className="mem">
                    <span className="mav">{initials(u.name || u.email)}</span>
                    <div>
                      <div className="nm">{u.name || "—"}{u.role === "admin" && <span className="pill w" style={{ marginLeft: 8, padding: "1px 8px" }}>admin</span>}</div>
                      <div className="sb">N° {u.subscriberNo}</div>
                    </div>
                  </div>
                </td>
                <td>{u.email}</td>
                <td style={{ fontWeight: 500 }}>{cap(u.plan)}</td>
                <td><span className={"pill " + (u.status === "active" ? "a" : "i")}>{u.status === "active" ? "Actif" : "Inactif"}</span></td>
                <td style={{ textAlign: "right" }}>
                  <button className="kebab" aria-label="Actions" onClick={(e) => openMenu(e, u)}><Icon name="dots" size={20} /></button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 34 }}>Aucun résultat.</td></tr>}
          </tbody>
        </table>
        <div className="tfoot">
          <span>Affichage de <b style={{ color: "var(--ink)" }}>{from}</b> à <b style={{ color: "var(--ink)" }}>{to}</b> sur <b style={{ color: "var(--ink)" }}>{data.total}</b> membres</span>
          <div className="pg">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={14} /></span> Précédent</button>
            {nums.map((n) => <button key={n} className={n === page ? "on" : ""} onClick={() => setPage(n)}>{n}</button>)}
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Suivant <Icon name="chevron" size={14} /></button>
          </div>
        </div>
      </div>

      {menu && (
        <div className="menu" style={{ left: menu.x, top: menu.top, bottom: menu.bottom }} onClick={(e) => e.stopPropagation()}>
          {menu.u.status === "active"
            ? <button onClick={() => deactivateOne(menu.u)}><Icon name="userX" size={17} /> Désactiver</button>
            : <button onClick={() => patch(menu.u.id, { status: "active" })}><Icon name="userCheck" size={17} /> Activer</button>}
          <hr />
          <div className="lab">Formule</div>
          {([["mensuel", "Mensuel"], ["annuel", "Annuel"], [null, "Aucune"]] as const).map(([k, l]) => (
            <button key={String(k)} onClick={() => patch(menu.u.id, { plan: k })}>
              {l}{(menu.u.plan || null) === k && <span className="tick"><Icon name="check" size={16} /></span>}
            </button>
          ))}
          <hr />
          <button className="danger" onClick={() => del(menu.u)}><Icon name="trash" size={17} /> Supprimer</button>
        </div>
      )}
      {confirmDialog}
    </>
  );
}