import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminShell from "./admin-shell";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/connexion?next=/admin");
  return <AdminShell adminName={admin.name || admin.email}>{children}</AdminShell>;
}
