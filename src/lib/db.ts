import mysql, {
  type Pool,
  type PoolConnection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";

export type Role = "admin" | "user";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  address: string;
  subscriberNo: string;
  role: Role;
  plan: string | null;
  status: "active" | "inactive";
  currentPeriodEnd: string | null;
  paymentMethod?: string;
  createdAt?: string;
  resetToken?: string | null;
  resetExpires?: number | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export type Edition = { id: string; date: string; title: string; publishAt?: string | null };

export type Pack = {
  key: string;
  name: string;
  interval: "month" | "year";
  price: number; // centimes
  active: boolean;
  recommended?: boolean;
};

export type Invoice = {
  id: string;
  number: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number; // centimes
  plan: string;
  status: "paye" | "en_attente";
  date: string;
};

export type Log = { id: string; ts: string; actor: string; action: string; detail: string };

export type EmailMsg = {
  id: string;
  ts: string;
  from: string;
  subject: string;
  body: string;
  audience: string;
  count: number;
  status: "envoye" | "en_file";
};

export type Site = { contactEmail: string; address: string; heroTitle: string };

export type Settings = {
  packs: Pack[];
  editions: Edition[];
  site: Site;
};

const DEFAULT_SITE: Site = {
  contactEmail: "zoe@pointchablais.ch",
  address: "Rue Centrale 9, 1892 Lavey-Village",
  heroTitle: "Le journal qui réunit Aigle, Bex et le Chablais.",
};

// ---------------------------------------------------------------------------
// Pool (réutilisé entre les rechargements à chaud en dev)
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __pcPool?: Pool };

function pool(): Pool {
  if (!g.__pcPool) {
    const uri = process.env.DATABASE_URL;
    if (!uri) throw new Error("DATABASE_URL manquant (.env.local / variables d'environnement).");
    g.__pcPool = mysql.createPool({
      uri,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      waitForConnections: true,
      timezone: "Z",
      charset: "UTF8MB4_UNICODE_CI",
      supportBigNumbers: true,
      enableKeepAlive: true,
    });
  }
  return g.__pcPool;
}

type Param = string | number | boolean | Date | null;
const n = (v: unknown): Param => (v === undefined ? null : (v as Param));

async function select<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool().execute<T[]>(sql, params.map(n));
  return rows;
}

async function run(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [res] = await pool().execute<ResultSetHeader>(sql, params.map(n));
  return res;
}

async function tx<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
  const c = await pool().getConnection();
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);
const toDate = (s: string | null | undefined): Date | null => (s ? new Date(s) : null);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
type UserRow = RowDataPacket & {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  address: string;
  subscriber_no: string | null;
  role: Role;
  plan: string | null;
  status: "active" | "inactive";
  current_period_end: Date | null;
  payment_method: string | null;
  created_at: Date;
  reset_token: string | null;
  reset_expires: number | string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function toUser(r: UserRow): User {
  return {
    id: String(r.id),
    email: r.email,
    passwordHash: r.password_hash,
    name: r.name,
    address: r.address,
    subscriberNo: r.subscriber_no ?? String(10000 + r.id),
    role: r.role,
    plan: r.plan,
    status: r.status,
    currentPeriodEnd: iso(r.current_period_end),
    paymentMethod: r.payment_method ?? undefined,
    createdAt: iso(r.created_at) ?? undefined,
    resetToken: r.reset_token,
    resetExpires: r.reset_expires == null ? null : Number(r.reset_expires),
    stripeCustomerId: r.stripe_customer_id ?? undefined,
    stripeSubscriptionId: r.stripe_subscription_id ?? undefined,
  };
}

const USER_COLS: Partial<Record<keyof User, string>> = {
  email: "email",
  passwordHash: "password_hash",
  name: "name",
  address: "address",
  role: "role",
  plan: "plan",
  status: "status",
  currentPeriodEnd: "current_period_end",
  paymentMethod: "payment_method",
  resetToken: "reset_token",
  resetExpires: "reset_expires",
  stripeCustomerId: "stripe_customer_id",
  stripeSubscriptionId: "stripe_subscription_id",
};

function userValue(key: keyof User, v: unknown): unknown {
  if (key === "currentPeriodEnd") return toDate(v as string | null);
  return v;
}

async function oneUser(where: string, param: unknown): Promise<User | undefined> {
  const rows = await select<UserRow>(`SELECT * FROM users WHERE ${where} LIMIT 1`, [param]);
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function listUsers(): Promise<User[]> {
  const rows = await select<UserRow>("SELECT * FROM users ORDER BY id ASC");
  return rows.map(toUser);
}
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return oneUser("email = ?", email.trim());
}
export async function getUserById(id: string): Promise<User | undefined> {
  const num = Number(id);
  if (!Number.isInteger(num)) return undefined;
  return oneUser("id = ?", num);
}
export async function getUserByStripeCustomer(cid: string): Promise<User | undefined> {
  return oneUser("stripe_customer_id = ?", cid);
}
export async function getUserByResetToken(token: string): Promise<User | undefined> {
  if (!token) return undefined;
  return oneUser("reset_token = ?", token);
}

export async function createUser(u: Omit<User, "id" | "subscriberNo" | "createdAt">): Promise<User> {
  return tx(async (c) => {
    const entries = (Object.keys(USER_COLS) as (keyof User)[])
      .filter((k) => k in u)
      .map((k) => [USER_COLS[k]!, n(userValue(k, (u as Partial<User>)[k]))] as const);
    const cols = entries.map(([col]) => col).join(", ");
    const marks = entries.map(() => "?").join(", ");
    const [res] = await c.execute<ResultSetHeader>(
      `INSERT INTO users (${cols}) VALUES (${marks})`,
      entries.map(([, v]) => v),
    );
    const id = res.insertId;
    await c.execute("UPDATE users SET subscriber_no = ? WHERE id = ?", [String(10000 + id), id]);
    const [rows] = await c.execute<UserRow[]>("SELECT * FROM users WHERE id = ?", [id]);
    return toUser(rows[0]);
  });
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const k of Object.keys(patch) as (keyof User)[]) {
    const col = USER_COLS[k];
    if (!col) continue;
    sets.push(`${col} = ?`);
    vals.push(userValue(k, patch[k]));
  }
  if (sets.length) await run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [...vals, Number(id)]);
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await run("DELETE FROM users WHERE id = ?", [Number(id)]);
  return res.affectedRows > 0;
}

// ---------------------------------------------------------------------------
// Settings (packs, éditions, site)
// ---------------------------------------------------------------------------
type PackRow = RowDataPacket & {
  key: string;
  name: string;
  billing_interval: "month" | "year";
  price: number;
  active: number;
  recommended: number;
};
const toPack = (r: PackRow): Pack => ({
  key: r.key,
  name: r.name,
  interval: r.billing_interval,
  price: Number(r.price),
  active: !!r.active,
  recommended: !!r.recommended,
});

type EditionRow = RowDataPacket & {
  id: string;
  date_label: string;
  title: string;
  publish_at: string | null;
};
const toEdition = (r: EditionRow): Edition => ({
  id: r.id,
  date: r.date_label,
  title: r.title,
  publishAt: r.publish_at,
});

async function listPacks(): Promise<Pack[]> {
  const rows = await select<PackRow>("SELECT * FROM packs ORDER BY sort_order ASC, `key` ASC");
  return rows.map(toPack);
}
async function listEditions(): Promise<Edition[]> {
  const rows = await select<EditionRow>(
    "SELECT id, date_label, title, publish_at FROM editions WHERE id IS NOT NULL ORDER BY position ASC, seq DESC",
  );
  return rows.map(toEdition);
}
async function getSite(): Promise<Site> {
  const rows = await select<RowDataPacket & { v: string | Site }>("SELECT v FROM settings WHERE k = 'site'");
  if (!rows[0]) return { ...DEFAULT_SITE };
  const v = typeof rows[0].v === "string" ? (JSON.parse(rows[0].v) as Site) : rows[0].v;
  return { ...DEFAULT_SITE, ...v };
}

export async function getSettings(): Promise<Settings> {
  const [packs, editions, site] = await Promise.all([listPacks(), listEditions(), getSite()]);
  return { packs, editions, site };
}

export async function getPack(key: string): Promise<Pack | undefined> {
  const rows = await select<PackRow>("SELECT * FROM packs WHERE `key` = ? LIMIT 1", [key]);
  return rows[0] ? toPack(rows[0]) : undefined;
}

export async function updatePacks(packs: Pack[]): Promise<Settings> {
  await tx(async (c) => {
    await c.execute("DELETE FROM packs");
    for (const [i, p] of packs.entries()) {
      await c.execute(
        "INSERT INTO packs (`key`, name, billing_interval, price, active, recommended, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [p.key, p.name, p.interval, Math.round(Number(p.price)), p.active ? 1 : 0, p.recommended ? 1 : 0, i],
      );
    }
  });
  return getSettings();
}

export async function updateSite(site: Partial<Site>): Promise<Settings> {
  const next = { ...(await getSite()), ...site };
  await run(
    "INSERT INTO settings (k, v) VALUES ('site', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)",
    [JSON.stringify(next)],
  );
  return getSettings();
}

// ---------------------------------------------------------------------------
// Éditions
// ---------------------------------------------------------------------------
export async function addEdition(date: string, title: string, publishAt?: string | null): Promise<Edition> {
  return tx(async (c) => {
    const [pos] = await c.execute<(RowDataPacket & { p: number | null })[]>(
      "SELECT MIN(position) AS p FROM editions FOR UPDATE",
    );
    const position = (pos[0]?.p ?? 0) - 1;
    const [res] = await c.execute<ResultSetHeader>(
      "INSERT INTO editions (date_label, title, publish_at, position) VALUES (?, ?, ?, ?)",
      [date, title || "Le Point Chablais", publishAt || null, position],
    );
    const id = `ed${res.insertId}`;
    await c.execute("UPDATE editions SET id = ? WHERE seq = ?", [id, res.insertId]);
    return { id, date, title: title || "Le Point Chablais", publishAt: publishAt || null };
  });
}

export async function removeEdition(id: string): Promise<boolean> {
  const res = await run("DELETE FROM editions WHERE id = ?", [id]);
  return res.affectedRows > 0;
}

// ---------------------------------------------------------------------------
// Factures
// ---------------------------------------------------------------------------
type InvoiceRow = RowDataPacket & {
  id: number;
  number: string | null;
  user_id: number | null;
  user_name: string;
  user_email: string;
  amount: number;
  plan: string;
  status: "paye" | "en_attente";
  date: Date;
};
const toInvoice = (r: InvoiceRow): Invoice => ({
  id: String(r.id),
  number: r.number ?? "",
  userId: r.user_id == null ? "" : String(r.user_id),
  userName: r.user_name,
  userEmail: r.user_email,
  amount: Number(r.amount),
  plan: r.plan,
  status: r.status,
  date: iso(r.date)!,
});

export async function listInvoices(): Promise<Invoice[]> {
  const rows = await select<InvoiceRow>("SELECT * FROM invoices ORDER BY `date` DESC, id DESC");
  return rows.map(toInvoice);
}

export async function createInvoice(
  u: User,
  amount: number,
  plan: string,
  status: "paye" | "en_attente",
): Promise<Invoice> {
  return tx(async (c) => {
    const [res] = await c.execute<ResultSetHeader>(
      "INSERT INTO invoices (user_id, user_name, user_email, amount, plan, status) VALUES (?, ?, ?, ?, ?, ?)",
      [Number(u.id), u.name || u.email, u.email, Math.round(amount), plan, status],
    );
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const number = `INV-${ymd}-${String(res.insertId).padStart(4, "0")}`;
    await c.execute("UPDATE invoices SET number = ? WHERE id = ?", [number, res.insertId]);
    const [rows] = await c.execute<InvoiceRow[]>("SELECT * FROM invoices WHERE id = ?", [res.insertId]);
    return toInvoice(rows[0]);
  });
}

// Facture issue d'un événement Stripe : idempotente (dédupliquée par stripe_invoice_id).
// Renvoie true si une nouvelle facture a été créée, false si elle existait déjà.
export async function recordStripeInvoice(p: {
  stripeInvoiceId: string;
  user: User;
  amount: number;
  plan: string;
  status?: "paye" | "en_attente";
}): Promise<boolean> {
  if (!p.stripeInvoiceId) return false;
  return tx(async (c) => {
    const [res] = await c.execute<ResultSetHeader>(
      `INSERT IGNORE INTO invoices (stripe_invoice_id, user_id, user_name, user_email, amount, plan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        p.stripeInvoiceId,
        Number(p.user.id),
        p.user.name || p.user.email,
        p.user.email,
        Math.round(p.amount),
        p.plan,
        p.status ?? "paye",
      ],
    );
    if (res.affectedRows === 0) return false; // déjà enregistrée
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    await c.execute("UPDATE invoices SET number = ? WHERE id = ?", [
      `INV-${ymd}-${String(res.insertId).padStart(4, "0")}`,
      res.insertId,
    ]);
    return true;
  });
}

const INVOICE_COLS: Partial<Record<keyof Invoice, string>> = {
  number: "number",
  userName: "user_name",
  userEmail: "user_email",
  amount: "amount",
  plan: "plan",
  status: "status",
  date: "`date`",
};

export async function updateInvoice(id: string, patch: Partial<Invoice>): Promise<Invoice | undefined> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const k of Object.keys(patch) as (keyof Invoice)[]) {
    const col = INVOICE_COLS[k];
    if (!col) continue;
    sets.push(`${col} = ?`);
    vals.push(k === "date" ? toDate(patch.date) : patch[k]);
  }
  if (sets.length) await run(`UPDATE invoices SET ${sets.join(", ")} WHERE id = ?`, [...vals, Number(id)]);
  const rows = await select<InvoiceRow>("SELECT * FROM invoices WHERE id = ?", [Number(id)]);
  return rows[0] ? toInvoice(rows[0]) : undefined;
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------
type LogRow = RowDataPacket & { id: string; ts: Date; actor: string; action: string; detail: string };

export async function listLogs(): Promise<Log[]> {
  const rows = await select<LogRow>("SELECT * FROM logs ORDER BY ts DESC LIMIT 500");
  return rows.map((r) => ({ id: r.id, ts: iso(r.ts)!, actor: r.actor, action: r.action, detail: r.detail }));
}

export async function addLog(actor: string, action: string, detail: string): Promise<void> {
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
  await run("INSERT INTO logs (id, ts, actor, action, detail) VALUES (?, ?, ?, ?, ?)", [
    id,
    new Date(),
    actor,
    action,
    detail,
  ]);
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------
type EmailRow = RowDataPacket & {
  id: string;
  ts: Date;
  from_addr: string;
  subject: string;
  body: string;
  audience: string;
  recipients: number;
  status: "envoye" | "en_file";
};

export async function listEmails(): Promise<EmailMsg[]> {
  const rows = await select<EmailRow>("SELECT * FROM emails ORDER BY ts DESC");
  return rows.map((r) => ({
    id: r.id,
    ts: iso(r.ts)!,
    from: r.from_addr,
    subject: r.subject,
    body: r.body,
    audience: r.audience,
    count: Number(r.recipients),
    status: r.status,
  }));
}

export async function addEmail(m: Omit<EmailMsg, "id" | "ts">): Promise<EmailMsg> {
  const em: EmailMsg = { ...m, id: String(Date.now()) + Math.random().toString(36).slice(2, 6), ts: new Date().toISOString() };
  await run(
    "INSERT INTO emails (id, ts, from_addr, subject, body, audience, recipients, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [em.id, new Date(em.ts), em.from, em.subject, em.body, em.audience, em.count, em.status],
  );
  return em;
}
