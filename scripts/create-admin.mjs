// Crée un administrateur (ou promeut un compte existant).
// Usage : npm run admin:create -- email@exemple.ch "Prénom Nom" [--reset-password]
// Mot de passe : ADMIN_PASSWORD si défini, sinon généré et affiché une seule fois.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import "./load-env.mjs";

const args = process.argv.slice(2);
const reset = args.includes("--reset-password");
const [email, name = ""] = args.filter((a) => !a.startsWith("--"));

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Usage : npm run admin:create -- email@exemple.ch "Prénom Nom" [--reset-password]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const c = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z", charset: "UTF8MB4_UNICODE_CI" });
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
const hash = () => bcrypt.hash(password, 10);

try {
  const [rows] = await c.execute("SELECT id FROM users WHERE email = ?", [email]);
  if (rows.length) {
    const id = rows[0].id;
    if (reset) await c.execute("UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?", [await hash(), id]);
    else await c.execute("UPDATE users SET role = 'admin' WHERE id = ?", [id]);
    console.log(`✔ ${email} est administrateur.`);
    if (reset) console.log(`  Mot de passe : ${password}`);
  } else {
    const [res] = await c.execute(
      "INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, 'admin', 'inactive')",
      [email, await hash(), name],
    );
    await c.execute("UPDATE users SET subscriber_no = ? WHERE id = ?", [String(10000 + res.insertId), res.insertId]);
    console.log(`✔ Administrateur créé : ${email}`);
    console.log(`  Mot de passe : ${password}`);
  }
  if (!process.env.ADMIN_PASSWORD) console.log("  (à changer après la première connexion, via /compte)");
} finally {
  await c.end();
}
