"use client";

import { useEffect, useState } from "react";

// E-mail valide : un @, un domaine avec au moins un point, et une extension de 2 lettres minimum.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

const CSS = `
:root{--blue:#1c6b8c;--blue-deep:#124f68;--blue-ink:#0e3f53;--mauve:#9c6b91;--mauve-soft:#f4ecf2;--ink:#243138;--muted:#6a7d83;--gray:#f4f6f6;--line:#e5e9ea;}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--gray);color:var(--ink);font-family:"Poppins",system-ui,sans-serif}
a{color:inherit;text-decoration:none}
.wrap{max-width:640px;margin:0 auto;padding:0 22px}
header{background:#fff;border-bottom:1px solid var(--line)}
.head{display:flex;align-items:center;justify-content:space-between;padding:14px 0;max-width:640px;margin:0 auto;padding-inline:22px}
.head img{height:38px}.head a{color:var(--muted);font-weight:500;font-size:14px}.head a:hover{color:var(--blue)}
h1{color:var(--blue-ink);font-size:24px;margin:28px 0 18px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:22px;scroll-margin-top:20px;transition:border-color .3s,box-shadow .3s}
.card.flash{border-color:var(--mauve);box-shadow:0 0 0 4px var(--mauve-soft)}
.card h2{color:var(--blue-ink);font-size:18px;margin:0 0 16px}
label{display:block;font-size:13px;font-weight:600;margin:0 0 5px}
input{width:100%;font-family:inherit;font-size:15px;padding:12px 13px;border:1.5px solid var(--line);border-radius:8px;margin-bottom:14px}
input:focus{outline:0;border-color:var(--mauve);box-shadow:0 0 0 4px var(--mauve-soft)}
.pw{position:relative}
.pw input{padding-right:44px}
.pw .eye{position:absolute;right:10px;top:11px;background:none;border:0;cursor:pointer;color:var(--muted);padding:4px;display:flex}
.btn{background:var(--blue);color:#fff;border:0;border-radius:7px;padding:14px 22px;font-size:16px;line-height:1.3;font-weight:600;font-family:inherit;cursor:pointer}
@media(max-width:620px){.btn{font-size:17px;padding:15px 22px;width:100%}}
.btn:hover{background:var(--blue-deep)}
.msg{padding:10px 12px;border-radius:8px;font-size:13.5px;margin-bottom:14px}
.msg.ok{background:#e5f4ec;color:#1f7a4d}.msg.err{background:#fdeceb;color:#b3261e}
`;

function EyeBtn({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button type="button" className="eye" onClick={onClick} aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}

export default function CompteForms({ name, email, address }: { name: string; email: string; address: string }) {
  const [profile, setProfile] = useState({ name, email, address });
  const [saved, setSaved] = useState({ name, email, address });
  const [pmsg, setPmsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [next2, setNext2] = useState("");
  const [wmsg, setWmsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showNext2, setShowNext2] = useState(false);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    function go() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const card = document.getElementById(id);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.classList.add("flash");
      t1 = setTimeout(() => card.classList.remove("flash"), 1800);
      t2 = setTimeout(() => {
        const target = card.querySelector<HTMLInputElement>(id === "demenagement" ? "#f-adresse" : "input");
        target?.focus({ preventScroll: true });
      }, 450);
    }
    go();
    window.addEventListener("hashchange", go);
    return () => {
      window.removeEventListener("hashchange", go);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const clean = {
      name: profile.name.trim(),
      email: profile.email.trim(),
      address: profile.address.trim(),
    };
    if (
      clean.name === saved.name.trim() &&
      clean.email === saved.email.trim() &&
      clean.address === saved.address.trim()
    ) {
      setPmsg(null);
      return;
    }
    if (!EMAIL_RE.test(clean.email)) {
      return setPmsg({ t: "Adresse e-mail invalide (ex. nom@domaine.ch).", ok: false });
    }
    const r = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
    const d = await r.json();
    if (r.ok) {
      setSaved(clean);
      setProfile(clean);
      setPmsg({ t: "Coordonnées enregistrées.", ok: true });
    } else {
      setPmsg({ t: d.error || "Erreur.", ok: false });
    }
  }

  async function savePwd(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) return setWmsg({ t: "Mot de passe : 6 caractères minimum.", ok: false });
    if (next !== next2) return setWmsg({ t: "Les deux mots de passe ne correspondent pas.", ok: false });
    const r = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: cur, next }) });
    const d = await r.json();
    if (r.ok) { setWmsg({ t: "Mot de passe modifié.", ok: true }); setCur(""); setNext(""); setNext2(""); }
    else setWmsg({ t: d.error || "Erreur.", ok: false });
  }

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header><div className="head"><img src="/logo.png" alt="Le Point Chablais" /><a href="/espace">&larr; Mon espace</a></div></header>
      <div className="wrap">
        <h1>Mon compte</h1>

        <div className="card" id="demenagement">
          <h2>Mes coordonnées</h2>
          {pmsg && <div className={"msg " + (pmsg.ok ? "ok" : "err")}>{pmsg.t}</div>}
          <form onSubmit={saveProfile}>
            <label>Nom</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <label>E-mail (identifiant)</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              pattern="[^\s@]+@[^\s@]+\.[^\s@.]{2,}"
              title="Adresse e-mail complète, par exemple nom@domaine.ch"
              autoComplete="email"
              required
            />
            <label>Adresse</label>
            <input id="f-adresse" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Rue, NPA, localité" />
            <button className="btn" type="submit">Enregistrer</button>
          </form>
        </div>

        <div className="card" id="identifiants">
          <h2>Changer mon mot de passe</h2>
          {wmsg && <div className={"msg " + (wmsg.ok ? "ok" : "err")}>{wmsg.t}</div>}
          <form onSubmit={savePwd}>
            <label>Mot de passe actuel</label>
            <div className="pw">
              <input type={showCur ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)} required />
              <EyeBtn shown={showCur} onClick={() => setShowCur((s) => !s)} />
            </div>
            <label>Nouveau mot de passe</label>
            <div className="pw">
              <input type={showNext ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} placeholder="6 caractères minimum" required />
              <EyeBtn shown={showNext} onClick={() => setShowNext((s) => !s)} />
            </div>
            <label>Confirmer le nouveau mot de passe</label>
            <div className="pw">
              <input type={showNext2 ? "text" : "password"} value={next2} onChange={(e) => setNext2(e.target.value)} placeholder="Retapez le mot de passe" autoComplete="new-password" required />
              <EyeBtn shown={showNext2} onClick={() => setShowNext2((s) => !s)} />
            </div>
            <button className="btn" type="submit">Modifier le mot de passe</button>
          </form>
        </div>
      </div>
    </main>
  );
}