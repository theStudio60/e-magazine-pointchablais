"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirm } from "../confirm";
import { Icon } from "../icons";

type U = { id: string; email: string; name: string; subscriberNo: string; plan: string | null; status: string; currentPeriodEnd: string | null };

const SIZE = 10;
const DAY = 86400000;
const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—");
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-CH") : "—");

// Évite qu'Excel interprète une cellule comme une formule (=, +, -, @) et protège les guillemets.
function csvCell(v: string) {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

// Pagination : même rendu que la page Membres.
const PG_CSS = `
.tfoot .pg button{color:var(--ink)}
.tfoot .pg button:disabled{color:var(--muted);opacity:.6;cursor:not-allowed}
.tfoot .pg button:hover:not(:disabled){background:var(--primary);color:#fff;border-color:var(--primary)}
.tfoot .pg button.on,.tfoot .pg button.on:hover{background:var(--primary);color:#fff;border-color:var(--primary)}
`;

export default function Abonnements() {
  const [items, setItems] = useState<U[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [echeance, setEcheance] = useState("");
  const [sort, setSort] = useState("echeance");
  const [page, setPage] = useState(1);
  const { confirm, confirmDialog } = useConfirm();

  // Charge TOUS les abonnements actifs (par lots de 100) : recherche et filtres se font ensuite côté page.
  const load = useCallback(async () => {
    let all: U[] = [];
    for (let p = 1; p <= 50; p++) {
      const r = await fetch(`/api/admin/users?status=active&size=100&page=${p}`);
      if (!r.ok) break;
      const d = await r.json();
      all = all.concat(d.items as U[]);
      if (p >= (d.pages || 1)) break;
    }
    setItems(all);
    setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const needle = q.toLowerCase().trim();
    let rows = items;
    if (needle) rows = rows.filter((u) => (u.name + " " + u.email + " " + u.subscriberNo).toLowerCase().includes(needle));
    if (plan) rows = rows.filter((u) => u.plan === plan);
    if (echeance === "30j") {
      rows = rows.filter((u) => {
        if (!u.currentPeriodEnd) return false;
        const t = new Date(u.currentPeriodEnd).getTime();
        return t >= now && t <= now + 30 * DAY;
      });
    } else if (echeance === "depassee") {
      rows = rows.filter((u) => u.currentPeriodEnd && new Date(u.currentPeriodEnd).getTime() < now);
    }
    const end = (u: U) => (u.currentPeriodEnd ? new Date(u.currentPeriodEnd).getTime() : null);
    return [...rows].sort((a, b) => {
      if (sort === "nom") return (a.name || a.email).localeCompare(b.name || b.email, "fr");
      const ea = end(a), eb = end(b);
      if (ea === null && eb === null) return 0;
      if (ea === null) return 1; // sans échéance : toujours en bas
      if (eb === null) return -1;
      return sort === "echeance-desc" ? eb - ea : ea - eb;
    });
  }, [items, q, plan, echeance, sort]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const cur = Math.min(page, pages);
  const rows = filtered.slice((cur - 1) * SIZE, cur * SIZE);
  const from = total === 0 ? 0 : (cur - 1) * SIZE + 1;
  const to = Math.min(cur * SIZE, total);
  const first = Math.max(1, Math.min(cur - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);
  const filtering = q.trim() !== "" || plan !== "" || echeance !== "";

  function exportCsv() {
    const head = ["N° abonné", "Nom", "E-mail", "Formule", "Échéance"];
    const lines = [head, ...filtered.map((u) => [u.subscriberNo, u.name || "", u.email, cap(u.plan), fmt(u.currentPeriodEnd)])];
    // BOM + séparateur « ; » : s'ouvre correctement dans Excel (accents inclus).
    const csv = "\uFEFF" + lines.map((l) => l.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `abonnements-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function deactivate(u: U) {
    const ok = await confirm({
      title: "Résilier cet abonnement ?",
      message: <>L&apos;abonnement de <b>{u.name || u.email}</b> sera désactivé immédiatement : il n&apos;aura plus accès aux numéros. Vous pourrez le réactiver depuis <b>Membres</b>.</>,
      confirmLabel: "Résilier",
      danger: true,
    });
    if (!ok) return;
    const id = u.id;
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "inactive" }) });
    setMsg("Abonnement résilié."); setTimeout(() => setMsg(""), 3000); load();
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PG_CSS }} />
      <h1 className="t">Abonnements</h1>
      <p className="sub">{items.length} abonnement(s) actif(s).</p>
      {msg && <div className="msg ok">{msg}</div>}

      <div className="tools">
        <button className="btn btn-b" onClick={exportCsv} disabled={total === 0}><Icon name="download" size={17} /> Exporter CSV</button>
        <div className="sbox">
          <Icon name="search" size={17} />
          <input type="text" placeholder="Rechercher…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <select value={plan} onChange={(e) => { setPage(1); setPlan(e.target.value); }}>
          <option value="">Toutes les formules</option>
          <option value="mensuel">Mensuel</option>
          <option value="annuel">Annuel</option>
        </select>
      </div>

      <div className="card flush">
        <table>
          <thead><tr><th>Abonné</th><th>N°</th><th>Formule</th><th>Échéance</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.name || "—"}<br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{u.email}</span></td>
                <td>{u.subscriberNo}</td>
                <td style={{ textTransform: "capitalize" }}>{u.plan || "—"}</td>
                <td>{fmt(u.currentPeriodEnd)}</td>
                <td><button className="btn btn-d" onClick={() => deactivate(u)}>Résilier</button></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center", padding: 34 }}>
                {!loaded ? "Chargement…" : filtering ? "Aucun résultat pour ces filtres." : "Aucun abonnement actif."}
              </td></tr>
            )}
          </tbody>
        </table>
        <div className="tfoot">
          <span>Affichage de <b style={{ color: "var(--ink)" }}>{from}</b> à <b style={{ color: "var(--ink)" }}>{to}</b> sur <b style={{ color: "var(--ink)" }}>{total}</b> abonnement(s)</span>
          <div className="pg">
            <button disabled={cur <= 1} onClick={() => setPage(cur - 1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={14} /></span> Précédent</button>
            {nums.map((n) => <button key={n} className={n === cur ? "on" : ""} onClick={() => setPage(n)}>{n}</button>)}
            <button disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Suivant <Icon name="chevron" size={14} /></button>
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}