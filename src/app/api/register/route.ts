import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendMail, verifyCodeEmail } from "@/lib/email";
import { SignJWT } from "jose";

export const runtime = "nodejs";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "E-mail et mot de passe requis." }, { status: 400 });
  if (!name || !String(name).trim()) return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  if (String(password).length < 6) return NextResponse.json({ error: "Mot de passe : 6 caractères minimum." }, { status: 400 });
  if (await getUserByEmail(email)) return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres

  // Le compte n'est PAS créé : nom + e-mail + hash + code vivent dans un jeton signé (cookie httpOnly 15 min).
  const token = await new SignJWT({ email: String(email), name: String(name).trim(), passwordHash, code })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());

  const sent = await sendMail({
    to: email,
    subject: "Votre code de vérification - Le Point Chablais",
    html: verifyCodeEmail(String(name).trim(), code),
  });

  const out = NextResponse.json({ ok: true, verify: true, mailSent: !!sent.ok });
  out.cookies.set("pc_pending", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 15 * 60,
  });
  return out;
}