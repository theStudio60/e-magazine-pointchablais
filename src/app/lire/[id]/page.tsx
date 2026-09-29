import { redirect } from "next/navigation";
import { readerAccess } from "@/lib/reader";
import { editionInfo } from "@/lib/pdf-render";
import Reader from "./reader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Lire({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await readerAccess(id);
  if (!a.ok) {
    if (a.status === 401) redirect(`/connexion?next=/lire/${id}`);
    redirect("/espace");
  }
  const info = await editionInfo(id).catch((e) => {
    console.error("[liseuse]", id, e);
    return null;
  });
  const back = a.user.role === "admin" ? "/admin/numeros" : "/espace#editions";

  return (
    <Reader
      id={id}
      title={a.edition.title}
      date={a.edition.date}
      pages={info?.pages ?? 0}
      ratio={info?.ratio ?? 1.414}
      back={back}
    />
  );
}