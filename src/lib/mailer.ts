import nodemailer, { type Transporter } from "nodemailer";

// ---------------------------------------------------------------------------
// Configuration (variables d'environnement)
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME,
// ADMIN_ALERT_EMAIL (destinataire des alertes), APP_URL (liens dans les e-mails)
// ---------------------------------------------------------------------------
export const smtpEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const g = globalThis as unknown as { __pcMailer?: Transporter };

function transporter(): Transporter {
  if (!g.__pcMailer) {
    const port = Number(process.env.SMTP_PORT || 587);
    g.__pcMailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL direct ; 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return g.__pcMailer;
}

const FROM_EMAIL = () => process.env.MAIL_FROM || process.env.SMTP_USER || "";
const FROM_NAME = () => process.env.MAIL_FROM_NAME || "Le Point Chablais";

export function appUrl(fallbackOrigin?: string): string {
  return (process.env.APP_URL || fallbackOrigin || "http://localhost:3000").replace(/\/$/, "");
}

// Envoi : ne lève jamais d'erreur (un e-mail raté ne doit pas casser un paiement).
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!smtpEnabled || !to) return false;
  try {
    await transporter().sendMail({
      from: { name: FROM_NAME(), address: FROM_EMAIL() },
      to,
      subject,
      html,
      text: htmlToText(html),
    });
    return true;
  } catch (e) {
    console.error("[mail] échec d'envoi à", to, "-", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function sendAdminAlert(subject: string, html: string): Promise<boolean> {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) return false;
  return sendMail(to, `[Admin] ${subject}`, html);
}

// ---------------------------------------------------------------------------
// Mise en page commune
// ---------------------------------------------------------------------------
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<(br|\/p|\/div|\/h1|\/h2|\/tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function layout(title: string, body: string, cta?: { label: string; url: string }): string {
  const button = cta
    ? `<p style="margin:28px 0 8px"><a href="${cta.url}" style="background:#1c6b8c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:6px;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f6;font-family:Arial,Helvetica,sans-serif;color:#243138">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f6;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e9ea;border-radius:12px;overflow:hidden">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e5e9ea">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#1c6b8c;letter-spacing:.5px;line-height:1">LE POINT</div>
<div style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#1c6b8c;letter-spacing:4px">Chablais</div>
</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:20px;color:#0e3f53">${esc(title)}</h1>
<div style="font-size:15px;line-height:1.6">${body}</div>
${button}
</td></tr>
<tr><td style="padding:18px 28px;background:#0e3f53;color:#bcd3da;font-size:12px;line-height:1.5">
Le Point Chablais — Aigle, Bex et environs<br>Vous recevez cet e-mail en lien avec votre compte abonné.
</td></tr>
</table></td></tr></table></body></html>`;
}

const chf = (centimes: number) => `CHF ${(centimes / 100).toFixed(2)}`;
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-CH") : "—");
const hello = (name: string) => `<p>Bonjour ${esc(name || "")},</p>`;

// ---------------------------------------------------------------------------
// Modèles
// ---------------------------------------------------------------------------
export const mails = {
  resetPassword(name: string, url: string) {
    return {
      subject: "Réinitialisation de votre mot de passe",
      html: layout(
        "Réinitialiser votre mot de passe",
        `${hello(name)}<p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable <b>1 heure</b>.</p>
<p style="color:#6a7d83;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>`,
        { label: "Choisir un nouveau mot de passe", url },
      ),
    };
  },

  paymentReceived(name: string, plan: string, amount: number, periodEnd: string | null, url: string) {
    return {
      subject: "Paiement reçu — merci !",
      html: layout(
        "Merci, votre paiement est confirmé",
        `${hello(name)}<p>Nous avons bien reçu votre paiement de <b>${chf(amount)}</b> pour votre abonnement <b>${esc(plan)}</b> au Point Chablais.</p>
<p>Votre abonnement est actif jusqu'au <b>${date(periodEnd)}</b> et se renouvelle automatiquement. La facture est disponible dans votre espace.</p>`,
        { label: "Lire le magazine", url },
      ),
    };
  },

  paymentFailed(name: string, url: string) {
    return {
      subject: "Problème avec votre paiement",
      html: layout(
        "Votre paiement n'a pas pu être effectué",
        `${hello(name)}<p>Le renouvellement de votre abonnement n'a pas pu être débité (carte expirée, refusée ou fonds insuffisants).</p>
<p>Nous allons réessayer automatiquement dans les prochains jours. Pour éviter une interruption, vérifiez votre moyen de paiement.</p>`,
        { label: "Accéder à mon espace", url },
      ),
    };
  },

  subscriptionEnded(name: string, url: string) {
    return {
      subject: "Votre abonnement est terminé",
      html: layout(
        "Votre abonnement a pris fin",
        `${hello(name)}<p>Votre abonnement numérique au Point Chablais est terminé. Vous n'avez plus accès aux numéros.</p>
<p>Vous pouvez vous réabonner à tout moment en quelques clics.</p>`,
        { label: "Me réabonner", url },
      ),
    };
  },

  renewalReminder(name: string, plan: string, amount: number, when: string | null, url: string) {
    return {
      subject: "Votre abonnement se renouvelle bientôt",
      html: layout(
        "Renouvellement à venir",
        `${hello(name)}<p>Votre abonnement <b>${esc(plan)}</b> sera renouvelé automatiquement le <b>${date(when)}</b> pour <b>${chf(amount)}</b>.</p>
<p>Aucune action n'est nécessaire. Si vous souhaitez résilier ou changer de moyen de paiement, rendez-vous dans votre espace avant cette date.</p>`,
        { label: "Mon espace", url },
      ),
    };
  },

  campaign(subject: string, body: string, url: string) {
    const html = esc(body).replace(/\n/g, "<br>");
    return { subject, html: layout(subject, `<p>${html}</p>`, { label: "Ouvrir mon espace", url }) };
  },

  adminAlert(title: string, lines: [string, string][]) {
    const rows = lines
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6a7d83">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`)
      .join("");
    return { subject: title, html: layout(title, `<table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>`) };
  },
};