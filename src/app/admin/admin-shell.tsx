"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ADMIN_CSS } from "@/lib/admin-ui";
import { Icon, initials, type IconName } from "./icons";

type Item = { href: string; label: string; icon: IconName };

const DASH: Item = { href: "/admin", label: "Tableau de bord", icon: "grid" };
const MAIN: Item[] = [
  { href: "/admin/membres", label: "Membres", icon: "users" },
  { href: "/admin/abonnements", label: "Abonnements", icon: "card" },
  { href: "/admin/factures", label: "Factures", icon: "file" },
  { href: "/admin/packs", label: "Packs", icon: "box" },
  { href: "/admin/numeros", label: "Numéros (PDF)", icon: "book" },
  { href: "/admin/emails", label: "Emails", icon: "mail" },
];
const OTHERS: Item[] = [
  { href: "/admin/administrateurs", label: "Administrateurs", icon: "shield" },
  { href: "/admin/logs", label: "Logs d'activité", icon: "activity" },
  { href: "/admin/rapports", label: "Rapports", icon: "chart" },
  { href: "/admin/parametres", label: "Paramètres", icon: "settings" },
];

export default function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  const path = usePathname();
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(false); // desktop : sidebar réduite
  const [open, setOpen] = useState(false); // mobile : tiroir ouvert
  const isOn = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  function search(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = "/admin/membres?q=" + encodeURIComponent(q);
  }
  async function logout() { await fetch("/api/logout", { method: "POST" }); window.location.href = "/"; }

  const nav = (it: Item) => (
    <Link key={it.href} href={it.href} title={it.label} className={"nav" + (isOn(it.href) ? " on" : "")} onClick={() => setOpen(false)}>
      <span className="ico"><Icon name={it.icon} size={20} /></span>
      <span className="lbl">{it.label}</span>
      <span className="chev"><Icon name="chevron" size={16} /></span>
    </Link>
  );

  return (
    <div className={"admin" + (collapsed ? " col" : "") + (open ? " open" : "")}>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      <div className="scrim" onClick={() => setOpen(false)} />
      <aside className="side">
        <div className="brand">
          <Link href="/admin" onClick={() => setOpen(false)}><img src="/logo.png" alt="Le Point Chablais" /></Link>
          <button className="burger" aria-label="Réduire le menu" onClick={() => (window.innerWidth <= 900 ? setOpen(false) : setCollapsed((v) => !v))}>
            <Icon name="menu" size={22} />
          </button>
        </div>

        <div className="cat">Menu principal</div>
        {nav(DASH)}
        <div className="sep" />
        {MAIN.map(nav)}

        <div className="spacer" />
        <div className="cat">Autres</div>
        {OTHERS.map(nav)}
        <button className="logout" onClick={logout}><Icon name="logout" size={20} /><span className="lbl">Déconnexion</span></button>
      </aside>

      <div className="main">
        <div className="top">
          <button className="mburger" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><Icon name="menu" size={22} /></button>
          <form className="search" onSubmit={search}>
            <Icon name="search" size={18} />
            <input type="text" placeholder="Rechercher… (membres, factures…)" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="me">
            <Link className="site" href="/" target="_blank">Voir le site <Icon name="external" size={14} /></Link>
            <div className="who">
              <div><div className="nm">{adminName}</div><div className="rl">Admin</div></div>
              <span className="av">{initials(adminName)}</span>
            </div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
