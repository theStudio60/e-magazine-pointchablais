"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CSS = `
:root{--blue:#1c6b8c;--blue-ink:#0e3f53;--mauve:#9c6b91;--gray:#e9edee;--muted:#6a7d83}
*{box-sizing:border-box}
html,body{margin:0;background:var(--gray);font-family:"Poppins",system-ui,sans-serif;color:#243138}
.rd-bar{position:sticky;top:0;z-index:20;background:var(--blue-ink);color:#fff;display:flex;align-items:center;gap:12px;padding:10px 16px;box-shadow:0 2px 10px rgba(0,0,0,.18)}
.rd-back{color:#cfe2e8;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.rd-back:hover{color:#fff}
.rd-title{flex:1;min-width:0;text-align:center;font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rd-title span{color:#9fc0cb;font-weight:400;margin-left:8px}
.rd-tools{display:flex;align-items:center;gap:6px}
.rd-btn{background:rgba(255,255,255,.1);border:0;color:#fff;width:36px;height:36px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-family:inherit}
.rd-btn:hover{background:rgba(255,255,255,.2)}
.rd-btn:disabled{opacity:.35;cursor:default}
.rd-count{font-size:13px;min-width:64px;text-align:center;color:#cfe2e8;font-variant-numeric:tabular-nums}
.rd-pages{display:flex;flex-direction:column;align-items:center;gap:18px;padding:22px 12px 60px}
.rd-page{position:relative;width:100%;background:#fff;box-shadow:0 6px 24px -10px rgba(14,63,83,.35);border-radius:2px;overflow:hidden}
.rd-page img{position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none;pointer-events:none}
.rd-page .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#b6c3c7;font-size:13px}
.rd-shield{position:absolute;inset:0;z-index:2}
.rd-empty{max-width:420px;margin:80px auto;text-align:center;color:var(--muted)}
.rd-wrap{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
@media(max-width:640px){
  .rd-bar{padding:8px 10px;gap:8px}
  .rd-back .lbl,.rd-title span,.rd-zoom{display:none}
  .rd-title{font-size:14px;text-align:left}
  .rd-btn{width:34px;height:34px}
  .rd-count{min-width:52px}
  .rd-pages{padding:12px 6px 40px;gap:10px}
}
@media print{body{display:none!important}}
`;

const ZOOMS = [1, 1.3, 1.65, 2];
const BASE = 860; // largeur d'une page à 100 %

export default function Reader({
  id, title, date, pages, ratio, back,
}: { id: string; title: string; date: string; pages: number; ratio: number; back: string }) {
  const [zoom, setZoom] = useState(0);
  const [current, setCurrent] = useState(1);
  const [hiRes, setHiRes] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  // Résolution des images selon l'écran (et le zoom).
  useEffect(() => {
    const decide = () => {
      const shown = Math.min(window.innerWidth, BASE * ZOOMS[zoom]);
      setHiRes(shown * (window.devicePixelRatio || 1) > 1000);
    };
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, [zoom]);

  // Page courante (celle la plus visible).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setCurrent(Number((vis.target as HTMLElement).dataset.n));
      },
      { threshold: [0.25, 0.5, 0.75] },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [pages]);

  const go = useCallback(
    (n: number) => {
      const t = Math.min(pages, Math.max(1, n));
      refs.current[t - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [pages],
  );

  // Clavier + protections légères (clic droit, enregistrer, imprimer).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) { e.preventDefault(); return; }
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(current + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(current - 1); }
    };
    const noCtx = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", noCtx);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("contextmenu", noCtx);
    };
  }, [current, go]);

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const w = hiRes ? 1500 : 900;

  return (
    <main className="rd-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rd-bar">
        <a className="rd-back" href={back}>← <span className="lbl">Mes éditions</span></a>
        <div className="rd-title">{title}<span>{date}</span></div>
        <div className="rd-tools">
          <button className="rd-btn" onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Page précédente">‹</button>
          <span className="rd-count">{pages ? `${current} / ${pages}` : "—"}</span>
          <button className="rd-btn" onClick={() => go(current + 1)} disabled={current >= pages} aria-label="Page suivante">›</button>
          <button className="rd-btn rd-zoom" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0} aria-label="Dézoomer">−</button>
          <button className="rd-btn rd-zoom" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoom === ZOOMS.length - 1} aria-label="Zoomer">+</button>
          <button className="rd-btn" onClick={fullscreen} aria-label="Plein écran">⛶</button>
        </div>
      </div>

      {pages === 0 ? (
        <p className="rd-empty">Ce numéro n&apos;est pas disponible pour le moment.</p>
      ) : (
        <div className="rd-pages">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              data-n={n}
              ref={(el) => { refs.current[n - 1] = el; }}
              className="rd-page"
              style={{ maxWidth: BASE * ZOOMS[zoom], aspectRatio: `1 / ${ratio}` }}
            >
              <span className="ph">Page {n}</span>
              <img src={`/api/edition/${id}/page/${n}?w=${w}`} alt={`Page ${n}`} loading={n <= 2 ? "eager" : "lazy"} draggable={false} />
              <div className="rd-shield" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}