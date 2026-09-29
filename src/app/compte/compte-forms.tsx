"use client";

import { useState } from "react";

const CSS = `
:root{--blue:#1c6b8c;--blue-deep:#124f68;--blue-ink:#0e3f53;--mauve:#9c6b91;--mauve-soft:#f4ecf2;--ink:#243138;--muted:#6a7d83;--gray:#f4f6f6;--line:#e5e9ea;}
*{box-sizing:border-box}body{margin:0;background:var(--gray);color:var(--ink);font-family:"Poppins",system-ui,sans-serif}
a{color:inherit;text-decoration:none}
.wrap{max-width:640px;margin:0 auto;padding:0 22px}
header{background:#fff;border-bottom:1px solid var(--line)}
.head{display:flex;align-items:center;justify-content:space-between;padding:14px 0;max-width:640px;margin:0 auto;padding-inline:22px}
.head img{height:38px}.head a{color:var(--muted);font-weight:500;font-size:14px}.head a:hover{color:var(--blue)}
h1{color:var(--blue-ink);font-size:24px;margin:28px 0 18px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:22px}
.card h2{color:var(--blue-ink);font-size:18px;margin:0 0 16px}
label{display:block;font-size:13px;font-weight:600;margin:0 0 5px}
input{width:100%;font-family:inherit;font-size:15px;padding:12px 13px;border:1.5px solid var(--line);border-radius:8px;margin-bottom:14px}
input:focus{outline:0;border-color:var(--mauve);box-shadow:0 0 0 4px var(--mauve-soft)}
.btn{background:var(--blue);color:#fff;border:0;border-radius:7px;padding:12px 20px;font-weight:600;font-family:inherit;cursor:pointer}
.btn:hover{background:var(--blue-deep)}
.msg{padding:10px 12px;border-radius:8px;font-size:13.5px;margin-bottom:14px}
.msg.ok{background:#e5f4ec;color:#1f7a4d}.msg.err{background:#fdeceb;color:#b3261e}
`;

export default function CompteForms({ name, email, address }: { name: string; email: string; address: string }) {
  const [profile, setProfile] = useState({ name, email, address });
  const [pmsg, setPmsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [next2, setNext2] = useState("");
  const [wmsg, setWmsg] = useState<{ t: string; ok: boolean } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/account/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    const d = await r.json();
    setPmsg(r.ok ? { t: "Coordonnées enregistrées.", ok: true } : { t: d.error || "Erreur.", ok: false });
  }
  async function savePwd(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) return setWmsg({ t: "Mot de passe : 6 caractères minimum.", ok: false });
    if (next !== next2) return setWmsg({ t: "Les deux mots de passe ne correspondent pas.", ok: false });
    const r = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: cur, next }) });
    const d = await r.json();
    if (r.ok) { setWmsg({ t: "Mot de passe modifié.", ok: true }); setCur(""); setNext(""); }
    else setWmsg({ t: d.error || "Erreur.", ok: false });
  }

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header><div className="head"><img src="/logo.png" alt="Le Point Chablais" /><a href="/espace">&larr; Mon espace</a></div></header>
      <div className="wrap">
        <h1>Mon compte</h1>

        <div className="card">
          <h2>Mes coordonnées</h2>
          {pmsg && <div className={"msg " + (pmsg.ok ? "ok" : "err")}>{pmsg.t}</div>}
          <form onSubmit={saveProfile}>
            <label>Nom</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <label>E-mail (identifiant)</label>
            <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <label>Adresse</label>
            <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Rue, NPA, localité" />
            <button className="btn" type="submit">Enregistrer</button>
          </form>
        </div>

        <div className="card">
          <h2>Changer mon mot de passe</h2>
          {wmsg && <div className={"msg " + (wmsg.ok ? "ok" : "err")}>{wmsg.t}</div>}
          <form onSubmit={savePwd}>
            <label>Mot de passe actuel</label>
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required />
            <label>Nouveau mot de passe</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="6 caractères minimum" required />
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} placeholder="Retapez le mot de passe" autoComplete="new-password" required />
            <button className="btn" type="submit">Modifier le mot de passe</button>
          </form>
        </div>
      </div>
    </main>
  );
}
