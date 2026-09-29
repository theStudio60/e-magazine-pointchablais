import { NextResponse } from "next/server";
import crypto from "crypto";
import { getUserByEmail, updateUser } from "@/lib/db";
import { smtpEnabled, sendMail, mails, appUrl } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const user = email ? await getUserByEmail(email) : undefined;

  // On ne révèle jamais si l'e-mail existe (sécurité).
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomUUID().replace(/-/g, "");
  await updateUser(user.id, { resetToken: token, resetExpires: Date.now() + 3600_000 });
  const resetUrl = `${appUrl(new URL(req.url).origin)}/reinitialiser?token=${token}`;

  if (smtpEnabled) {
    const m = mails.resetPassword(user.name, resetUrl);
    await sendMail(user.email, m.subject, m.html);
    return NextResponse.json({ ok: true });
  }
  // Sans SMTP (démo locale) : on renvoie le lien pour pouvoir tester.
  return NextResponse.json({ ok: true, resetUrl });
}