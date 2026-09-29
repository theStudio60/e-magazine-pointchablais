"use client";

import { useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";

type Pack = { key: string; name: string; interval: "month" | "year"; price: number; active: boolean; recommended?: boolean };

export default function Packs() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setPacks(d.settings.packs)).catch(() => {});
  }, []);

  function upd(i: number, patch: Partial<Pack>) {
    setPacks((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  async function save() {
    // les prix sont en CHF dans le formulaire → l'API convertit en centimes
    const body = { packs: packs.map((p) => ({ ...p, price: p.price / 100 })) };
    const r = await postJson("/api/admin/settings", body);
    if (r.ok) { setMsg({ t: "Packs enregistrés (répercutés sur la page d'accueil et le paiement).", ok: true }); setTimeout(() => setMsg(null), 4000); }
    else setMsg({ t: r.error, ok: false });
  }

  return (
    <>
      <h1 className="t">Packs / Offres</h1>
      <p className="sub">Gérez les formules d&apos;abonnement (nom, prix, disponibilité).</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Clé</th><th>Nom</th><th>Période</th><th>Prix (CHF)</th><th>Actif</th><th>Recommandé</th></tr></thead>
          <tbody>
            {packs.map((p, i) => (
              <tr key={p.key}>
                <td><code>{p.key}</code></td>
                <td><input type="text" value={p.name} onChange={(e) => upd(i, { name: e.target.value })} /></td>
                <td>{p.interval === "year" ? "annuel" : "mensuel"}</td>
                <td style={{ maxWidth: 120 }}><input type="number" min="0" step="0.5" value={p.price / 100} onChange={(e) => upd(i, { price: Math.round(Number(e.target.value) * 100) })} /></td>
                <td><input type="checkbox" checked={p.active} onChange={(e) => upd(i, { active: e.target.checked })} /></td>
                <td><input type="checkbox" checked={!!p.recommended} onChange={(e) => upd(i, { recommended: e.target.checked })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}><button className="btn btn-b" onClick={save}>Enregistrer les packs</button></div>
      </div>
    </>
  );
}
