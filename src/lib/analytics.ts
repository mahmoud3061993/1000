import { getDb } from "./db";
import { formatAttribution } from "./attribution";

export type AnalyticsPeriod = "day" | "week" | "month";

export type AnalyticsOrder = {
  id: string;
  session_id?: string | null;
  status: string;
  payment_method: string | null;
  amount: number;
  created_at: string;
  paid_at?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
};

export type AnalyticsVisit = {
  session_id: string;
  created_at: string;
};

export type AnalyticsTotals = {
  visits: number;
  uniqueVisitors: number;
  leads: number;
  closed: number;
  waiting: number;
  pendingReview: number;
  failed: number;
  income: number;
  avgOrder: number;
  visitConversion: number;
  leadConversion: number;
  instapayClosed: number;
  kashierClosed: number;
  instapayIncome: number;
  kashierIncome: number;
};

export type AnalyticsPoint = {
  date: string;
  label: string;
  visits: number;
  leads: number;
  closed: number;
  waiting: number;
  income: number;
};

export type AnalyticsSource = {
  title: string;
  detail: string;
  leads: number;
  closed: number;
  waiting: number;
  income: number;
};

export type AnalyticsRange = {
  period: AnalyticsPeriod;
  days: number;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  fromYmd: string;
  toYmdExclusive: string;
  fromLabel: string;
  toLabel: string;
};

export type AnalyticsReport = {
  period: AnalyticsPeriod;
  timezone: "Africa/Cairo";
  range: AnalyticsRange;
  current: AnalyticsTotals;
  previous: AnalyticsTotals;
  change: {
    income: number;
    closed: number;
    visits: number;
    leads: number;
    waiting: number;
  };
  openPipeline: number;
  insight: string;
  series: AnalyticsPoint[];
  sources: AnalyticsSource[];
};

export const ANALYTICS_TIMEZONE = "Africa/Cairo";

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  day: 1,
  week: 7,
  month: 30,
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function tzOffsetMs(timeZone: string, date: Date) {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

export function cairoYmd(date: Date) {
  const parts = zonedParts(date, ANALYTICS_TIMEZONE);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function cairoLocalToUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const first = utcGuess - tzOffsetMs(ANALYTICS_TIMEZONE, new Date(utcGuess));
  return new Date(utcGuess - tzOffsetMs(ANALYTICS_TIMEZONE, new Date(first)));
}

export function addCalendarDays(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

function parseYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month, day };
}

function ymdToIsoStart(ymd: string) {
  const { year, month, day } = parseYmd(ymd);
  return cairoLocalToUtc(year, month, day).toISOString();
}

function arabicDateLabel(ymd: string) {
  const { year, month, day } = parseYmd(ymd);
  return cairoLocalToUtc(year, month, day).toLocaleDateString("ar-EG", {
    timeZone: ANALYTICS_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function parseAnalyticsPeriod(value: string | null | undefined): AnalyticsPeriod {
  if (value === "week" || value === "month" || value === "day") return value;
  return "week";
}

export function periodRange(period: AnalyticsPeriod, now = new Date()): AnalyticsRange {
  const days = PERIOD_DAYS[period];
  const today = cairoYmd(now);
  const fromYmd = addCalendarDays(today, -(days - 1));
  const toYmdExclusive = addCalendarDays(today, 1);
  const previousFromYmd = addCalendarDays(fromYmd, -days);
  const lastDay = addCalendarDays(toYmdExclusive, -1);
  return {
    period,
    days,
    fromYmd,
    toYmdExclusive,
    from: ymdToIsoStart(fromYmd),
    to: ymdToIsoStart(toYmdExclusive),
    previousFrom: ymdToIsoStart(previousFromYmd),
    previousTo: ymdToIsoStart(fromYmd),
    fromLabel: arabicDateLabel(fromYmd),
    toLabel: arabicDateLabel(lastDay),
  };
}

function inRange(iso: string | null | undefined, from: string, to: string) {
  if (!iso) return false;
  return iso >= from && iso < to;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round1(((current - previous) / previous) * 100);
}

export function emptyTotals(): AnalyticsTotals {
  return {
    visits: 0,
    uniqueVisitors: 0,
    leads: 0,
    closed: 0,
    waiting: 0,
    pendingReview: 0,
    failed: 0,
    income: 0,
    avgOrder: 0,
    visitConversion: 0,
    leadConversion: 0,
    instapayClosed: 0,
    kashierClosed: 0,
    instapayIncome: 0,
    kashierIncome: 0,
  };
}

export function summarizeWindow(
  orders: AnalyticsOrder[],
  visits: AnalyticsVisit[],
  from: string,
  to: string
): AnalyticsTotals {
  const created = orders.filter((order) => inRange(order.created_at, from, to));
  const paid = orders.filter((order) => order.status === "paid" && inRange(order.paid_at, from, to));
  const waiting = created.filter(
    (order) => order.status === "awaiting_payment" || order.status === "pending_review"
  );
  const pendingReview = created.filter((order) => order.status === "pending_review");
  const failed = created.filter((order) => order.status === "failed" || order.status === "rejected");
  const visitsIn = visits.filter((visit) => inRange(visit.created_at, from, to));
  const uniqueVisitors = new Set(visitsIn.map((visit) => visit.session_id)).size;
  const income = paid.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const instapayPaid = paid.filter((order) => order.payment_method === "instapay");
  const kashierPaid = paid.filter((order) => order.payment_method === "kashier");
  const closed = paid.length;
  const leads = created.length;
  return {
    visits: visitsIn.length,
    uniqueVisitors,
    leads,
    closed,
    waiting: waiting.length,
    pendingReview: pendingReview.length,
    failed: failed.length,
    income: roundMoney(income),
    avgOrder: closed ? roundMoney(income / closed) : 0,
    visitConversion: uniqueVisitors ? round1((closed / uniqueVisitors) * 100) : 0,
    leadConversion: leads ? round1((closed / leads) * 100) : 0,
    instapayClosed: instapayPaid.length,
    kashierClosed: kashierPaid.length,
    instapayIncome: roundMoney(instapayPaid.reduce((sum, order) => sum + Number(order.amount || 0), 0)),
    kashierIncome: roundMoney(kashierPaid.reduce((sum, order) => sum + Number(order.amount || 0), 0)),
  };
}

export function summarizeSources(orders: AnalyticsOrder[], from: string, to: string): AnalyticsSource[] {
  const buckets = new Map<string, AnalyticsSource>();
  function bucketFor(order: AnalyticsOrder) {
    const formatted = formatAttribution(order);
    const key = `${formatted.title}|${formatted.detail}`;
    const existing = buckets.get(key);
    if (existing) return existing;
    const created: AnalyticsSource = {
      title: formatted.title,
      detail: formatted.detail,
      leads: 0,
      closed: 0,
      waiting: 0,
      income: 0,
    };
    buckets.set(key, created);
    return created;
  }

  for (const order of orders) {
    if (inRange(order.created_at, from, to)) {
      const row = bucketFor(order);
      row.leads += 1;
      if (order.status === "awaiting_payment" || order.status === "pending_review") {
        row.waiting += 1;
      }
    }
    if (order.status === "paid" && inRange(order.paid_at, from, to)) {
      const row = bucketFor(order);
      row.closed += 1;
      row.income = roundMoney(row.income + Number(order.amount || 0));
    }
  }

  return Array.from(buckets.values()).sort((a, b) => b.income - a.income || b.closed - a.closed || b.leads - a.leads);
}

export function insightText(totals: AnalyticsTotals, openPipeline: number) {
  const parts = [
    `اتقفل ${totals.closed} طلب`,
    `الدخل ${totals.income} جنيه`,
    `${totals.waiting} طلب لسه واقف على الدفع في الفترة دي`,
  ];
  if (openPipeline) parts.push(`${openPipeline} طلب مفتوح دلوقتي`);
  if (totals.pendingReview) parts.push(`${totals.pendingReview} إنستاباي مستني مراجعتك`);
  if (totals.failed) parts.push(`${totals.failed} فشل أو اترفض`);
  if (totals.uniqueVisitors) parts.push(`تحويل الزوار ${totals.visitConversion}%`);
  return parts.join(" — ");
}

export function buildSeries(
  orders: AnalyticsOrder[],
  visits: AnalyticsVisit[],
  fromYmd: string,
  toYmdExclusive: string
) {
  const series: AnalyticsPoint[] = [];
  for (let ymd = fromYmd; ymd < toYmdExclusive; ymd = addCalendarDays(ymd, 1)) {
    const from = ymdToIsoStart(ymd);
    const to = ymdToIsoStart(addCalendarDays(ymd, 1));
    const totals = summarizeWindow(orders, visits, from, to);
    series.push({
      date: ymd,
      label: arabicDateLabel(ymd),
      visits: totals.visits,
      leads: totals.leads,
      closed: totals.closed,
      waiting: totals.waiting,
      income: totals.income,
    });
  }
  return series;
}

export function buildAnalyticsReport(input: {
  period: AnalyticsPeriod;
  now?: Date;
  orders: AnalyticsOrder[];
  visits: AnalyticsVisit[];
  openPipeline?: number;
}): AnalyticsReport {
  const range = periodRange(input.period, input.now);
  const current = summarizeWindow(input.orders, input.visits, range.from, range.to);
  const previous = summarizeWindow(input.orders, input.visits, range.previousFrom, range.previousTo);
  const openPipeline = input.openPipeline ?? 0;
  return {
    period: input.period,
    timezone: ANALYTICS_TIMEZONE,
    range,
    current,
    previous,
    change: {
      income: percentChange(current.income, previous.income),
      closed: percentChange(current.closed, previous.closed),
      visits: percentChange(current.visits, previous.visits),
      leads: percentChange(current.leads, previous.leads),
      waiting: percentChange(current.waiting, previous.waiting),
    },
    openPipeline,
    insight: insightText(current, openPipeline),
    series: buildSeries(input.orders, input.visits, range.fromYmd, range.toYmdExclusive),
    sources: summarizeSources(input.orders, range.from, range.to),
  };
}

function asOrder(row: Record<string, unknown>): AnalyticsOrder {
  return {
    id: String(row.id),
    session_id: row.session_id ? String(row.session_id) : null,
    status: String(row.status || ""),
    payment_method: row.payment_method ? String(row.payment_method) : null,
    amount: Number(row.amount || 0),
    created_at: String(row.created_at),
    paid_at: row.paid_at ? String(row.paid_at) : null,
    utm_campaign: row.utm_campaign ? String(row.utm_campaign) : null,
    utm_content: row.utm_content ? String(row.utm_content) : null,
    utm_term: row.utm_term ? String(row.utm_term) : null,
    fbclid: row.fbclid ? String(row.fbclid) : null,
    fbc: row.fbc ? String(row.fbc) : null,
  };
}

function asVisit(row: Record<string, unknown>): AnalyticsVisit {
  return {
    session_id: String(row.session_id || ""),
    created_at: String(row.created_at),
  };
}

export async function getAnalyticsReport(period: AnalyticsPeriod, now = new Date()) {
  const range = periodRange(period, now);
  const database = await getDb();
  const [ordersResult, visitsResult, pipelineResult] = await Promise.all([
    database.execute({
      sql: `SELECT id, session_id, status, payment_method, amount, created_at, paid_at,
                   utm_campaign, utm_content, utm_term, fbclid, fbc
            FROM orders
            WHERE created_at >= ? OR COALESCE(paid_at, '') >= ?`,
      args: [range.previousFrom, range.previousFrom],
    }),
    database.execute({
      sql: `SELECT session_id, created_at FROM visits WHERE created_at >= ?`,
      args: [range.previousFrom],
    }),
    database.execute({
      sql: `SELECT COUNT(*) as c FROM orders WHERE status IN ('awaiting_payment', 'pending_review')`,
      args: [],
    }),
  ]);

  return buildAnalyticsReport({
    period,
    now,
    orders: ordersResult.rows.map((row) => asOrder(row as Record<string, unknown>)),
    visits: visitsResult.rows.map((row) => asVisit(row as Record<string, unknown>)),
    openPipeline: Number(pipelineResult.rows[0]?.c || 0),
  });
}

