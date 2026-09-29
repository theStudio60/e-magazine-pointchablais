"use client";

import { useState } from "react";
import { AUTH_CSS } from "@/lib/styles";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.error || "Erreur de connexion.");
        setLoading(false);
        return;
      }
     // Admin -> back-office ; abonné -> espace. "next" limité aux chemins internes.
      const raw = new URLSearchParams(window.location.search).get("next") || "";
      const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "";
      const isAdmin = d.role === "admin";
      if (isAdmin) window.location.href = next.startsWith("/admin") ? next : "/admin";
      else window.location.href = next && !next.startsWith("/admin") ? next : "/espace";
    } catch {
      setErr("Erreur réseau, réessayez.");
      setLoading(false);
    }
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
            <span className="eye">Espace abonné</span>
            <h1>Content de vous <b>revoir.</b></h1>
            <p>Retrouvez votre magazine numérique, où que vous soyez.</p>
            <ul className="perks">
              <li><Check />Toutes les éditions en numérique</li>
              <li><Check />Lecture sur tous vos écrans</li>
              <li><Check />Disponible dès la parution</li>
            </ul>
          </div>
          <img className="mini" src="/site.jpg" alt="" />
        </aside>

        <section className="side">
          <div className="box fade">
            <h2>Connexion</h2>
            <p className="lead">Connectez-vous avec vos identifiants.</p>

            {err && <p style={{ color: "#b3261e", background: "#fdeceb", border: "1px solid #f6c9c4", padding: "10px 12px", borderRadius: 8, fontSize: 13.5, margin: "0 0 16px" }}>{err}</p>}

            <form onSubmit={onSubmit}>
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
                  <input id="pwd" type={show ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Afficher le mot de passe">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                  </button>
                </div>
              </div>
              <div className="row">
                <label><input type="checkbox" /> Se souvenir de moi</label>
                <a href="/mot-de-passe-oublie">Mot de passe oublié ?</a>
              </div>
              <button className="btn btn-blue" type="submit" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>

            <div className="sep">ou</div>
            <p className="activate">Première connexion ? <a href="/inscription">Créez votre compte</a></p>

            <div className="newsub">
              <p>Pas encore abonné ?</p>
              <a className="btn btn-ghost" href="/#offres">Voir les offres</a>
            </div>
          </div>
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
