"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/admin-fetch";
import { Icon } from "../icons";
import { useConfirm } from "../confirm";

type Pack = { key: string; name: string; interval: "month" | "year"; price: number; active: boolean; recommended?: boolean };

// « Offre Famille » -> « offre-famille » (sans accents ni caractères spéciaux)
const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pack";

// Tableau : champ « Nom » large sur ordinateur ; sur mobile, chaque pack devient une carte.
const PACKS_CSS = `
.pk-wrap{overflow-x:auto}
.pk{width:100%}
.pk td.name{width:36%}
.pk td.name input{width:100%;min-width:220px}
.pk td.price input{width:110px}
@media(max-width:820px){
  .pk thead{display:none}
  .pk,.pk tbody,.pk tr,.pk td{display:block;width:100%}
  .pk tr{border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin-bottom:12px;background:#fff}
  .pk td{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:7px 0;border:0}
  .pk td::before{content:attr(data-label);flex:0 0 100px;font-weight:600;font-size:12.5px;color:var(--muted)}
  .pk td.txt{justify-content:flex-start}
  .pk td.name{width:100%}
  .pk td.name input{flex:1;min-width:0;width:100%}
  .pk td.price input{flex:1;min-width:0;width:100%}
  .pk td.act .btn{width:100%;justify-content:center}
  .pk td.act::before{display:none}
  .pk-save{text-align:center}
  .pk-save .btn{width:auto}
}
@media(max-width:620px){
  .pk-form .grid2{grid-template-columns:1fr}
}
`;

export default function Packs() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [nName, setNName] = useState("");
  const [nInterval, setNInterval] = useState<"month" | "year">("month");
  const [nPrice, setNPrice] = useState("");
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setPacks(d.settings.packs)).catch(() => {});
  }, []);

  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 4500); }

  function upd(i: number, patch: Partial<Pack>) {
    setPacks((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  // Un seul pack « Recommandé » à la fois.
  function setRecommended(i: number, on: boolean) {
    setPacks((ps) => ps.map((p, idx) => (idx === i ? { ...p, recommended: on } : on ? { ...p, recommended: false } : p)));
  }

  function addPack(e: React.FormEvent) {
    e.preventDefault();
    const name = nName.trim();
    const price = Number(nPrice.replace(",", "."));
    if (!name) return flash("Donnez un nom au pack.", false);
    if (!Number.isFinite(price) || price < 0) return flash("Prix invalide.", false);
    let key = slug(name);
    const taken = new Set(packs.map((p) => p.key));
    for (let n = 2; taken.has(key); n++) key = `${slug(name)}-${n}`;
    setPacks((ps) => [...ps, { key, name, interval: nInterval, price: Math.round(price * 100), active: true, recommended: false }]);
    setNName(""); setNPrice(""); setNInterval("month"); setShowNew(false);
    flash("Pack ajouté : cliquez sur « Enregistrer les packs » pour confirmer.");
  }

  async function removePack(i: number) {
    const p = packs[i];
    if (packs.length <= 1) return flash("Il faut garder au moins un pack.", false);
    const ok = await confirm({
      title: "Supprimer ce pack ?",
      message: <>Le pack <b>{p.name}</b> sera retiré de la page d&apos;accueil et du paiement au prochain enregistrement. Pour seulement le masquer, décochez plutôt « Actif ».</>,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    setPacks((ps) => ps.filter((_, idx) => idx !== i));
    flash("Pack retiré : cliquez sur « Enregistrer les packs » pour confirmer.");
  }

  async function save() {
    if (packs.some((p) => !p.name.trim())) return flash("Chaque pack doit avoir un nom.", false);
    // les prix sont en CHF dans le formulaire → l'API convertit en centimes
    const body = { packs: packs.map((p) => ({ ...p, name: p.name.trim(), price: p.price / 100 })) };
    const r = await postJson("/api/admin/settings", body);
    if (r.ok) flash("Packs enregistrés (répercutés sur la page d'accueil et le paiement).");
    else flash(r.error, false);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PACKS_CSS }} />
      <h1 className="t">Packs / Offres</h1>
      <p className="sub">Gérez les formules d&apos;abonnement (nom, prix, disponibilité).</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}

      <div className="tools">
        <button className="btn btn-o" onClick={() => setShowNew((v) => !v)}><Icon name="plus" size={17} /> Ajouter un pack</button>
      </div>

      {showNew && (
        <div className="card pk-form">
          <h2>Nouveau pack</h2>
          <form onSubmit={addPack}>
            <div className="grid2">
              <div className="field"><label>Nom *</label><input type="text" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="ex. Semestriel" /></div>
              <div className="field"><label>Période</label>
                <select value={nInterval} onChange={(e) => setNInterval(e.target.value as "month" | "year")}>
                  <option value="month">Mensuel</option>
                  <option value="year">Annuel</option>
                </select>
              </div>
              <div className="field"><label>Prix (CHF) *</label><input type="number" min="0" step="0.5" value={nPrice} onChange={(e) => setNPrice(e.target.value)} /></div>
            </div>
            <button className="btn btn-b" type="submit">Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="pk-wrap">
          <table className="pk">
            <thead><tr><th>Clé</th><th>Nom</th><th>Période</th><th>Prix (CHF)</th><th>Actif</th><th>Recommandé</th><th>Action</th></tr></thead>
            <tbody>
              {packs.map((p, i) => (
                <tr key={p.key}>
                  <td className="txt" data-label="Clé"><code>{p.key}</code></td>
                  <td className="name" data-label="Nom"><input type="text" value={p.name} onChange={(e) => upd(i, { name: e.target.value })} /></td>
                  <td className="txt" data-label="Période">{p.interval === "year" ? "annuel" : "mensuel"}</td>
                  <td className="price" data-label="Prix (CHF)"><input type="number" min="0" step="0.5" value={p.price / 100} onChange={(e) => upd(i, { price: Math.round(Number(e.target.value) * 100) })} /></td>
                  <td className="txt" data-label="Actif"><input type="checkbox" checked={p.active} onChange={(e) => upd(i, { active: e.target.checked })} /></td>
                  <td className="txt" data-label="Recommandé"><input type="checkbox" checked={!!p.recommended} onChange={(e) => setRecommended(i, e.target.checked)} /></td>
                  <td className="act"><button className="btn btn-d" type="button" onClick={() => removePack(i)}><Icon name="trash" size={16} /> Supprimer</button></td>
                </tr>
              ))}
              {packs.length === 0 && <tr><td colSpan={7} style={{ color: "var(--muted)" }}>Aucun pack.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pk-save" style={{ marginTop: 16 }}><button className="btn btn-b" onClick={save}>Enregistrer les packs</button></div>
      </div>
      {confirmDialog}
    </>
  );
}