import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { listEmails, addEmail, listUsers, addLog } from "@/lib/db";
import { smtpEnabled, sendMail, mails, appUrl } from "@/lib/mailer";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  return NextResponse.json({ emails: await listEmails() });
}

export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const { subject, body, audience } = await req.json().catch(() => ({}));
  if (!subject || !body) return NextResponse.json({ error: "Sujet et message requis." }, { status: 400 });
  const users = (await listUsers()).filter((u) => u.role !== "admin");
  const targets = audience === "actifs" ? users.filter((u) => u.status === "active") : users;
  // Envoi individuel (les adresses ne sont jamais visibles entre abonnés).
  let sent = 0;
  if (smtpEnabled) {
    const m = mails.campaign(String(subject), String(body), `${appUrl(new URL(req.url).origin)}/espace`);
    for (const u of targets) if (await sendMail(u.email, m.subject, m.html)) sent++;
  }
  const em = await addEmail({
    from: admin.email,
    subject, body,
    audience: audience === "actifs" ? "Abonnés actifs" : "Tous les abonnés",
    count: smtpEnabled ? sent : targets.length,
    status: smtpEnabled && sent > 0 ? "envoye" : "en_file",
  });
  await addLog(admin.email, "E-mail", `${subject} → ${em.count} destinataire(s) (${em.status})`);
  return NextResponse.json({ ok: true, email: em, smtp: smtpEnabled });
});