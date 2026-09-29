"use client";

import { useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";

export default function Parametres() {
  const [site, setSite] = useState({ contactEmail: "", address: "", heroTitle: "" });
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setSite(d.settings.site)).catch(() => {});
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await postJson("/api/admin/settings", { site });
    if (r.ok) { setMsg({ t: "Paramètres enregistrés.", ok: true }); setTimeout(() => setMsg(null), 3500); }
    else setMsg({ t: r.error, ok: false });
  }
  return (
    <>
      <h1 className="t">Paramètres</h1>
      <p className="sub">Coordonnées et informations du site.</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={save}>
          <div className="field"><label>E-mail de contact</label><input type="email" value={site.contactEmail} onChange={(e) => setSite({ ...site, contactEmail: e.target.value })} /></div>
          <div className="field"><label>Adresse</label><input type="text" value={site.address} onChange={(e) => setSite({ ...site, address: e.target.value })} /></div>
          <div className="field"><label>Titre d&apos;accroche (hero)</label><input type="text" value={site.heroTitle} onChange={(e) => setSite({ ...site, heroTitle: e.target.value })} /></div>
          <button className="btn btn-b" type="submit">Enregistrer</button>
        </form>
      </div>
    </>
  );
}
