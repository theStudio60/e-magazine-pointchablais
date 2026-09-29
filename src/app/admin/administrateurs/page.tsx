"use client";

import { useCallback, useEffect, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";
import { useConfirm } from "../confirm";

type U = { id: string; email: string; name: string; role: string };

export default function Administrateurs() {
  const [admins, setAdmins] = useState<U[]>([]);
  const { confirm, confirmDialog } = useConfirm();
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [created, setCreated] = useState<{ email: string; pwd: string } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/users?role=admin&size=100");
    if (r.ok) setAdmins((await r.json()).items);
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(t: string, ok = true) { setMsg({ t, ok }); setTimeout(() => setMsg(null), 3500); }

  async function addAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const r = await postJson("/api/admin/users", { email: f.get("email"), name: f.get("name"), role: "admin" });
    if (r.ok) { setCreated({ email: String(f.get("email")), pwd: r.data.tempPassword }); form.reset(); load(); }
    else flash(r.error, false);
  }
  async function demote(a: U) {
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
      {created && <div className="msg ok">Admin créé : <b>{created.email}</b> — mot de passe temporaire : <b>{created.pwd}</b></div>}
      <div className="card">
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Action</th></tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}><td>{a.name || "—"}</td><td>{a.email}</td>
                <td><button className="btn btn-d" onClick={() => demote(a)}>Retirer admin</button></td></tr>
            ))}
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