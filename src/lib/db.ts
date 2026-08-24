import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";
import { appendAdPath, toAdTouch, type AdTouch } from "./attribution";

export type OrderStatus =
  | "form_filled"
  | "awaiting_payment"
  | "pending_review"
  | "paid"
  | "failed"
  | "rejected";

export type PaymentMethod = "kashier" | "instapay";

export type Order = {
  id: string;
  session_id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  product_slug?: string | null;
  payment_method: PaymentMethod | null;
  status: OrderStatus;
  kashier_order_id: string | null;
  kashier_transaction_id: string | null;
  instapay_screenshot: string | null;
  purchase_event_id: string | null;
  fbp: string | null;
  fbc: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  ad_path?: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  email_sent_at?: string | null;
};

export type FunnelStats = {
  visits: number;
  uniqueVisitors: number;
  formFilled: number;
  tryingToPay: number;
  paid: number;
  pendingReview: number;
  failed: number;
  revenue: number;
};

let db: Client | null = null;
let migrated = false;

export function resolveDatabaseUrl(env: NodeJS.Dict<string> = process.env) {
  if (env.TURSO_DATABASE_URL) return env.TURSO_DATABASE_URL;
  if (env.LIBSQL_URL) return env.LIBSQL_URL;
  const onVercel = env.VERCEL === "1";
  const file =
    env.APP_DB_PATH ||
    (onVercel ? path.join("/tmp", "elkousy-app.db") : path.join(process.cwd(), "data", "app.db"));
  if (!file.startsWith("file:")) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return `file:${file}`;
  }
  return file;
}

function databaseUrl() {
  return resolveDatabaseUrl();
}

async function ensureColumn(database: Client, table: string, column: string, ddl: string) {
  const info = await database.execute(`PRAGMA table_info(${table})`);
  const exists = info.rows.some((row) => String(row.name) === column);
  if (!exists) {
    await database.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

async function migrate(database: Client) {
  await database.executeMultiple(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      fbp TEXT,
      fbc TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      fbclid TEXT,
      referrer TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      payment_method TEXT,
      status TEXT NOT NULL,
      kashier_order_id TEXT,
      kashier_transaction_id TEXT,
      instapay_screenshot TEXT,
      purchase_event_id TEXT,
      fbp TEXT,
      fbc TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      fbclid TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      paid_at TEXT,
      email_sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      order_id TEXT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_visits_session ON visits(session_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
  `);
  await ensureColumn(database, "visits", "utm_content", "TEXT");
  await ensureColumn(database, "visits", "utm_term", "TEXT");
  await ensureColumn(database, "visits", "fbclid", "TEXT");
  await ensureColumn(database, "orders", "utm_source", "TEXT");
  await ensureColumn(database, "orders", "utm_medium", "TEXT");
  await ensureColumn(database, "orders", "utm_campaign", "TEXT");
  await ensureColumn(database, "orders", "utm_content", "TEXT");
  await ensureColumn(database, "orders", "utm_term", "TEXT");
  await ensureColumn(database, "orders", "fbclid", "TEXT");
  await ensureColumn(database, "orders", "email_sent_at", "TEXT");
  await ensureColumn(database, "orders", "product_slug", "TEXT");
  await ensureColumn(database, "visits", "product_slug", "TEXT");
  await ensureColumn(database, "events", "product_slug", "TEXT");
  await ensureColumn(database, "orders", "ad_path", "TEXT");
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`);
}

export function usesRemoteDb() {
  return Boolean(process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL);
}

export async function getSettings() {
  const database = await getDb();
  const result = await database.execute(`SELECT key, value FROM settings`);
  const stored: Record<string, string> = {};
  for (const row of result.rows) {
    stored[String(row.key)] = String(row.value ?? "");
  }
  return stored;
}

export async function setSettings(patch: Record<string, string>) {
  const database = await getDb();
  const ts = nowIso();
  for (const [key, value] of Object.entries(patch)) {
    await database.execute({
      sql: `INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = excluded.updated_at`,
      args: [key, value, ts],
    });
  }
}

export async function getDb() {
  if (!db) {
    db = createClient({
      url: databaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  if (!migrated) {
    await migrate(db);
    migrated = true;
  }
  return db;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function insertVisit(visit: {
  id: string;
  session_id: string;
  ip?: string | null;
  user_agent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  product_slug?: string | null;
}) {
  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO visits (id, session_id, ip, user_agent, fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referrer, created_at, product_slug)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      visit.id,
      visit.session_id,
      visit.ip || null,
      visit.user_agent || null,
      visit.fbp || null,
      visit.fbc || null,
      visit.utm_source || null,
      visit.utm_medium || null,
      visit.utm_campaign || null,
      visit.utm_content || null,
      visit.utm_term || null,
      visit.fbclid || null,
      visit.referrer || null,
      nowIso(),
      visit.product_slug || "1000",
    ],
  });
}

export async function createOrder(
  order: Omit<Order, "updated_at" | "paid_at"> & { paid_at?: string | null }
) {
  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO orders (
        id, session_id, name, email, phone, amount, currency, product_slug, payment_method, status,
        kashier_order_id, kashier_transaction_id, instapay_screenshot, purchase_event_id,
        fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, ad_path,
        ip, user_agent, created_at, updated_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      order.id,
      order.session_id,
      order.name,
      order.email,
      order.phone,
      order.amount,
      order.currency,
      order.product_slug || "1000",
      order.payment_method,
      order.status,
      order.kashier_order_id,
      order.kashier_transaction_id,
      order.instapay_screenshot,
      order.purchase_event_id,
      order.fbp,
      order.fbc,
      order.utm_source ?? null,
      order.utm_medium ?? null,
      order.utm_campaign ?? null,
      order.utm_content ?? null,
      order.utm_term ?? null,
      order.fbclid ?? null,
      order.ad_path ?? null,
      order.ip,
      order.user_agent,
      order.created_at,
      nowIso(),
      order.paid_at || null,
    ],
  });
  return (await getOrder(order.id))!;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const current = await getOrder(id);
  if (!current) return null;
  const next = { ...current, ...patch, id, updated_at: nowIso() };
  const database = await getDb();
  await database.execute({
    sql: `UPDATE orders SET
        session_id=?, name=?, email=?, phone=?, amount=?,
        currency=?, product_slug=?, payment_method=?, status=?,
        kashier_order_id=?, kashier_transaction_id=?,
        instapay_screenshot=?, purchase_event_id=?,
        fbp=?, fbc=?, utm_source=?, utm_medium=?, utm_campaign=?, utm_content=?, utm_term=?, fbclid=?, ad_path=?,
        ip=?, user_agent=?, created_at=?,
        updated_at=?, paid_at=?, email_sent_at=?
      WHERE id=?`,
    args: [
      next.session_id,
      next.name,
      next.email,
      next.phone,
      next.amount,
      next.currency,
      next.product_slug || "1000",
      next.payment_method,
      next.status,
      next.kashier_order_id,
      next.kashier_transaction_id,
      next.instapay_screenshot,
      next.purchase_event_id,
      next.fbp,
      next.fbc,
      next.utm_source ?? null,
      next.utm_medium ?? null,
      next.utm_campaign ?? null,
      next.utm_content ?? null,
      next.utm_term ?? null,
      next.fbclid ?? null,
      next.ad_path ?? null,
      next.ip,
      next.user_agent,
      next.created_at,
      next.updated_at,
      next.paid_at,
      next.email_sent_at ?? null,
      id,
    ],
  });
  return getOrder(id);
}

export async function deleteOrder(id: string) {
  const current = await getOrder(id);
  if (!current) return false;
  const database = await getDb();
  await database.execute({
    sql: `DELETE FROM events WHERE order_id = ?`,
    args: [id],
  });
  await database.execute({
    sql: `DELETE FROM orders WHERE id = ?`,
    args: [id],
  });
  return true;
}

export async function getSessionAttribution(sessionId: string) {
  if (!sessionId) return null;
  const database = await getDb();
  const result = await database.execute({
    sql: `SELECT utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, fbp, fbc
          FROM visits
          WHERE session_id = ?
          ORDER BY created_at ASC`,
    args: [sessionId],
  });
  if (!result.rows.length) return null;
  const merged = {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    fbclid: "",
    fbp: "",
    fbc: "",
  };
  for (const row of result.rows) {
    const record = row as Record<string, unknown>;
    (Object.keys(merged) as Array<keyof typeof merged>).forEach((key) => {
      if (!merged[key] && record[key]) merged[key] = String(record[key]);
    });
  }
  return merged;
}

export async function getSessionAdPath(sessionId: string): Promise<AdTouch[]> {
  if (!sessionId) return [];
  const database = await getDb();
  const result = await database.execute({
    sql: `SELECT utm_source, utm_campaign, utm_content, utm_term, fbclid
          FROM visits
          WHERE session_id = ?
          ORDER BY created_at ASC`,
    args: [sessionId],
  });
  let adPath: AdTouch[] = [];
  for (const row of result.rows) {
    adPath = appendAdPath(adPath, toAdTouch(row as Record<string, unknown>));
  }
  return adPath;
}

export async function hasSessionEvent(sessionId: string, name: string) {
  if (!sessionId || !name) return false;
  const database = await getDb();
  const result = await database.execute({
    sql: `SELECT id FROM events WHERE session_id = ? AND name = ? LIMIT 1`,
    args: [sessionId, name],
  });
  return result.rows.length > 0;
}

export async function getOrder(id: string) {
  const database = await getDb();
  const result = await database.execute({
    sql: `SELECT * FROM orders WHERE id = ?`,
    args: [id],
  });
  return (result.rows[0] as unknown as Order | undefined) || undefined;
}

export async function listOrders(filter?: { status?: string; q?: string; product?: string }) {
  const args: Array<string> = [];
  let sql = `SELECT * FROM orders WHERE 1=1`;
  if (filter?.status && filter.status !== "all") {
    sql += ` AND status = ?`;
    args.push(filter.status);
  }
  if (filter?.product && filter.product !== "all") {
    sql += ` AND COALESCE(product_slug, '1000') = ?`;
    args.push(filter.product);
  }
  if (filter?.q) {
    sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id LIKE ? OR COALESCE(utm_campaign,'') LIKE ? OR COALESCE(utm_content,'') LIKE ?)`;
    const like = `%${filter.q}%`;
    args.push(like, like, like, like, like, like);
  }
  sql += ` ORDER BY created_at DESC LIMIT 500`;
  const database = await getDb();
  const result = await database.execute({ sql, args });
  return (result.rows as unknown as Order[]).map((row) => ({
    ...row,
    instapay_screenshot: row.instapay_screenshot ? "stored" : null,
  }));
}

export async function insertEvent(event: {
  id: string;
  session_id?: string | null;
  order_id?: string | null;
  name: string;
  product_slug?: string | null;
}) {
  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO events (id, session_id, order_id, name, created_at, product_slug)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [event.id, event.session_id || null, event.order_id || null, event.name, nowIso(), event.product_slug || null],
  });
}

export async function clearAnalyticsData(product = "arabity") {
  const slug = product === "plant" || product === "1000" || product === "arabity" ? product : "arabity";
  const database = await getDb();
  const visits = await database.execute({
    sql: `DELETE FROM visits WHERE product_slug = ?`,
    args: [slug],
  });
  const events = await database.execute({
    sql: `DELETE FROM events WHERE product_slug = ?`,
    args: [slug],
  });
  return {
    product: slug,
    visitsDeleted: Number(visits.rowsAffected || 0),
    eventsDeleted: Number(events.rowsAffected || 0),
  };
}

async function count(sql: string, args: Array<string> = []) {
  const database = await getDb();
  const result = await database.execute({ sql, args });
  return Number(result.rows[0]?.c || 0);
}

export async function getFunnelStats(product?: string): Promise<FunnelStats> {
  const productFilter = product && product !== "all";
  const productSql = productFilter ? ` AND COALESCE(product_slug, '1000') = ?` : "";
  const args = productFilter ? [product] : [];
  const visits = await count(`SELECT COUNT(*) as c FROM visits WHERE 1=1${productSql}`, args);
  const uniqueVisitors = await count(
    `SELECT COUNT(DISTINCT session_id) as c FROM visits WHERE 1=1${productSql}`,
    args
  );
  const formFilled = await count(`SELECT COUNT(*) as c FROM orders WHERE 1=1${productSql}`, args);
  const tryingToPay = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status IN ('awaiting_payment', 'pending_review')${productSql}`,
    args
  );
  const paid = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status = 'paid'${productSql}`,
    args
  );
  const pendingReview = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status = 'pending_review'${productSql}`,
    args
  );
  const failed = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status IN ('failed', 'rejected')${productSql}`,
    args
  );
  const revenue = await count(
    `SELECT COALESCE(SUM(amount), 0) as c FROM orders WHERE status = 'paid'${productSql}`,
    args
  );

  return {
    visits,
    uniqueVisitors,
    formFilled,
    tryingToPay,
    paid,
    pendingReview,
    failed,
    revenue,
  };
}

export async function closeDb() {
  if (db) {
    db.close();
    db = null;
    migrated = false;
  }
}

export async function markOrderPaid(id: string, extra?: Partial<Order>) {
  const current = await getOrder(id);
  if (!current) return null;
  if (current.status === "paid") {
    return current;
  }
  return updateOrder(id, {
    status: "paid",
    paid_at: nowIso(),
    ...extra,
  });
}
