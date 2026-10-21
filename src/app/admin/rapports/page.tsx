"use client";

import { useEffect, useState } from "react";
import { Icon, StatCard } from "../icons";

type Stats = { totalMembres: number; actifs: number; revenuTotal: number; mrr: number; enAttente: number; numeros: number };
type Report = {
  from: string; to: string; group: "day" | "month"; keys: string[];
  series: { nouveauxMembres: number[]; membresTotal: number[]; abonnementsPayes: number[]; revenu: number[] };
  totals: { nouveauxMembres: number; abonnementsPayes: number; revenu: number };
  facturesSansDate: number;
};
type Serie = { name: string; color: string; values: number[] };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const num = (v: number) => v.toLocaleString("fr-CH", { maximumFractionDigits: 2 });

function labelOf(k: string, group: string) {
  const p = k.split("-");
  return group === "day" ? `${p[2]}.${p[1]}` : `${MOIS[Number(p[1]) - 1]} ${p[0].slice(2)}`;
}
function niceMax(v: number) {
  if (v <= 0) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * p;
}
function defaultRange() {
  const s = new Date();
  s.setUTCDate(1);
  s.setUTCMonth(s.getUTCMonth() - 11);
  return { from: isoDay(s), to: isoDay(new Date()) };
}

// Graphique SVG (courbe ou barres), sans bibliothèque externe.
function Chart({ keys, group, series, kind, label }: { keys: string[]; group: string; series: Serie[]; kind: "line" | "bar"; label: string }) {
  const W = 420, H = 260, L = 46, R = 12, T = 14, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const n = keys.length;
  const maxV = Math.max(0, ...series.flatMap((s) => s.values));
  const top = Math.max(4, niceMax(maxV));
  const y = (v: number) => T + ph - (v / top) * ph;
  const slot = pw / Math.max(1, n);
  const xl = (i: number) => (n === 1 ? L + pw / 2 : L + (i * pw) / (n - 1));
  const xb = (i: number) => L + i * slot + slot / 2;
  const step = Math.ceil(n / 5);
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);
  const barW = Math.min(46, slot * 0.6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e5e9ea" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6a7d83">{num(t)}</text>
        </g>
      ))}
      {keys.map((k, i) =>
        i % step === 0 ? (
          <text key={k} x={kind === "bar" ? xb(i) : xl(i)} y={H - 9} textAnchor="middle" fontSize="11" fill="#6a7d83">{labelOf(k, group)}</text>
        ) : null
      )}
      {kind === "bar" &&
        series.map((s) =>
          s.values.map((v, i) => (
            <rect key={s.name + i} x={xb(i) - barW / 2} y={y(v)} width={barW} height={Math.max(0, T + ph - y(v))} rx="3" fill={s.color}>
              <title>{`${labelOf(keys[i], group)}- ${s.name} : ${num(v)}`}</title>
            </rect>
          ))
        )}
      {kind === "line" &&
        series.map((s) => (
          <g key={s.name}>
            <path d={s.values.map((v, i) => `${i ? "L" : "M"}${xl(i)} ${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {n <= 31 &&
              s.values.map((v, i) => (
                <circle key={i} cx={xl(i)} cy={y(v)} r="3.5" fill={s.color}>
                  <title>{`${labelOf(keys[i], group)}- ${s.name} : ${num(v)}`}</title>
                </circle>
              ))}
          </g>
        ))}
      {maxV === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="14" fill="#6a7d83">Aucune donnée sur cette période.</text>
      )}
    </svg>
  );
}

function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "0 0 10px", fontSize: 13, color: "#243138" }}>
      {items.map((i) => (
        <span key={i.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: i.color, display: "inline-block" }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

export default function Rapports() {
  const [s, setS] = useState<Stats | null>(null);
  const [{ from, to }, setRange] = useState(defaultRange);
  const [group, setGroup] = useState<"day" | "month">("month");
  const [data, setData] = useState<Report | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/admin/overview").then((r) => r.json()).then((d) => setS(d.stats)).catch(() => {}); }, []);

  useEffect(() => {
    if (!from || !to) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/admin/reports?from=${from}&to=${to}&group=${group}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) setErr(d.error || "Erreur lors du chargement du rapport.");
        else { setErr(""); setData(d); }
      })
      .catch(() => { if (alive) setErr("Erreur réseau."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to, group]);

  function preset(kind: "7j" | "30j" | "3m" | "12m" | "annee") {
    const e = new Date();
    const st = new Date();
    if (kind === "7j") { st.setUTCDate(st.getUTCDate() - 6); setGroup("day"); }
    else if (kind === "30j") { st.setUTCDate(st.getUTCDate() - 29); setGroup("day"); }
    else if (kind === "3m") { st.setUTCDate(1); st.setUTCMonth(st.getUTCMonth() - 2); setGroup("month"); }
    else if (kind === "12m") { st.setUTCDate(1); st.setUTCMonth(st.getUTCMonth() - 11); setGroup("month"); }
    else { st.setUTCMonth(0, 1); setGroup("month"); }
    setRange({ from: isoDay(st), to: isoDay(e) });
  }

  const taux = s && s.totalMembres ? Math.round((s.actifs / s.totalMembres) * 100) : 0;
  const BLUE = "#1c6b8c", MAUVE = "#9c6b91", GREEN = "#1f9d55";
  const chip = { background: "#fff", color: "#1c6b8c", border: "1.5px solid #d3dce0", padding: "8px 14px", fontSize: 13.5 } as const;

  return (
    <>
      <h1 className="t">Rapports</h1>
      <p className="sub">Synthèse de l&apos;activité et export des données.</p>
      <div className="stats">
        <StatCard icon="users" color="blue" value={s?.totalMembres ?? "—"} label="Membres" />
        <StatCard icon="userCheck" color="green" value={s?.actifs ?? "—"} label="Abonnés actifs" />
        <StatCard icon="chart" color="purple" value={taux + "%"} label="Taux d'abonnés actifs" />
        <StatCard icon="cash" color="orange" value={s ? "CHF " + s.mrr.toFixed(0) : "—"} label="Revenu mensuel récurrent (est.)" />
      </div>

      <div className="card">
        <h2>Période</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button type="button" className="btn" style={chip} onClick={() => preset("7j")}>7 jours</button>
          <button type="button" className="btn" style={chip} onClick={() => preset("30j")}>30 jours</button>
          <button type="button" className="btn" style={chip} onClick={() => preset("3m")}>3 mois</button>
          <button type="button" className="btn" style={chip} onClick={() => preset("12m")}>12 mois</button>
          <button type="button" className="btn" style={chip} onClick={() => preset("annee")}>Cette année</button>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
            Du
            <input type="date" value={from} max={to} onChange={(e) => setRange({ from: e.target.value, to })} style={{ display: "block", marginTop: 5 }} />
          </label>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
            Au
            <input type="date" value={to} min={from} onChange={(e) => setRange({ from, to: e.target.value })} style={{ display: "block", marginTop: 5 }} />
          </label>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
            Affichage
            <select value={group} onChange={(e) => setGroup(e.target.value as "day" | "month")} style={{ display: "block", marginTop: 5 }}>
              <option value="month">Par mois</option>
              <option value="day">Par jour</option>
            </select>
          </label>
        </div>
        {err && <div className="msg err" style={{ marginTop: 14 }}>{err}</div>}
        {data && data.group !== group && !err && (
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "12px 0 0" }}>Période de plus de 92 jours : affichage par mois.</p>
        )}
      </div>

      {data && (
        <>
          <div className="stats" style={{ opacity: loading ? 0.6 : 1 }}>
            <StatCard icon="users" color="blue" value={data.totals.nouveauxMembres} label="Nouveaux membres (période)" />
            <StatCard icon="userCheck" color="green" value={data.totals.abonnementsPayes} label="Abonnements payés (période)" />
            <StatCard icon="cash" color="orange" value={"CHF " + num(data.totals.revenu)} label="Revenus (période)" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18, marginBottom: 18 }}>
          <div className="card" style={{ opacity: loading ? 0.6 : 1, marginBottom: 0, minWidth: 0 }}>
            <h2>Évolution des abonnements</h2>
            <Legend items={[{ name: "Nouveaux membres", color: BLUE }, { name: "Abonnements payés", color: GREEN }]} />
            <Chart
              keys={data.keys} group={data.group} kind="line"
              label="Courbe des nouveaux membres et des abonnements payés"
              series={[
                { name: "Nouveaux membres", color: BLUE, values: data.series.nouveauxMembres },
                { name: "Abonnements payés", color: GREEN, values: data.series.abonnementsPayes },
              ]}
            />
          </div>

          <div className="card" style={{ opacity: loading ? 0.6 : 1, marginBottom: 0, minWidth: 0 }}>
            <h2>Total des membres</h2>
            <Chart
              keys={data.keys} group={data.group} kind="line"
              label="Courbe du nombre total de membres"
              series={[{ name: "Total des membres", color: MAUVE, values: data.series.membresTotal }]}
            />
          </div>

          <div className="card" style={{ opacity: loading ? 0.6 : 1, marginBottom: 0, minWidth: 0 }}>
            <h2>Revenus (CHF)</h2>
            <Chart
              keys={data.keys} group={data.group} kind="bar"
              label="Diagramme des revenus par période"
              series={[{ name: "Revenus (CHF)", color: BLUE, values: data.series.revenu }]}
            />
            {data.facturesSansDate > 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "12px 0 0" }}>
                {data.facturesSansDate} facture(s) payée(s) sans date ne sont pas comptées dans ces graphiques.
              </p>
            )}
          </div>
          </div>
        </>
      )}

      <div className="card">
        <h2>Exports</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 14px" }}>Téléchargez la liste des abonnés au format CSV (ouvrable dans Excel).</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="btn btn-b" href="/api/admin/export"><Icon name="download" size={17} /> Exporter tous les abonnés (CSV)</a>
          {from && to && (
            <a className="btn" style={chip} href={`/api/admin/export?from=${from}&to=${to}`}><Icon name="download" size={17} /> Abonnés inscrits sur la période (CSV)</a>
          )}
        </div>
      </div>
    </>
  );
}