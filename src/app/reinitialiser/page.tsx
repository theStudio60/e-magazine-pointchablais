"use client";

import { useEffect, useState } from "react";

const CSS = `
:root{--blue:#1c6b8c;--blue-deep:#124f68;--blue-ink:#0e3f53;--mauve:#9c6b91;--mauve-soft:#f4ecf2;--ink:#243138;--muted:#6a7d83;--gray:#f4f6f6;--line:#e5e9ea;}
*{box-sizing:border-box}body{margin:0;background:var(--gray);color:var(--ink);font-family:"Poppins",system-ui,sans-serif}
a{color:var(--blue);text-decoration:none;font-weight:600}
.box{max-width:420px;margin:60px auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:30px}
.box img{height:40px;display:block;margin:0 auto 18px}
h1{color:var(--blue-ink);font-size:22px;margin:0 0 20px;text-align:center}
label{font-size:13px;font-weight:600;display:block;margin:0 0 6px}
input{width:100%;font-family:inherit;font-size:15px;padding:12px 13px;border:1.5px solid var(--line);border-radius:8px;margin-bottom:16px}
input:focus{outline:0;border-color:var(--mauve);box-shadow:0 0 0 4px var(--mauve-soft)}
.btn{width:100%;background:var(--blue);color:#fff;border:0;border-radius:7px;padding:13px;font-weight:600;font-family:inherit;cursor:pointer}
.btn:hover{background:var(--blue-deep)}
.msg{padding:12px;border-radius:8px;font-size:13.5px;margin-bottom:14px}
.msg.ok{background:#e5f4ec;color:#1f7a4d}.msg.err{background:#fdeceb;color:#b3261e}
.center{text-align:center;margin-top:16px;font-size:14px}
`;

export default function Reset() {
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 6) return setMsg({ t: "Mot de passe : 6 caractères minimum.", ok: false });
    if (pwd !== pwd2) return setMsg({ t: "Les deux mots de passe ne correspondent pas.", ok: false });
    setLoading(true);
    const r = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pwd }) });
    const d = await r.json();
    setLoading(false);
    if (r.ok) {
      setDone(true);
      setMsg({ t: "Votre mot de passe a bien été modifié. Redirection vers la connexion…", ok: true });
      setTimeout(() => { window.location.href = "/connexion"; }, 2500);
    } else setMsg({ t: d.error || "Erreur.", ok: false });
  }

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="box">
        <a href="/" aria-label="Accueil" style={{ display: "block", width: "fit-content", margin: "0 auto" }}><img src="/logo.png" alt="Le Point Chablais" /></a>
        <h1>Nouveau mot de passe</h1>
        {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
        {!done ? (
          <form onSubmit={submit}>
            <label>Nouveau mot de passe</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="6 caractères minimum" autoComplete="new-password" required />
            <label>Confirmer le mot de passe</label>
            <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="Retapez le mot de passe" autoComplete="new-password" required />
            <button className="btn" type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Réinitialiser"}</button>
          </form>
        ) : (
          <p className="center"><a href="/connexion">Se connecter</a></p>
        )}
      </div>
    </main>
  );
}