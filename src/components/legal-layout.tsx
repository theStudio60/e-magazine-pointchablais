import type { ReactNode } from "react";

const CSS = `
:root{--blue:#1c6b8c;--blue-deep:#124f68;--blue-ink:#0e3f53;--mauve:#9c6b91;--ink:#243138;--muted:#6a7d83;--gray:#f4f6f6;--line:#e5e9ea;}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font-family:"Poppins",system-ui,sans-serif;line-height:1.7}
a{color:var(--blue);text-decoration:none}
header{background:#fff;border-bottom:1px solid var(--line)}
.head{display:flex;align-items:center;justify-content:space-between;max-width:820px;margin:0 auto;padding:14px 24px}
.head img{height:38px}.head a{color:var(--muted);font-weight:500;font-size:14px}.head a:hover{color:var(--blue)}
.wrap{max-width:820px;margin:0 auto;padding:36px 24px 70px}
h1{color:var(--blue-ink);font-size:28px;margin:0 0 6px}
.note{background:#fff4e0;color:#8a5a12;border:1px solid #f0e2c4;border-radius:10px;padding:12px 14px;font-size:13.5px;margin:14px 0 28px}
h2{color:var(--blue-ink);font-size:18px;margin:26px 0 8px}
p,li{font-size:15px;color:var(--ink)}
footer{background:var(--blue-ink);color:#bcd3da;text-align:center;padding:22px;font-size:13px}
footer a{color:#cfe0e6}
`;

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header>
        <div className="head">
          <a href="/" aria-label="Accueil" style={{ display: "flex" }}><img src="/logo.png" alt="Le Point Chablais" /></a>
          <a href="/">&larr; Retour au site</a>
        </div>
      </header>
      <div className="wrap">
        <h1>{title}</h1>
        <div className="note">
         
        </div>
        {children}
      </div>
      <footer>
        Le Point Chablais · Rue Centrale 9, 1892 Lavey-Village · <a href="mailto:zoe@pointchablais.ch">zoe@pointchablais.ch</a>
      </footer>
    </main>
  );
}
