// Thème du back-office. Pour changer la couleur principale : modifier --primary (et --primary-dark).
export const ADMIN_CSS = `
:root{--primary:#2b6cde;--primary-dark:#1f57bf;--primary-soft:#eaf1fd;--ink:#111827;--text:#374151;--muted:#6b7280;--bg:#f6f7fb;--line:#e8ebf1;--red:#ef4444;--red-dark:#dc2626}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Poppins",system-ui,sans-serif}
a{color:inherit;text-decoration:none}
button{font-family:inherit}

/* ---------- Layout ---------- */
.admin{display:flex;min-height:100vh;width:100%}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.content{padding:26px 28px 60px;width:100%}
.scrim{display:none}

/* ---------- Sidebar ---------- */
.side{width:264px;flex:0 0 264px;background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;padding:18px 14px 16px;position:sticky;top:0;height:100vh;overflow-y:auto;overflow-x:hidden;z-index:40;transition:width .2s,flex-basis .2s}
.side .brand{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 6px 20px;min-height:58px}
.side .brand img{height:36px;width:auto;max-width:168px;display:block}
.side .burger{border:0;background:transparent;color:#4b5563;cursor:pointer;padding:7px;border-radius:9px;display:flex}
.side .burger:hover{background:#f1f3f8}
.side .cat{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink);margin:6px 10px 10px;white-space:nowrap}
.side .nav{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;font-size:14.5px;font-weight:500;color:#1f2937;margin-bottom:3px;white-space:nowrap}
.side .nav .ico{color:#4b5563;display:flex}
.side .nav .chev{margin-left:auto;color:#9ca3af;display:flex}
.side .nav:hover{background:#f4f6fa}
.side .nav.on{background:#edf0f7;font-weight:600}
.side .nav.on .ico{color:var(--primary)}
.side .sep{height:1px;background:var(--line);margin:10px 8px 12px}
.side .spacer{flex:1;min-height:20px}
.side .logout{margin-top:12px;display:flex;align-items:center;justify-content:flex-start;gap:12px;width:100%;border:0;background:var(--red);color:#fff;font-size:14.5px;font-weight:600;padding:13px 16px;border-radius:10px;cursor:pointer;white-space:nowrap}
.side .logout:hover{background:var(--red-dark)}

/* sidebar réduite (bureau) */
@media(min-width:901px){
  .col .side{width:80px;flex-basis:80px;padding-left:12px;padding-right:12px}
  .col .side .lbl,.col .side .chev,.col .side .cat,.col .side .brand img{display:none}
  .col .side .brand{justify-content:center;padding-left:0;padding-right:0}
  .col .side .nav,.col .side .logout{justify-content:center;padding-left:0;padding-right:0}
  .col .side .sep{margin-left:4px;margin-right:4px}
}

/* ---------- Barre du haut ---------- */
.top{background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:16px;padding:0 28px;height:76px;position:sticky;top:0;z-index:20}
.top .mburger{display:none;border:0;background:transparent;color:#374151;cursor:pointer;padding:6px;border-radius:9px}
.top .search{flex:1;max-width:560px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:0 16px;height:46px;color:var(--muted)}
.top .search:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
.top .search input[type=text]{border:0;background:transparent;outline:0;width:100%;padding:0;height:100%;font-size:14px;border-radius:0}
.top .me{margin-left:auto;display:flex;align-items:center;gap:20px}
.top .site{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px;white-space:nowrap}
.top .site:hover{color:var(--primary)}
.top .who{display:flex;align-items:center;gap:12px;padding-left:20px;border-left:1px solid var(--line)}
.top .who .nm{font-weight:600;font-size:14.5px;text-align:right;line-height:1.25}
.top .who .rl{font-size:12px;color:var(--muted);text-align:right}
.av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#5b95f2,#2b6cde);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none}

/* ---------- Titres ---------- */
h1.t{margin:0 0 4px;color:var(--ink);font-size:26px;font-weight:700}
p.sub{margin:0 0 24px;color:var(--muted);font-size:14px}

/* ---------- Cartes de stats ---------- */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:22px}
.stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;display:flex;gap:16px;align-items:center}
.stat .ic{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;flex:0 0 auto}
.stat .ic.blue{background:linear-gradient(135deg,#3aa3f8,#2b83e6)}
.stat .ic.green{background:linear-gradient(135deg,#1fc9a0,#12a97f)}
.stat .ic.pink{background:linear-gradient(135deg,#f0579a,#e0357f)}
.stat .ic.purple{background:linear-gradient(135deg,#9a6cf7,#7c4ce6)}
.stat .ic.orange{background:linear-gradient(135deg,#fba34a,#f0800f)}
.stat .n{font-size:28px;font-weight:700;color:var(--ink);line-height:1.05}
.stat .l{color:var(--muted);font-size:13px;margin-top:4px}

/* ---------- Cartes / tableaux ---------- */
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:22px;overflow-x:auto}
.card.flush{padding:0}
.card h2{margin:0 0 16px;color:var(--ink);font-size:17px;font-weight:600}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:14px 18px;border-bottom:1px solid var(--line);vertical-align:middle}
th{color:#1f2937;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
tbody tr:hover{background:#fafbfd}
tbody tr:last-child td{border-bottom:0}
input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary);cursor:pointer}
.pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid transparent;white-space:nowrap}
.pill.a{background:#e8f8ee;color:#15803d;border-color:#c9efd7}
.pill.i{background:#f3f4f6;color:#374151;border-color:#e5e7eb}
.pill.w{background:#fff4e0;color:#8a5a12;border-color:#fde3b4}
.mem{display:flex;align-items:center;gap:12px;min-width:200px}
.mav{width:36px;height:36px;border-radius:10px;background:#4a63e0;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none}
.mem .nm{font-weight:600;font-size:14px;line-height:1.3}
.mem .sb{color:var(--muted);font-size:12.5px}
.muted{color:var(--muted)}

/* ---------- Boutons / champs ---------- */
.btn{border:0;border-radius:10px;padding:10px 16px;font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-b{background:var(--primary);color:#fff}.btn-b:hover{background:var(--primary-dark)}
.btn-o{background:#fff;border:1px solid var(--line);color:var(--ink)}.btn-o:hover{border-color:var(--primary);color:var(--primary)}
.btn-d{background:#fff;border:1px solid #f6c9c6;color:#b3261e}.btn-d:hover{background:#fdeceb}
.btn-m{background:#7c4ce6;color:#fff}
select,input[type=text],input[type=email],input[type=number],input[type=date],textarea{font-family:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;width:100%;color:var(--ink)}
input[type=file]{font-family:inherit;font-size:13.5px;width:100%;padding:7px 10px;border:1px dashed #cfd6e2;border-radius:10px;background:#fafbfd;color:var(--muted)}
input[type=file]::file-selector-button{border:0;border-radius:8px;background:var(--primary-soft);color:var(--primary);font-weight:600;font-family:inherit;padding:8px 14px;margin-right:12px;cursor:pointer}
input[type=file]::file-selector-button:hover{background:#dbe8fc}
select:focus,input:focus,textarea:focus{outline:0;border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
label{font-size:13px;font-weight:600;display:block;margin:0 0 6px}
.field{margin-bottom:16px}
.row-act{display:flex;gap:6px;flex-wrap:wrap}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.msg{padding:12px 14px;border-radius:10px;font-size:13.5px;margin-bottom:16px}
.msg.ok{background:#e8f8ee;color:#15803d}.msg.err{background:#fdeceb;color:#b3261e}

/* ---------- Barre d'outils / pagination / menu ---------- */
.tools{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
.tools .sbox{flex:1;min-width:200px;display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:10px;padding:0 14px;height:42px;color:var(--muted)}
.tools .sbox:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
.tools .sbox input[type=text]{border:0;outline:0;background:transparent;padding:0;height:100%;box-shadow:none}
.tools select{width:auto;height:42px}
.tools .sel{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px}
.tfoot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 20px;border-top:1px solid var(--line);font-size:13.5px;color:var(--muted)}
.pg{display:flex;gap:8px;align-items:center}
.pg button{min-width:38px;height:38px;padding:0 12px;border-radius:9px;border:1px solid var(--line);background:#fff;cursor:pointer;font-size:13.5px;color:var(--text);display:inline-flex;align-items:center;justify-content:center;gap:6px}
.pg button:hover:not(:disabled){border-color:var(--primary);color:var(--primary)}
.pg button.on{background:var(--primary);border-color:var(--primary);color:#fff}
.pg button:disabled{opacity:.45;cursor:not-allowed}
.kebab{border:0;background:transparent;width:34px;height:34px;border-radius:8px;cursor:pointer;color:#4b5563;display:inline-flex;align-items:center;justify-content:center}
.kebab:hover{background:#eef1f6}
.menu{position:fixed;z-index:80;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 32px rgba(17,24,39,.14);padding:6px;min-width:210px}
.menu button{display:flex;width:100%;align-items:center;gap:10px;padding:9px 12px;border:0;background:transparent;border-radius:8px;font-size:13.5px;cursor:pointer;text-align:left;color:var(--ink)}
.menu button:hover{background:#f3f5f9}
.menu button.danger{color:var(--red-dark)}.menu button.danger:hover{background:#fdeceb}
.menu .lab{font-size:11px;text-transform:uppercase;color:var(--muted);padding:8px 12px 4px;font-weight:700;letter-spacing:.05em}
.menu .tick{margin-left:auto;color:var(--primary);display:flex}
.menu hr{border:0;border-top:1px solid var(--line);margin:6px 4px}

/* ---------- Divers ---------- */
.eds{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
.edc{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}
.edc img{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:top;display:block;background:#eee}
.edc .b{padding:12px 14px}
.list .it{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 4px;border-bottom:1px solid var(--line)}
.list .it:last-child{border-bottom:0}
.list .who{display:flex;align-items:center;gap:12px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
.toolbar .grow{flex:1;min-width:180px}

/* ---------- Responsive ---------- */
@media(max-width:1100px){.stats{grid-template-columns:1fr 1fr}}
@media(max-width:900px){
  .cols{grid-template-columns:1fr}
  .side{position:fixed;left:0;top:0;bottom:0;transform:translateX(-100%);transition:transform .22s;box-shadow:0 0 40px rgba(0,0,0,.18)}
  .open .side{transform:none}
  .open .scrim{display:block;position:fixed;inset:0;background:rgba(17,24,39,.35);z-index:35}
  .top{padding:0 14px}
  .top .mburger{display:flex}
  .top .site{display:none}
  .top .who .nm,.top .who .rl{display:none}
  .top .who{border-left:0;padding-left:0}
  .content{padding:20px 14px 50px}
}
@media(max-width:640px){.grid2{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr;gap:12px}.stat{padding:14px;gap:12px}.stat .ic{width:42px;height:42px;border-radius:12px}.stat .n{font-size:21px}.stat .l{font-size:12px}}
/* ---------- Modale de confirmation ---------- */
.btn-red{background:var(--red);color:#fff}.btn-red:hover{background:var(--red-dark)}
.cf-ov{position:fixed;inset:0;z-index:100;background:rgba(17,24,39,.45);display:flex;align-items:center;justify-content:center;padding:16px;animation:cf-in .12s ease-out}
.cf-box{background:#fff;border-radius:16px;width:100%;max-width:420px;padding:24px;box-shadow:0 20px 50px rgba(17,24,39,.25)}
.cf-box h3{margin:0 0 8px;font-size:18px;color:var(--ink)}
.cf-msg{color:var(--text);font-size:14px;line-height:1.55}
.cf-act{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}
@keyframes cf-in{from{opacity:0}to{opacity:1}}
@media(max-width:480px){.cf-act{flex-direction:column-reverse}.cf-act .btn{justify-content:center}}
`;
