import { getSessionUserId } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";
import CompteForms from "./compte-forms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Compte() {
  const uid = await getSessionUserId();
  if (!uid) redirect("/connexion?next=/compte");
  const u = await getUserById(uid);
  if (!u) redirect("/connexion?next=/compte");
  return <CompteForms name={u.name} email={u.email} address={u.address} />;
}
