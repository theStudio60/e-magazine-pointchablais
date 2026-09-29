import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getUserById, getUserByEmail, updateUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  const user = uid ? await getUserById(uid) : undefined;
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { name, email, address } = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof name === "string") patch.name = name;
  if (typeof address === "string") patch.address = address;
  if (typeof email === "string" && email && email.toLowerCase() !== user.email.toLowerCase()) {
    const other = await getUserByEmail(email);
    if (other && other.id !== user.id)
      return NextResponse.json({ error: "Cet e-mail est déjà utilisé." }, { status: 409 });
    patch.email = email;
  }
  await updateUser(user.id, patch);
  return NextResponse.json({ ok: true });
}
