"use client";

import { useEffect, useState } from "react";
import { AUTH_CSS } from "@/lib/styles";

export default function Inscription() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [vErr, setVErr] = useState("");
  const [vLoading, setVLoading] = useState(false);
  const [info, setInfo] = useState("");

  const [plan, setPlan] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    if (p && /^[a-z0-9-]{1,64}$/i.test(p)) setPlan(p);
  }, []);

  const nextUrl = plan ? `/abonnement?plan=${encodeURIComponent(plan)}` : "/espace";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) { setErr("Veuillez indiquer votre nom."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Erreur lors de la création du compte."); setLoading(false); return; }
      setStep("verify");
      setInfo(d.mailSent ? "" : "L'e-mail n'a pas pu être envoyé — vérifiez votre adresse puis réessayez.");
      setLoading(false);
    } catch {
      setErr("Erreur réseau, réessayez."); setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setVErr("");
    if (!/^\d{6}$/.test(code.trim())) { setVErr("Entrez le code à 6 chiffres reçu par e-mail."); return; }
    setVLoading(true);
    try {
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setVErr(d.error || "Code incorrect."); setVLoading(false); return; }
      window.location.href = nextUrl;
    } catch {
      setVErr("Erreur réseau, réessayez."); setVLoading(false);
    }
  }

  async function resend() {
    setInfo("Envoi d'un nouveau code…");
    try {
      await fetch("/api/verify/resend", { method: "POST" });
      setInfo("Un nouveau code a été envoyé. Vérifiez votre boîte (et les spams).");
    } catch {
      setInfo("Impossible d'envoyer le code, réessayez.");
    }
  }

  function backToForm() {
    setStep("form");
    setCode(""); setVErr(""); setInfo("");
  }

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <header>
        <div className="wrap head">
          <a href="/" aria-label="Accueil" style={{ display: "flex" }}><img src="/logo.png" alt="Le Point Chablais" /></a>
          <a className="back" href="/">&larr; Retour au site</a>
        </div>
      </header>

      <div className="auth">
        <aside className="aside">
          <div className="marks">
            <span style={{ top: "8%", left: "-2%", fontSize: 60, transform: "rotate(-8deg)" }}>Aigle</span>
            <span style={{ top: "30%", left: "58%", fontSize: 52, transform: "rotate(6deg)" }}>Bex</span>
            <span style={{ top: "56%", left: "4%", fontSize: 56, transform: "rotate(-5deg)" }}>Ollon</span>
            <span style={{ top: "74%", left: "40%", fontSize: 50, transform: "rotate(6deg)" }}>Villars</span>
            <span style={{ top: "16%", left: "34%", fontSize: 42, transform: "rotate(4deg)" }}>Leysin</span>
          </div>
          <div className="in fade">
            <span className="eye">Nouvel abonné</span>
            <h1>Rejoignez <b>Le Point Chablais.</b></h1>
            <p>Créez votre compte, puis choisissez votre abonnement numérique.</p>
            <ul className="perks">
              <li><Check />Le journal complet en numérique</li>
              <li><Check />Sur tous vos écrans, dès la parution</li>
              <li><Check />Sans engagement, résiliable à tout moment</li>
            </ul>
          </div>
          <img className="mini" src="/site.jpg" alt="" />
        </aside>

        <section className="side">
          {step === "form" ? (
            <div className="box fade">
              <h2>Créer un compte</h2>
              <p className="lead">Quelques secondes suffisent.</p>

              {err && <p style={{ color: "#b3261e", background: "#fdeceb", border: "1px solid #f6c9c4", padding: "10px 12px", borderRadius: 8, fontSize: 13.5, margin: "0 0 16px" }}>{err}</p>}

              <form onSubmit={onSubmit}>
                <div className="field">
                  <label htmlFor="name">Nom</label>
                  <div className="inp">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    <input id="name" type="text" placeholder="Votre nom" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="email">E-mail</label>
                  <div className="inp">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    <input id="email" type="email" placeholder="vous@exemple.ch" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="pwd">Mot de passe</label>
                  <div className="inp">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8 10V8a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.8" /></svg>
                    <input id="pwd" type={show ? "text" : "password"} placeholder="6 caractères minimum" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Afficher le mot de passe">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                    </button>
                  </div>
                </div>
                <button className="btn btn-blue" type="submit" disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Création…" : "Créer mon compte"}
                </button>
              </form>

              <div className="sep">ou</div>
              <p className="activate">Déjà un compte ? <a href="/connexion">Se connecter</a></p>
            </div>
          ) : (
            <div className="box fade">
              <h2>Vérifiez votre e-mail</h2>
              <p className="lead">Nous avons envoyé un code à 6 chiffres à :</p>
              <p style={{ fontWeight: 700, color: "#0e3f53", fontSize: 15.5, margin: "0 0 18px", wordBreak: "break-all" }}>{email}</p>

              {vErr && <p style={{ color: "#b3261e", background: "#fdeceb", border: "1px solid #f6c9c4", padding: "10px 12px", borderRadius: 8, fontSize: 13.5, margin: "0 0 14px" }}>{vErr}</p>}
              {info && <p style={{ color: "#1f7a4d", background: "#e5f4ec", border: "1px solid #bfe3cf", padding: "10px 12px", borderRadius: 8, fontSize: 13.5, margin: "0 0 14px" }}>{info}</p>}

              <form onSubmit={onVerify}>
                <div className="field">
                  <label htmlFor="code">Code de vérification</label>
                  <div className="inp">
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      style={{ letterSpacing: "6px", fontSize: 18, fontWeight: 700 }}
                      required
                    />
                  </div>
                </div>
                <button className="btn btn-blue" type="submit" disabled={vLoading} style={{ width: "100%" }}>
                  {vLoading ? "Vérification…" : "Vérifier et continuer"}
                </button>
              </form>

              <p className="activate" style={{ marginTop: 16 }}>
                Pas reçu ?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); resend(); }}>Renvoyer le code</a>
                {"  ·  "}
                <a href="#" onClick={(e) => { e.preventDefault(); backToForm(); }}>Corriger l'adresse</a>
              </p>
            </div>
          )}
        </section>
      </div>

      <footer>
        <div className="wrap ft">
          <span>© 2026 Le Point Chablais</span>
          <span className="dot">·</span><a href="#">Conditions d&apos;abonnement</a>
          <span className="dot">·</span><a href="#">Politique de confidentialité</a>
        </div>
      </footer>
    </main>
  );
}

function Check() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.14)" /><path d="M7 12.5l3 3 7-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}