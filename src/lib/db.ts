import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.APP_DB_PATH || path.join(DATA_DIR, "app.db");

let db: Database.Database | null = null;

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

function migrate(database: Database.Database) {
  database.exec(`
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

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function nowIso() {
  return new Date().toISOString();
}

export function insertVisit(visit: {
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
  getDb()
    .prepare(
      `INSERT INTO visits (id, session_id, ip, user_agent, fbp, fbc, utm_source, utm_medium, utm_campaign, referrer, created_at)
       VALUES (@id, @session_id, @ip, @user_agent, @fbp, @fbc, @utm_source, @utm_medium, @utm_campaign, @referrer, @created_at)`
    )
    .run({
      ...visit,
      ip: visit.ip || null,
      user_agent: visit.user_agent || null,
      fbp: visit.fbp || null,
      fbc: visit.fbc || null,
      utm_source: visit.utm_source || null,
      utm_medium: visit.utm_medium || null,
      utm_campaign: visit.utm_campaign || null,
      referrer: visit.referrer || null,
      created_at: nowIso(),
    });
}

export function createOrder(order: Omit<Order, "updated_at" | "paid_at"> & { paid_at?: string | null }) {
  const row = {
    ...order,
    payment_method: order.payment_method,
    kashier_order_id: order.kashier_order_id,
    kashier_transaction_id: order.kashier_transaction_id,
    instapay_screenshot: order.instapay_screenshot,
    purchase_event_id: order.purchase_event_id,
    fbp: order.fbp,
    fbc: order.fbc,
    ip: order.ip,
    user_agent: order.user_agent,
    updated_at: nowIso(),
    paid_at: order.paid_at || null,
  };
  getDb()
    .prepare(
      `INSERT INTO orders (
        id, session_id, name, email, phone, amount, currency, payment_method, status,
        kashier_order_id, kashier_transaction_id, instapay_screenshot, purchase_event_id,
        fbp, fbc, ip, user_agent, created_at, updated_at, paid_at
      ) VALUES (
        @id, @session_id, @name, @email, @phone, @amount, @currency, @payment_method, @status,
        @kashier_order_id, @kashier_transaction_id, @instapay_screenshot, @purchase_event_id,
        @fbp, @fbc, @ip, @user_agent, @created_at, @updated_at, @paid_at
      )`
    )
    .run(row);
  return getOrder(order.id)!;
}

export function updateOrder(id: string, patch: Partial<Order>) {
  const current = getOrder(id);
  if (!current) return null;
  const next = { ...current, ...patch, id, updated_at: nowIso() };
  getDb()
    .prepare(
      `UPDATE orders SET
        session_id=@session_id, name=@name, email=@email, phone=@phone, amount=@amount,
        currency=@currency, payment_method=@payment_method, status=@status,
        kashier_order_id=@kashier_order_id, kashier_transaction_id=@kashier_transaction_id,
        instapay_screenshot=@instapay_screenshot, purchase_event_id=@purchase_event_id,
        fbp=@fbp, fbc=@fbc, ip=@ip, user_agent=@user_agent, created_at=@created_at,
        updated_at=@updated_at, paid_at=@paid_at
      WHERE id=@id`
    )
    .run(next);
  return getOrder(id);
}

export function getOrder(id: string) {
  return getDb().prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as Order | undefined;
}

export function listOrders(filter?: { status?: string; q?: string }) {
  let sql = `SELECT * FROM orders WHERE 1=1`;
  const params: string[] = [];
  if (filter?.status && filter.status !== "all") {
    sql += ` AND status = ?`;
    params.push(filter.status);
  }
  if (filter?.q) {
    sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id LIKE ?)`;
    const like = `%${filter.q}%`;
    params.push(like, like, like, like);
  }
  sql += ` ORDER BY created_at DESC LIMIT 500`;
  return getDb().prepare(sql).all(...params) as Order[];
}

export function insertEvent(event: {
  id: string;
  session_id?: string | null;
  order_id?: string | null;
  name: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO events (id, session_id, order_id, name, created_at)
       VALUES (@id, @session_id, @order_id, @name, @created_at)`
    )
    .run({
      ...event,
      session_id: event.session_id || null,
      order_id: event.order_id || null,
      created_at: nowIso(),
    });
}

export function getFunnelStats(): FunnelStats {
  const database = getDb();
  const visits = (database.prepare(`SELECT COUNT(*) as c FROM visits`).get() as { c: number }).c;
  const uniqueVisitors = (
    database.prepare(`SELECT COUNT(DISTINCT session_id) as c FROM visits`).get() as { c: number }
  ).c;
  const formFilled = (database.prepare(`SELECT COUNT(*) as c FROM orders`).get() as { c: number }).c;
  const tryingToPay = (
    database
      .prepare(
        `SELECT COUNT(*) as c FROM orders WHERE status IN ('awaiting_payment', 'pending_review')`
      )
      .get() as { c: number }
  ).c;
  const paid = (
    database.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'paid'`).get() as { c: number }
  ).c;
  const pendingReview = (
    database
      .prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'pending_review'`)
      .get() as { c: number }
  ).c;
  const failed = (
    database
      .prepare(`SELECT COUNT(*) as c FROM orders WHERE status IN ('failed', 'rejected')`)
      .get() as { c: number }
  ).c;
  const revenue = (
    database
      .prepare(`SELECT COALESCE(SUM(amount), 0) as c FROM orders WHERE status = 'paid'`)
      .get() as { c: number }
  ).c;

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

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function markOrderPaid(id: string, extra?: Partial<Order>) {
  const current = getOrder(id);
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
