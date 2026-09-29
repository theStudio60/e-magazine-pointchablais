"use client";

import { useState } from "react";

export default function PayButton({ plan }: { plan: string }) {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    if (!agree || loading) return;
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) {
        setErr(d.error || "Impossible de démarrer le paiement.");
        setLoading(false);
        return;
      }
      window.location.href = d.url;
    } catch {
      setErr("Erreur réseau, réessayez.");
      setLoading(false);
    }
  }

  return (
    <div>
      {err && (
        <p style={{ color: "#b3261e", background: "#fdeceb", border: "1px solid #f6c9c4", padding: "10px 12px", borderRadius: 8, fontSize: 13.5, margin: "16px 0 0" }}>{err}</p>
      )}
      <label className="cgv">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>J&apos;ai lu et j&apos;accepte les <a href="/conditions-abonnement" target="_blank" rel="noreferrer">conditions d&apos;abonnement</a> et la <a href="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>.</span>
      </label>
      <button className="btn btn-blue" onClick={pay} disabled={!agree || loading} style={{ width: "100%", marginTop: 14, opacity: agree ? 1 : 0.55 }}>
        {loading ? "Redirection…" : "Payer avec Stripe"}
      </button>
      <p style={{ color: "var(--muted)", fontSize: 12.5, textAlign: "center", margin: "12px 0 0" }}>
        Paiement sécurisé via Stripe · Visa, Mastercard
      </p>
    </div>
  );
}