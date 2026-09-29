import { NextResponse } from "next/server";
import { getUserByResetToken, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  if (!password || String(password).length < 6)
    return NextResponse.json({ error: "Mot de passe : 6 caractères minimum." }, { status: 400 });
  const user = await getUserByResetToken(token);
  if (!user || !user.resetExpires || user.resetExpires < Date.now())
    return NextResponse.json({ error: "Lien expiré ou invalide. Refaites une demande." }, { status: 400 });
  await updateUser(user.id, {
    passwordHash: await hashPassword(password),
    resetToken: null,
    resetExpires: null,
  });
  return NextResponse.json({ ok: true });
}
