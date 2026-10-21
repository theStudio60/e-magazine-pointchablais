import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, createUser } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jwtVerify, type JWTPayload } from "jose";

export const runtime = "nodejs";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

type Pending = JWTPayload & { email: string; name: string; passwordHash: string; code: string };

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ error: "Code requis." }, { status: 400 });

  const token = (await cookies()).get("pc_pending")?.value;
  if (!token) return NextResponse.json({ error: "Session expirée. Recommencez l'inscription." }, { status: 400 });

  let data: Pending;
  try {
    data = (await jwtVerify(token, secret())).payload as Pending;
  } catch {
    return NextResponse.json({ error: "Code expiré. Recommencez l'inscription." }, { status: 400 });
  }

  if (String(code).trim() !== data.code) return NextResponse.json({ error: "Code incorrect." }, { status: 400 });

  // E-mail prouvé → on crée le compte maintenant.
  let user = await getUserByEmail(data.email);
  if (!user) {
    user = await createUser({
      email: data.email, passwordHash: data.passwordHash, name: data.name, address: "",
      role: "user", plan: null, status: "inactive", currentPeriodEnd: null,
    });
  }
  await createSession(user.id);

  const out = NextResponse.json({ ok: true });
  out.cookies.set("pc_pending", "", { httpOnly: true, path: "/", maxAge: 0 });
  return out;
}