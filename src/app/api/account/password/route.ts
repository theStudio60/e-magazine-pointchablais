import { NextResponse } from "next/server";
import { getSessionUserId, verifyPassword, hashPassword } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  const user = uid ? await getUserById(uid) : undefined;
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 6)
    return NextResponse.json({ error: "Nouveau mot de passe : 6 caractères minimum." }, { status: 400 });
  if (!(await verifyPassword(current || "", user.passwordHash)))
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
  await updateUser(user.id, { passwordHash: await hashPassword(next) });
  return NextResponse.json({ ok: true });
}
