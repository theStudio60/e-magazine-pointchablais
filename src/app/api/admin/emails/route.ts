import { NextResponse } from "next/server";
import { requireAdmin, safe } from "@/lib/admin";
import { listUsers, listEmails, addEmail } from "@/lib/db";
import { smtpEnabled, sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

// Enrobe le HTML de l'éditeur dans une mise en page e-mail propre.
function wrapHtml(inner: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f6;font-family:Arial,Helvetica,sans-serif;color:#243138">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #e5e9ea;border-radius:12px;overflow:hidden">
      <div style="background:#0e3f53;color:#fff;padding:18px 24px;font-weight:700;font-size:18px">Le Point Chablais</div>
      <div style="padding:24px;font-size:15px;line-height:1.6">${inner}</div>
      <div style="padding:16px 24px;background:#f4f6f6;color:#6a7d83;font-size:12px;border-top:1px solid #e5e9ea">Le Point Chablais- Aigle, Bex et environs</div>
    </div>
  </div></body></html>`;
}

// GET : historique des campagnes.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  return NextResponse.json({ emails: await listEmails() });
}

// POST : envoi d'une campagne (JSON : subject, body HTML, audience).
export const POST = safe(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { subject, body, audience } = await req.json().catch(() => ({}));
  if (!subject || !String(subject).trim()) return NextResponse.json({ error: "Le sujet est requis." }, { status: 400 });
  if (!body || !String(body).trim()) return NextResponse.json({ error: "Le message est vide." }, { status: 400 });

  const aud = audience === "actifs" ? "actifs" : "tous";
  const members = (await listUsers()).filter((u) => u.role !== "admin");
  const recipients = aud === "actifs" ? members.filter((u) => u.status === "active") : members;

  const html = wrapHtml(String(body));
  let sentCount = 0;
  if (smtpEnabled) {
    for (const u of recipients) {
      const ok = await sendMail(u.email, String(subject).trim(), html);
      if (ok) sentCount++;
    }
  }

  const email = await addEmail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "",
    subject: String(subject).trim(),
    body: String(body),
    audience: aud,
    count: recipients.length,
    status: smtpEnabled ? "envoye" : "en_file",
  });

  return NextResponse.json({ ok: true, smtp: smtpEnabled, sent: sentCount, email });
});