import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "E-mail et mot de passe requis." }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Mot de passe : 6 caractères minimum." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 409 });
  }
  const passwordHash = await hashPassword(password);
  const u = await createUser({
    email,
    passwordHash,
    name: name || "",
    address: "",
    role: "user",
    plan: null,
    status: "inactive",
    currentPeriodEnd: null,
  });
  await createSession(u.id);
  return NextResponse.json({ ok: true });
}
