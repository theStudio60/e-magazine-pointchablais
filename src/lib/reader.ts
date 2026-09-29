import { getSessionUserId } from "./auth";
import { getUserById, getSettings, type User, type Edition } from "./db";

// Accès à la liseuse : abonné actif (ou administrateur) + numéro publié.
export async function readerAccess(
  id: string,
): Promise<{ ok: true; user: User; edition: Edition } | { ok: false; status: number; error: string }> {
  if (!/^ed\d+$/.test(id)) return { ok: false, status: 404, error: "Introuvable" };
  const edition = (await getSettings()).editions.find((e) => e.id === id);
  if (!edition) return { ok: false, status: 404, error: "Introuvable" };
  const uid = await getSessionUserId();
  const user = uid ? await getUserById(uid) : undefined;
  if (!user) return { ok: false, status: 401, error: "Connexion requise" };
  if (user.role !== "admin" && user.status !== "active")
    return { ok: false, status: 403, error: "Accès réservé aux abonnés actifs" };
  return { ok: true, user, edition };
}

export const watermarkLabel = (u: User) =>
  u.role === "admin" ? `Admin ${u.email}` : `Abonné n° ${u.subscriberNo}`;