import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const u = email ? await getUserByEmail(email) : undefined;
  if (!u || !(await verifyPassword(password || "", u.passwordHash))) {
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
  }
  await createSession(u.id);
  return NextResponse.json({ ok: true, role: u.role });
}
