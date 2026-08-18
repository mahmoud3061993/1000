import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";

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
  payment_method: PaymentMethod | null;
  status: OrderStatus;
  kashier_order_id: string | null;
  kashier_transaction_id: string | null;
  instapay_screenshot: string | null;
  purchase_event_id: string | null;
  fbp: string | null;
  fbc: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
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

function databaseUrl() {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  if (process.env.LIBSQL_URL) return process.env.LIBSQL_URL;
  const file = process.env.APP_DB_PATH || path.join(process.cwd(), "data", "app.db");
  if (!file.startsWith("file:")) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return `file:${file}`;
  }
  return file;
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
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      order_id TEXT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_visits_session ON visits(session_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
  `);
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
  referrer?: string | null;
}) {
  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO visits (id, session_id, ip, user_agent, fbp, fbc, utm_source, utm_medium, utm_campaign, referrer, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      visit.referrer || null,
      nowIso(),
    ],
  });
}

export async function createOrder(
  order: Omit<Order, "updated_at" | "paid_at"> & { paid_at?: string | null }
) {
  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO orders (
        id, session_id, name, email, phone, amount, currency, payment_method, status,
        kashier_order_id, kashier_transaction_id, instapay_screenshot, purchase_event_id,
        fbp, fbc, ip, user_agent, created_at, updated_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      order.id,
      order.session_id,
      order.name,
      order.email,
      order.phone,
      order.amount,
      order.currency,
      order.payment_method,
      order.status,
      order.kashier_order_id,
      order.kashier_transaction_id,
      order.instapay_screenshot,
      order.purchase_event_id,
      order.fbp,
      order.fbc,
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
        currency=?, payment_method=?, status=?,
        kashier_order_id=?, kashier_transaction_id=?,
        instapay_screenshot=?, purchase_event_id=?,
        fbp=?, fbc=?, ip=?, user_agent=?, created_at=?,
        updated_at=?, paid_at=?
      WHERE id=?`,
    args: [
      next.session_id,
      next.name,
      next.email,
      next.phone,
      next.amount,
      next.currency,
      next.payment_method,
      next.status,
      next.kashier_order_id,
      next.kashier_transaction_id,
      next.instapay_screenshot,
      next.purchase_event_id,
      next.fbp,
      next.fbc,
      next.ip,
      next.user_agent,
      next.created_at,
      next.updated_at,
      next.paid_at,
      id,
    ],
  });
  return getOrder(id);
}

export async function getOrder(id: string) {
  const database = await getDb();
  const result = await database.execute({
    sql: `SELECT * FROM orders WHERE id = ?`,
    args: [id],
  });
  return (result.rows[0] as unknown as Order | undefined) || undefined;
}

export async function listOrders(filter?: { status?: string; q?: string }) {
  const args: Array<string> = [];
  let sql = `SELECT * FROM orders WHERE 1=1`;
  if (filter?.status && filter.status !== "all") {
    sql += ` AND status = ?`;
    args.push(filter.status);
  }
  if (filter?.q) {
    sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id LIKE ?)`;
    const like = `%${filter.q}%`;
    args.push(like, like, like, like);
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
}) {
  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO events (id, session_id, order_id, name, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [event.id, event.session_id || null, event.order_id || null, event.name, nowIso()],
  });
}

async function count(sql: string, args: Array<string> = []) {
  const database = await getDb();
  const result = await database.execute({ sql, args });
  return Number(result.rows[0]?.c || 0);
}

export async function getFunnelStats(): Promise<FunnelStats> {
  const visits = await count(`SELECT COUNT(*) as c FROM visits`);
  const uniqueVisitors = await count(`SELECT COUNT(DISTINCT session_id) as c FROM visits`);
  const formFilled = await count(`SELECT COUNT(*) as c FROM orders`);
  const tryingToPay = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status IN ('awaiting_payment', 'pending_review')`
  );
  const paid = await count(`SELECT COUNT(*) as c FROM orders WHERE status = 'paid'`);
  const pendingReview = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status = 'pending_review'`
  );
  const failed = await count(
    `SELECT COUNT(*) as c FROM orders WHERE status IN ('failed', 'rejected')`
  );
  const revenue = await count(
    `SELECT COALESCE(SUM(amount), 0) as c FROM orders WHERE status = 'paid'`
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
