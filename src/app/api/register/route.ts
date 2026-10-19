import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { sendMail, welcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "E-mail et mot de passe requis." }, { status: 400 });
  }
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
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
    name: String(name).trim(),
    address: "",
    role: "user",
    plan: null,
    status: "inactive",
    currentPeriodEnd: null,
  });
  await createSession(u.id);
  sendMail({
    to: email,
    subject: "Bienvenue au Point Chablais",
    html: welcomeEmail(String(name).trim()),
  })
    .then((r) => console.log("[register] mail bienvenue →", email, r))
    .catch((e) => console.error("[register] mail bienvenue ERREUR →", e));
  return NextResponse.json({ ok: true });
}