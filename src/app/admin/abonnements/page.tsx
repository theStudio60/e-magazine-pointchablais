"use client";

import { useCallback, useEffect, useState } from "react";
import { useConfirm } from "../confirm";

type U = { id: string; email: string; name: string; subscriberNo: string; plan: string | null; status: string; currentPeriodEnd: string | null };

export default function Abonnements() {
  const [items, setItems] = useState<U[]>([]);
  const [msg, setMsg] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/users?status=active&size=100");
    if (r.ok) setItems((await r.json()).items.filter((u: U & { role?: string }) => (u as { role?: string }).role !== "admin"));
  }, []);
  useEffect(() => { load(); }, [load]);
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-CH") : "—");
  async function deactivate(u: U) {
    const ok = await confirm({
      title: "Résilier cet abonnement ?",
      message: <>L&apos;abonnement de <b>{u.name || u.email}</b> sera désactivé immédiatement : il n&apos;aura plus accès aux numéros. Vous pourrez le réactiver depuis <b>Membres</b>.</>,
      confirmLabel: "Résilier",
      danger: true,
    });
    if (!ok) return;
    const id = u.id;
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "inactive" }) });
    setMsg("Abonnement résilié."); setTimeout(() => setMsg(""), 3000); load();
  }
  return (
    <>
      <h1 className="t">Abonnements</h1>
      <p className="sub">{items.length} abonnement(s) actif(s).</p>
      {msg && <div className="msg ok">{msg}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Abonné</th><th>N°</th><th>Formule</th><th>Échéance</th><th>Action</th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.name || "—"}<br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{u.email}</span></td>
                <td>{u.subscriberNo}</td>
                <td style={{ textTransform: "capitalize" }}>{u.plan || "—"}</td>
                <td>{fmt(u.currentPeriodEnd)}</td>
                <td><button className="btn btn-d" onClick={() => deactivate(u)}>Résilier</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} style={{ color: "var(--muted)" }}>Aucun abonnement actif.</td></tr>}
          </tbody>
        </table>
      </div>
      {confirmDialog}
    </>
  );
}