"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { call, postJson } from "@/lib/admin-fetch";

type Em = { id: string; ts: string; from: string; subject: string; audience: string; count: number; status: string };

const EDITOR_CSS = `
.rte{border:1.5px solid #e5e9ea;border-radius:10px;background:#fff;overflow:hidden;width:100%}
.rte-url{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #e5e9ea;background:#f4ecf2}
.rte-url span{font-size:13px;font-weight:600;color:#7d5074}
.rte-url input{flex:1 1 220px;margin:0;padding:8px 10px;font-size:14px;border:1.5px solid #e5e9ea;border-radius:6px;background:#fff}
.rte-url button{height:34px;padding:0 14px;border:0;border-radius:6px;font:600 14px inherit;font-family:inherit;cursor:pointer}
.rte-url .ok{background:#1c6b8c;color:#fff}
.rte-url .cancel{background:#fff;color:#243138;border:1px solid #d3dce0}
.rte:focus-within{border-color:#9c6b91;box-shadow:0 0 0 4px #f4ecf2}
.rte-bar{display:flex;flex-wrap:wrap;gap:4px;padding:8px;border-bottom:1px solid #e5e9ea;background:#f8fafa}
.rte-bar button{min-width:34px;height:34px;padding:0 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:#243138;font:600 14px inherit;font-family:inherit;cursor:pointer}
.rte-bar button:hover{background:#e9eef0;border-color:#d3dce0}
.rte-bar .sep{width:1px;background:#e5e9ea;margin:4px 4px}
.rte-area{height:260px;min-height:260px;max-height:260px;overflow-y:auto;padding:14px 16px;font-size:15px;line-height:1.6;outline:0;resize:none;word-break:break-word}
.rte-area:empty:before{content:attr(data-placeholder);color:#8a9aa0}
.rte-area img{max-width:100%;height:auto;border-radius:6px;cursor:pointer}
.rte-area a{color:#1c6b8c;text-decoration:underline}
.rte-area ul,.rte-area ol{padding-left:22px}
.rte-hint{font-size:12.5px;color:#6a7d83;margin-top:6px}
`;

function safeUrl(u: string, allowMail: boolean): string | null {
  const s = u.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (allowMail && /^mailto:[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/i.test(s)) return s;
  if (allowMail && /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(s)) return "mailto:" + s;
  return null;
}

export default function Emails() {
  const [rows, setRows] = useState<Em[]>([]);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [urlBar, setUrlBar] = useState<{ type: "link" | "image"; value: string } | null>(null);
  const [urlErr, setUrlErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imgSel, setImgSel] = useState<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/emails"); if (r.ok) setRows((await r.json()).emails);
  }, []);
  useEffect(() => { load(); }, [load]);

  function saveSel() {
    const s = window.getSelection();
    if (s && s.rangeCount && editor.current?.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
  }
  function restoreSel() {
    const s = window.getSelection();
    if (s && savedRange.current) { s.removeAllRanges(); s.addRange(savedRange.current); }
  }
  function exec(cmd: string, value?: string) {
    editor.current?.focus();
    restoreSel();
    document.execCommand(cmd, false, value);
    saveSel();
  }
  function openUrlBar(type: "link" | "image") {
    saveSel();
    setUrlErr("");
    setUrlBar({ type, value: "https://" });
  }
  function confirmUrl() {
    if (!urlBar) return;
    const url = safeUrl(urlBar.value, urlBar.type === "link");
    if (!url) {
      setUrlErr(urlBar.type === "link"
        ? "Adresse invalide : elle doit commencer par https:// (ou être une adresse e-mail)."
        : "Adresse invalide : elle doit commencer par https://.");
      return;
    }
    if (urlBar.type === "link") {
      exec("createLink", url);
      editor.current?.querySelectorAll("a").forEach((a) => { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); });
    } else {
      exec("insertImage", url);
    }
    setUrlBar(null);
    setUrlErr("");
  }
  async function uploadFile(file: File) {
    setUrlErr("");
    if (file.size > 2 * 1024 * 1024) { setUrlErr("Image trop lourde (2 Mo maximum)."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/emails/upload", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setUrlErr(d.error || "Échec de l'envoi de l'image."); return; }
      exec("insertImage", d.url);
      setUrlBar(null);
    } catch {
      setUrlErr("Erreur réseau, réessayez.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  const addLink = () => openUrlBar("link");
  const addImage = () => openUrlBar("image");

  // Redimensionne l'image sélectionnée (inscrit la taille dans l'image → respectée dans l'e-mail).
  function setImgWidth(w: string) {
    if (!imgSel) return;
    imgSel.style.width = w;
    imgSel.style.height = "auto";
    imgSel.style.maxWidth = "100%";
    imgSel.style.display = "block";
  }
  // Sélectionne l'image cliquée (contour visuel) ou désélectionne.
  function onEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.target as HTMLElement;
    editor.current?.querySelectorAll("img").forEach((im) => (im.style.outline = ""));
    if (el.tagName === "IMG") {
      (el as HTMLImageElement).style.outline = "2px solid #9c6b91";
      setImgSel(el as HTMLImageElement);
    } else setImgSel(null);
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const el = editor.current;
    // Retire le contour de sélection avant d'envoyer (ne doit pas finir dans le mail).
    el?.querySelectorAll("img").forEach((im) => (im.style.outline = ""));
    setImgSel(null);
    const html = el?.innerHTML.trim() || "";
    const hasContent = !!el && (el.textContent?.trim() || el.querySelector("img"));
    if (!hasContent) { setMsg({ t: "Le message est vide.", ok: false }); return; }
    const r = await postJson("/api/admin/emails", { subject: f.get("subject"), body: html, audience: f.get("audience") });
    const d = r.data;
    if (r.ok) {
      setMsg({ t: d.smtp ? `E-mail envoyé à ${d.email.count} destinataire(s).` : `Campagne enregistrée (${d.email.count} destinataires). Aucun SMTP configuré : brancher un service e-mail en production.`, ok: true });
      form.reset(); if (el) el.innerHTML = ""; load();
    } else setMsg({ t: r.error, ok: false });
  }
  const fmt = (iso: string) => new Date(iso).toLocaleString("fr-CH");
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />
      <h1 className="t">Emails</h1>
      <p className="sub">Envoyez une annonce à vos abonnés (nouveau numéro, information…).</p>
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <div className="card">
        <h2>Nouvelle campagne</h2>
        <form onSubmit={send}>
          <div className="field"><label>Destinataires</label>
            <select name="audience" style={{ maxWidth: 260 }}><option value="tous">Tous les abonnés</option><option value="actifs">Abonnés actifs seulement</option></select>
          </div>
          <div className="field"><label>Sujet</label><input name="subject" type="text" required /></div>
          <div className="field">
            <label>Message</label>
            <div className="rte">
              <div className="rte-bar" onMouseDown={(e) => e.preventDefault()}>
                <button type="button" title="Gras" onClick={() => exec("bold")}><b>G</b></button>
                <button type="button" title="Italique" onClick={() => exec("italic")}><i>I</i></button>
                <button type="button" title="Souligné" onClick={() => exec("underline")}><u>S</u></button>
                <span className="sep" />
                <button type="button" title="Liste à puces" onClick={() => exec("insertUnorderedList")}>• Liste</button>
                <button type="button" title="Liste numérotée" onClick={() => exec("insertOrderedList")}>1. Liste</button>
                <span className="sep" />
                <button type="button" title="Ajouter un lien" onClick={addLink}>Lien</button>
                <button type="button" title="Ajouter une image" onClick={addImage}>Image</button>
                <span className="sep" />
                <button type="button" title="Effacer la mise en forme" onClick={() => exec("removeFormat")}>Effacer</button>
              </div>
              {imgSel && (
                <div className="rte-url" style={{ background: "#eef5f7" }}>
                  <span>Taille de l&apos;image</span>
                  <button type="button" className="ok" onClick={() => setImgWidth("160px")}>Petite</button>
                  <button type="button" className="ok" onClick={() => setImgWidth("320px")}>Moyenne</button>
                  <button type="button" className="ok" onClick={() => setImgWidth("100%")}>Pleine largeur</button>
                  <button type="button" className="cancel" onClick={() => { if (imgSel) imgSel.style.outline = ""; setImgSel(null); }}>Fermer</button>
                </div>
              )}
              {urlBar && (
                <div className="rte-url">
                  {urlBar.type === "image" && (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                      />
                      <button type="button" className="ok" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading ? "Envoi…" : "Choisir une image"}
                      </button>
                    </>
                  )}
                  {urlBar.type === "link" && (
                    <>
                      <span>Adresse du lien</span>
                      <input
                        type="text"
                        autoFocus
                        value={urlBar.value}
                        onChange={(e) => setUrlBar({ ...urlBar, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); confirmUrl(); }
                          if (e.key === "Escape") { setUrlBar(null); setUrlErr(""); }
                        }}
                        placeholder="https://exemple.ch ou nom@exemple.ch"
                      />
                      <button type="button" className="ok" onClick={confirmUrl}>Insérer</button>
                    </>
                  )}
                  <button type="button" className="cancel" onClick={() => { setUrlBar(null); setUrlErr(""); }}>Annuler</button>
                  {urlErr && <div style={{ flexBasis: "100%", color: "#b3261e", fontSize: 13 }}>{urlErr}</div>}
                </div>
              )}
              <div
                ref={editor}
                className="rte-area"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="Message"
                data-placeholder="Écrivez votre message…"
                onKeyUp={saveSel}
                onMouseUp={saveSel}
                onBlur={saveSel}
                onPaste={onPaste}
                onClick={onEditorClick}
              />
            </div>
            <div className="rte-hint">Astuce : cliquez sur une image insérée pour choisir sa taille (Petite / Moyenne / Pleine largeur). Images JPG, PNG, GIF, WebP, 2 Mo max.</div>
          </div>
          <button className="btn btn-b" type="submit">Envoyer</button>
        </form>
      </div>
      <div className="card">
        <h2>Historique</h2>
        <table>
          <thead><tr><th>Date</th><th>Sujet</th><th>Destinataires</th><th>Statut</th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}><td>{fmt(m.ts)}</td><td>{m.subject}</td><td>{m.audience} ({m.count})</td>
                <td><span className={"pill " + (m.status === "envoye" ? "a" : "w")}>{m.status === "envoye" ? "Envoyé" : "En file"}</span></td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>Aucune campagne.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}