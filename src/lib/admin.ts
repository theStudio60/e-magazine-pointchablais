import { NextResponse } from "next/server";
import { getSessionUserId } from "./auth";
import { getUserById, type User } from "./db";

export async function requireAdmin(): Promise<User | null> {
  const uid = await getSessionUserId();
  const u = uid ? await getUserById(uid) : undefined;
  return u && u.role === "admin" ? u : null;
}

// Enveloppe un handler : toute exception devient une réponse JSON lisible
// (au lieu d'une page 500 vide qui affichait juste « Erreur »).
export function safe<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("[admin api]", e);
      const m = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Erreur serveur : " + m }, { status: 500 });
    }
  };
}
