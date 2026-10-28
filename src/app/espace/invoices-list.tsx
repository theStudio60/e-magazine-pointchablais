"use client";

import { useState } from "react";

type Inv = { id: string; number: string; date: string; amount: number; status: string };

const fmt = (iso: string) => { try { return new Date(iso).toLocaleDateString("fr-CH"); } catch { return "—"; } };

export default function InvoicesList({ invoices }: { invoices: Inv[] }) {
  const [shown, setShown] = useState(6);
  const list = invoices.slice(0, shown);
  return (
    <div className="panel">
      {list.map((inv) => (
        <div className="subrow" key={inv.id} style={{ gap: 12, flexWrap: "wrap" }}>
          <span className="k">
            {inv.number} · {fmt(inv.date)} · {(inv.amount / 100).toFixed(2)} CHF · {inv.status === "paye" ? "Payée" : "En attente"}
          </span>
          <span className="v">
            <a className="btn btn-blue" href={`/api/account/invoice/${inv.id}`}>Télécharger</a>
          </span>
        </div>
      ))}
      {shown < invoices.length && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button className="btn btn-o" onClick={() => setShown((s) => s + 6)}>
            Afficher plus ({invoices.length - shown} restantes)
          </button>
        </div>
      )}
    </div>
  );
}