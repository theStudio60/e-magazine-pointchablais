"use client";

import { useState } from "react";

const CSS = `
:root{--blue:#1c6b8c;--blue-deep:#124f68;--blue-ink:#0e3f53;--mauve:#9c6b91;--mauve-soft:#f4ecf2;--ink:#243138;--muted:#6a7d83;--gray:#f4f6f6;--line:#e5e9ea;}
*{box-sizing:border-box}body{margin:0;background:var(--gray);color:var(--ink);font-family:"Poppins",system-ui,sans-serif}
a{color:var(--blue);text-decoration:none;font-weight:600}
.box{max-width:420px;margin:60px auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:30px}
.box img{height:40px;display:block;margin:0 auto 18px}
h1{color:var(--blue-ink);font-size:22px;margin:0 0 6px;text-align:center}
p.l{color:var(--muted);font-size:14px;text-align:center;margin:0 0 22px}
label{font-size:13px;font-weight:600;display:block;margin:0 0 6px}
input{width:100%;font-family:inherit;font-size:15px;padding:12px 13px;border:1.5px solid var(--line);border-radius:8px;margin-bottom:16px}
input:focus{outline:0;border-color:var(--mauve);box-shadow:0 0 0 4px var(--mauve-soft)}
.btn{width:100%;background:var(--blue);color:#fff;border:0;border-radius:7px;padding:13px;font-weight:600;font-family:inherit;cursor:pointer}
.btn:hover{background:var(--blue-deep)}
.msg{padding:12px;border-radius:8px;font-size:13.5px;margin-bottom:14px}
.msg.ok{background:#e5f4ec;color:#1f7a4d}.msg.err{background:#fdeceb;color:#b3261e}
.center{text-align:center;margin-top:16px;font-size:14px}
`;

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/account/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const d = await r.json();
    setResetUrl(d.resetUrl || null);
    setDone(true);
  }

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="box">
        <a href="/" aria-label="Accueil" style={{ display: "block", width: "fit-content", margin: "0 auto" }}><img src="/logo.png" alt="Le Point Chablais" /></a>
        <h1>Mot de passe oublié</h1>
        <p className="l">Entrez votre e-mail pour recevoir un lien de réinitialisation.</p>
        {!done ? (
          <form onSubmit={submit}>
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ch" required />
            <button className="btn" type="submit">Envoyer le lien</button>
          </form>
        ) : (
          <>
            <div className="msg ok">Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.</div>
            {resetUrl && (
              <div className="msg ok">
                Mode démo (sans e-mail) : <a href={resetUrl}>cliquez ici pour réinitialiser</a>.
              </div>
            )}
          </>
        )}
        <p className="center"><a href="/connexion">Retour à la connexion</a></p>
      </div>
    </main>
  );
}
