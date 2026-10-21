import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendMail, verifyCodeEmail } from "@/lib/email";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const runtime = "nodejs";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);
type Pending = JWTPayload & { email: string; name: string; passwordHash: string; code: string };

export async function POST() {
  const token = (await cookies()).get("pc_pending")?.value;
  if (!token) return NextResponse.json({ ok: true });

  let data: Pending;
  try { data = (await jwtVerify(token, secret())).payload as Pending; } catch { return NextResponse.json({ ok: true }); }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const newToken = await new SignJWT({ email: data.email, name: data.name, passwordHash: data.passwordHash, code })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("15m").sign(secret());
  await sendMail({ to: data.email, subject: "Votre code de vérification - Le Point Chablais", html: verifyCodeEmail(data.name || "", code) });

  const out = NextResponse.json({ ok: true });
  out.cookies.set("pc_pending", newToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 15 * 60 });
  return out;
}