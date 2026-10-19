import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const port = Number(process.env.SMTP_PORT || 587);
console.log("HOST =", process.env.SMTP_HOST, "| PORT =", port, "| secure =", port === 465, "| USER =", process.env.SMTP_USER);

const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

try {
  await t.verify();
  console.log("✅ Connexion SMTP OK");
  const info = await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.SMTP_USER,
    subject: "Test Point Chablais",
    text: "SMTP OK.",
  });
  console.log("✅ Envoyé:", info.messageId);
} catch (e) {
  console.error("❌ Erreur SMTP:", e.message);
}