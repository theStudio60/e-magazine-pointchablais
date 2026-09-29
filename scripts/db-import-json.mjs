// Import unique data/db.json -> MariaDB (idempotent). Usage : npm run db:import-json
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import "./load-env.mjs";

const file = path.resolve(process.argv[2] || "data/db.json");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`Fichier introuvable : ${file}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(file, "utf8"));
const d = (s) => (s ? new Date(s) : null);
const nn = (v) => (v === undefined ? null : v);

const c = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  timezone: "Z",
  charset: "UTF8MB4_UNICODE_CI",
});

const count = { users: 0, packs: 0, editions: 0, invoices: 0, logs: 0, emails: 0 };

try {
  await c.beginTransaction();

  // Users
  const userIds = new Set();
  for (const u of db.users ?? []) {
    const id = Number(u.id);
    userIds.add(id);
    await c.execute(
      `INSERT INTO users (id, email, password_hash, name, address, subscriber_no, role, plan, status,
         current_period_end, payment_method, reset_token, reset_expires, stripe_customer_id,
         stripe_subscription_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), password_hash = VALUES(password_hash),
         name = VALUES(name), address = VALUES(address), subscriber_no = VALUES(subscriber_no),
         role = VALUES(role), plan = VALUES(plan), status = VALUES(status),
         current_period_end = VALUES(current_period_end), payment_method = VALUES(payment_method),
         reset_token = VALUES(reset_token), reset_expires = VALUES(reset_expires),
         stripe_customer_id = VALUES(stripe_customer_id),
         stripe_subscription_id = VALUES(stripe_subscription_id), created_at = VALUES(created_at)`,
      [
        id,
        u.email.trim(),
        u.passwordHash,
        u.name ?? "",
        u.address ?? "",
        u.subscriberNo ?? String(10000 + id),
        u.role ?? "user",
        nn(u.plan),
        u.status ?? "inactive",
        d(u.currentPeriodEnd),
        nn(u.paymentMethod),
        nn(u.resetToken),
        nn(u.resetExpires),
        nn(u.stripeCustomerId),
        nn(u.stripeSubscriptionId),
        d(u.createdAt) ?? new Date(),
      ],
    );
    count.users++;
  }

  // Packs
  const packs = db.settings?.packs ?? [];
  if (packs.length) {
    await c.execute("DELETE FROM packs");
    for (const [i, p] of packs.entries()) {
      await c.execute(
        "INSERT INTO packs (`key`, name, billing_interval, price, active, recommended, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [p.key, p.name, p.interval, Math.round(Number(p.price)), p.active ? 1 : 0, p.recommended ? 1 : 0, i],
      );
      count.packs++;
    }
  }

  // Éditions (ordre du tableau conservé via position)
  for (const [i, e] of (db.settings?.editions ?? []).entries()) {
    const m = /^ed(\d+)$/.exec(e.id);
    if (m) {
      await c.execute(
        `INSERT INTO editions (seq, id, date_label, title, publish_at, position) VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE date_label = VALUES(date_label), title = VALUES(title),
           publish_at = VALUES(publish_at), position = VALUES(position)`,
        [Number(m[1]), e.id, e.date, e.title || "Le Point Chablais", nn(e.publishAt), i],
      );
    } else {
      await c.execute(
        `INSERT INTO editions (id, date_label, title, publish_at, position) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE date_label = VALUES(date_label), title = VALUES(title),
           publish_at = VALUES(publish_at), position = VALUES(position)`,
        [e.id, e.date, e.title || "Le Point Chablais", nn(e.publishAt), i],
      );
    }
    count.editions++;
  }

  // Site
  if (db.settings?.site) {
    await c.execute(
      "INSERT INTO settings (k, v) VALUES ('site', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)",
      [JSON.stringify(db.settings.site)],
    );
  }

  // Factures
  for (const inv of db.invoices ?? []) {
    const uid = Number(inv.userId);
    await c.execute(
      `INSERT INTO invoices (id, number, user_id, user_name, user_email, amount, plan, status, \`date\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE number = VALUES(number), user_id = VALUES(user_id),
         user_name = VALUES(user_name), user_email = VALUES(user_email), amount = VALUES(amount),
         plan = VALUES(plan), status = VALUES(status), \`date\` = VALUES(\`date\`)`,
      [
        Number(inv.id),
        inv.number,
        userIds.has(uid) ? uid : null,
        inv.userName ?? "",
        inv.userEmail ?? "",
        Math.round(Number(inv.amount)),
        inv.plan ?? "",
        inv.status,
        d(inv.date) ?? new Date(),
      ],
    );
    count.invoices++;
  }

  // Logs
  for (const l of db.logs ?? []) {
    await c.execute(
      "INSERT IGNORE INTO logs (id, ts, actor, action, detail) VALUES (?, ?, ?, ?, ?)",
      [l.id, d(l.ts) ?? new Date(), l.actor ?? "", l.action ?? "", l.detail ?? ""],
    );
    count.logs++;
  }

  // Emails
  for (const m of db.emails ?? []) {
    await c.execute(
      `INSERT IGNORE INTO emails (id, ts, from_addr, subject, body, audience, recipients, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, d(m.ts) ?? new Date(), m.from ?? "", m.subject ?? "", m.body ?? "", m.audience ?? "", Number(m.count ?? 0), m.status],
    );
    count.emails++;
  }

  await c.commit();
} catch (e) {
  await c.rollback();
  console.error("Migration annulée (rollback) :", e.message);
  await c.end();
  process.exit(1);
}

// Compteurs : ne jamais réutiliser un id déjà attribué dans le JSON (ALTER = commit implicite, hors transaction)
if (db.seq) await c.query(`ALTER TABLE users AUTO_INCREMENT = ${Number(db.seq) + 1}`);
if (db.edSeq) await c.query(`ALTER TABLE editions AUTO_INCREMENT = ${Number(db.edSeq) + 1}`);
if (db.invSeq) await c.query(`ALTER TABLE invoices AUTO_INCREMENT = ${Number(db.invSeq) + 1}`);

await c.end();
console.log("Migration OK :", count);

// Anciens fichiers uploadés -> storage/ (data/covers, protected/editions)
const storage = path.resolve(process.env.STORAGE_DIR || "storage");
const moves = [
  ["data/covers", path.join(storage, "covers"), ".jpg"],
  ["protected/editions", path.join(storage, "editions"), ".pdf"],
];
let copied = 0;
for (const [from, to, ext] of moves) {
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from).filter((x) => x.endsWith(ext))) {
    const dest = path.join(to, f);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(from, f), dest);
      copied++;
    }
  }
}
if (copied) console.log(`Fichiers copiés vers ${storage} : ${copied}`);

