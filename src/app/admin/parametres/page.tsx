"use client";

import { useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";

const EMPTY = { contactEmail: "", phone: "", address: "", heroTitle: "", facebook: "", instagram: "", linkedin: "", legalNotice: "" };
type Site = typeof EMPTY;

// Domaine complet obligatoire (refuse test@example).
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()./-]{6,20}$/;

function validate(s: Site): string | null {
  if (!s.contactEmail.trim()) return "L'e-mail de contact est obligatoire.";
  if (!EMAIL_RE.test(s.contactEmail.trim())) return "L'e-mail de contact est invalide : indiquez un domaine complet (exemple : contact@exemple.ch).";
  if (s.phone.trim() && !PHONE_RE.test(s.phone.trim())) return "Le numéro de téléphone est invalide (exemple : +41 24 123 45 67).";
  const nets: [string, string][] = [["Facebook", s.facebook], ["Instagram", s.instagram], ["LinkedIn", s.linkedin]];
  for (const [name, url] of nets) {
    if (url.trim() && !/^https?:\/\/\S+\.\S+/.test(url.trim())) return `Le lien ${name} doit commencer par https:// (exemple : https://www.facebook.com/lepointchablais).`;
  }
  return null;
}

export default function Parametres() {
  const [site, setSite] = useState<Site>(EMPTY);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const merged: Site = { ...EMPTY };
        (Object.keys(EMPTY) as (keyof Site)[]).forEach((k) => { merged[k] = d.settings?.site?.[k] ?? ""; });
        setSite(merged);
      })
      .catch(() => {});
  }, []);

  function set<K extends keyof Site>(k: K, v: string) { setSite((s) => ({ ...s, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const clean: Site = { ...site };
    (Object.keys(clean) as (keyof Site)[]).forEach((k) => { clean[k] = clean[k].trim(); });
    const problem = validate(clean);
    if (problem) { setMsg({ t: problem, ok: false }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const r = await postJson("/api/admin/settings", { site: clean });
    if (r.ok) { setSite(clean); setMsg({ t: "Paramètres enregistrés.", ok: true }); setTimeout(() => setMsg(null), 3500); }
    else setMsg({ t: r.error, ok: false });
  }

  const hint = { fontSize: 12.5, color: "#6a7d83", marginTop: -6, marginBottom: 14 } as const;

  return (
    <>
      <h1 className="t">Paramètres</h1>
      <p className="sub">Coordonnées et informations du site.</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <form onSubmit={save} noValidate>
        <div className="card" style={{ maxWidth: 720 }}>
          <h2>Coordonnées</h2>
          <div className="field"><label>E-mail de contact *</label><input type="email" value={site.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></div>
          <div className="field"><label>Numéro de téléphone</label><input type="text" inputMode="tel" value={site.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+41 24 123 45 67" /></div>
          <div className="field"><label>Adresse</label><input type="text" value={site.address} onChange={(e) => set("address", e.target.value)} /></div>
        </div>

        <div className="card" style={{ maxWidth: 720 }}>
          <h2>Réseaux sociaux</h2>
          <div className="field"><label>Facebook</label><input type="text" inputMode="url" value={site.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://www.facebook.com/…" /></div>
          <div className="field"><label>Instagram</label><input type="text" inputMode="url" value={site.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://www.instagram.com/…" /></div>
          <div className="field"><label>LinkedIn</label><input type="text" inputMode="url" value={site.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://www.linkedin.com/…" /></div>
          <p style={hint}>Laissez vide les réseaux que vous n&apos;utilisez pas.</p>
        </div>

        <div className="card" style={{ maxWidth: 720 }}>
          <h2>Page d&apos;accueil</h2>
          <div className="field"><label>Titre d&apos;accroche (hero)</label><input type="text" value={site.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} placeholder="Le journal qui réunit Aigle, Bex et le Chablais." /></div>
          <p style={hint}>Affiché en grand en haut de la page d&apos;accueil. Si vous le laissez vide, le titre par défaut est utilisé.</p>
        </div>

        <div className="card" style={{ maxWidth: 720 }}>
          <h2>Mentions légales</h2>
          <div className="field">
            <label>Texte des mentions légales</label>
            <textarea
              rows={10}
              value={site.legalNotice}
              onChange={(e) => set("legalNotice", e.target.value)}
              placeholder={"Éditeur, adresse, responsable de la publication, hébergeur…"}
              style={{ width: "100%", height: 240, resize: "none", overflowY: "auto", fontFamily: "inherit", fontSize: 15, padding: "12px 13px", border: "1.5px solid #e5e9ea", borderRadius: 8 }}
            />
          </div>
          <p style={hint}>Une ligne vide sépare deux paragraphes.</p>
        </div>

        <button className="btn btn-b" type="submit">Enregistrer</button>
      </form>
    </>
  );
}