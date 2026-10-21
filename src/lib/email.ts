import nodemailer, { type Transporter } from "nodemailer";

let _t: Transporter | null = null;

function transporter() {
  if (_t) return _t;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  _t = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL ; 587 = STARTTLS
    auth: { user, pass },
  });
  return _t;
}

type Mail = { to: string; subject: string; html: string; text?: string };

export async function sendMail({ to, subject, html, text }: Mail) {
  const t = transporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@pointchablais.ch";

  console.log(`[email] → tentative d'envoi à "${to}" — sujet: "${subject}"`);

  if (!t) {
    console.warn(`[email] ⚠️ SMTP NON CONFIGURÉ — mail ignoré pour "${to}"`);
    return { ok: false, skipped: true };
  }
  try {
    const info = await t.sendMail({ from, to, subject, html, text: text || html.replace(/<[^>]+>/g, " ") });
    console.log(`[email] ✅ ENVOYÉ à "${to}" — id: ${info.messageId}`);
    return { ok: true, id: info.messageId };
  } catch (e) {
    console.error(`[email] ❌ ÉCHEC pour "${to}":`, e instanceof Error ? e.message : e);
    return { ok: false, error: String(e) };
  }
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
      <div style="background:#5b2a86;color:#fff;padding:22px 28px;font-size:20px;font-weight:700">Le Point Chablais</div>
      <div style="padding:28px">
        <h1 style="font-size:19px;margin:0 0 14px">${title}</h1>
        ${body}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #eee;font-size:12px;color:#888">
        Magazine régional — Aigle, Bex et environs · abo.pointchablais.ch
      </div>
    </div>
  </div></body></html>`;
}

export function welcomeEmail(name: string) {
  return layout(
    `Bienvenue${name ? ", " + name : ""} !`,
    `<p style="line-height:1.6">Votre compte est créé. Vous pouvez dès maintenant choisir votre abonnement numérique et lire votre magazine sur tous vos écrans.</p>
     <p style="margin:22px 0"><a href="https://abo.pointchablais.ch/abonnement" style="background:#5b2a86;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9px;display:inline-block;font-weight:600">Choisir mon abonnement</a></p>
     <p style="line-height:1.6;color:#555">Sans engagement, résiliable à tout moment.</p>`
  );
}

export function passwordChangedEmail(name: string) {
  return layout(
    "Votre mot de passe a été modifié",
    `<p style="line-height:1.6">Bonjour${name ? " " + name : ""},</p>
     <p style="line-height:1.6">Le mot de passe de votre compte vient d'être changé. Si vous êtes à l'origine de cette modification, aucune action n'est requise.</p>
     <p style="line-height:1.6;color:#b00020">Si ce n'est pas vous, contactez-nous immédiatement à abo@pointchablais.ch.</p>`
  );
}

export function verifyCodeEmail(name: string, code: string) {
  return layout(
    `Bienvenue${name ? ", " + name : ""} !`,
    `<p style="line-height:1.6">Pour activer votre compte, saisissez ce code de vérification :</p>
     <p style="text-align:center;margin:24px 0"><span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#5b2a86;background:#f4ecf2;padding:14px 22px;border-radius:10px">${code}</span></p>
     <p style="line-height:1.6;color:#555">Ce code est valable 15 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.</p>`
  );
}