// Appel API côté back-office : ne plante jamais, renvoie toujours un message lisible.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ApiResult = { ok: boolean; status: number; data: any; error: string };

export async function call(url: string, init?: RequestInit): Promise<ApiResult> {
  let r: Response;
  try {
    r = await fetch(url, init);
  } catch {
    return { ok: false, status: 0, data: {}, error: "Serveur injoignable (connexion coupée ?)." };
  }
  let data: any = {};
  let text = "";
  try { text = await r.text(); data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (r.ok) return { ok: true, status: r.status, data, error: "" };

  let error = data?.error as string | undefined;
  if (!error) {
    if (r.status === 401 || r.status === 403) error = "Session expirée : reconnectez-vous puis réessayez.";
    else if (r.status === 413) error = "Fichier trop volumineux pour le serveur (limite d'envoi dépassée).";
    else if (r.status === 502 || r.status === 503 || r.status === 504) error = `Le serveur ne répond pas (${r.status}). Réessayez dans un instant.`;
    else error = `Erreur ${r.status}${r.statusText ? " " + r.statusText : ""}.`;
  }
  return { ok: false, status: r.status, data, error };
}

export function postJson(url: string, body: unknown, method = "POST") {
  return call(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
