"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";
import { useConfirm } from "../confirm";

type U = { id: string; email: string; name: string; role: string };

export default function Administrateurs() {
  const [admins, setAdmins] = useState<U[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [created, setCreated] = useState<{ email: string; emailSent: boolean; pwd?: string } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/users?role=admin&size=100");
    if (r.ok) {
      const d = await r.json();
      setAdmins(d.items);
      setMeId(d.me ?? null);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 3500); }

  async function addAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const r = await postJson("/api/admin/users", { email: f.get("email"), name: f.get("name"), role: "admin" });
    if (r.ok) {
      setCreated({ email: String(f.get("email")), emailSent: !!r.data.emailSent, pwd: r.data.tempPassword });
      form.reset(); load();
    } else flash(r.error, false);
  }
  async function demote(a: U) {
    if (a.id === meId) { flash("Vous ne pouvez pas retirer vos propres droits d'administrateur.", false); return; }
    const ok = await confirm({
      title: "Retirer les droits admin ?",
      message: <><b>{a.name || a.email}</b> n&apos;aura plus accès au back-office.</>,
      confirmLabel: "Retirer",
      danger: true,
    });
    if (!ok) return;
    const id = a.id;
    const r = await postJson(`/api/admin/users/${id}`, { role: "user" }, "PATCH");
    if (r.ok) { flash("Droits retirés."); load(); } else flash(r.error, false);
  }

  return (
    <>
      <h1 className="t">Administrateurs</h1>
      <p className="sub">Comptes ayant accès au back-office.</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      {created && (created.emailSent ? (
        <div className="msg ok">Administrateur créé. Un e-mail a été envoyé à <b>{created.email}</b> pour qu&apos;il choisisse son mot de passe.</div>
      ) : (
        <div className="msg ok">
          Administrateur créé : <b>{created.email}</b>. L&apos;e-mail n&apos;a pas pu être envoyé (SMTP non configuré ou erreur d&apos;envoi)- mot de passe temporaire : <b>{created.pwd}</b>
        </div>
      ))}
      <div className="card">
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Action</th></tr></thead>
          <tbody>
            {admins.map((a) => {
              const isMe = a.id === meId;
              return (
                <tr key={a.id}>
                  <td>{a.name || "—"}{isMe && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "#9c6b91" }}>Vous</span>}</td>
                  <td>{a.email}</td>
                  <td>
                    <button
                      className="btn btn-d"
                      onClick={() => demote(a)}
                      disabled={isMe}
                      title={isMe ? "Vous ne pouvez pas retirer vos propres droits d'administrateur." : undefined}
                      style={isMe ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                    >
                      Retirer admin
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Ajouter un administrateur</h2>
        <form onSubmit={addAdmin}>
          <div className="grid2">
            <div className="field"><label>Nom</label><input name="name" type="text" /></div>
            <div className="field"><label>E-mail *</label><input name="email" type="email" required /></div>
          </div>
          <button className="btn btn-b" type="submit">Créer l&apos;administrateur</button>
        </form>
      </div>
      {confirmDialog}
    </>
  );
}