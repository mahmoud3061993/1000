import { getDb } from "./db";
import { formatAttribution } from "./attribution";
import { LANDING_SECTIONS } from "./funnel";

export type AnalyticsPeriod = "day" | "week" | "month";

export type AnalyticsOrder = {
  id: string;
  session_id?: string | null;
  status: string;
  payment_method: string | null;
  amount: number;
  created_at: string;
  paid_at?: string | null;
  product_slug?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
};

export type AnalyticsVisit = {
  session_id: string;
  created_at: string;
  product_slug?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
};

export type AnalyticsEvent = {
  session_id: string;
  name: string;
  created_at: string;
  product_slug?: string | null;
};

export type AnalyticsProductFilter = "all" | "1000" | "plant" | "arabity";

export type AnalyticsSectionStat = {
  event: string;
  label: string;
  count: number;
  pct: number;
};

export type AnalyticsFunnel = {
  opens: number;
  uniqueVisitors: number;
  scroll25: number;
  scroll50: number;
  scroll75: number;
  scroll100: number;
  sections: AnalyticsSectionStat[];
  reachedPay: number;
  leads: number;
  waiting: number;
  purchased: number;
  openToScroll: number;
  scrollToPay: number;
  payToLead: number;
  leadToWaiting: number;
  leadToPurchase: number;
  openToPurchase: number;
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
  opens: number;
  scroll25: number;
  scroll50: number;
  scroll75: number;
  scroll100: number;
  sections: AnalyticsSectionStat[];
  reachedPay: number;
  leads: number;
  waiting: number;
  closed: number;
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
  funnel: AnalyticsFunnel;
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

export function parseProductFilter(value: string | null | undefined): AnalyticsProductFilter {
  if (value === "all" || value === "1000" || value === "arabity") return value;
  return "plant";
}

function matchesProduct<T extends { product_slug?: string | null }>(
  row: T,
  product: AnalyticsProductFilter
) {
  if (product === "all") return true;
  return (row.product_slug || "1000") === product;
}

export function emptySections(): AnalyticsSectionStat[] {
  return LANDING_SECTIONS.map((section) => ({
    event: section.event,
    label: section.label,
    count: 0,
    pct: 0,
  }));
}

export function emptyFunnel(): AnalyticsFunnel {
  return {
    opens: 0,
    uniqueVisitors: 0,
    scroll25: 0,
    scroll50: 0,
    scroll75: 0,
    scroll100: 0,
    sections: emptySections(),
    reachedPay: 0,
    leads: 0,
    waiting: 0,
    purchased: 0,
    openToScroll: 0,
    scrollToPay: 0,
    payToLead: 0,
    leadToWaiting: 0,
    leadToPurchase: 0,
    openToPurchase: 0,
  };
}

function uniqueSessions(events: AnalyticsEvent[], name: string, from: string, to: string) {
  return new Set(
    events.filter((event) => event.name === name && inRange(event.created_at, from, to)).map((event) => event.session_id)
  ).size;
}

export function buildFunnel(input: {
  visits: AnalyticsVisit[];
  events: AnalyticsEvent[];
  orders: AnalyticsOrder[];
  from: string;
  to: string;
}): AnalyticsFunnel {
  const from = input.from;
  const to = input.to;
  const visitsIn = input.visits.filter((visit) => inRange(visit.created_at, from, to));
  const uniqueVisitors = new Set(visitsIn.map((visit) => visit.session_id)).size;
  const opens = uniqueVisitors || uniqueSessions(input.events, "PageView", from, to);
  const scroll25 = uniqueSessions(input.events, "Scroll25", from, to);
  const scroll50 = uniqueSessions(input.events, "Scroll50", from, to);
  const scroll75 = uniqueSessions(input.events, "Scroll75", from, to);
  const scroll100 = uniqueSessions(input.events, "Scroll100", from, to);
  const reachedPay = uniqueSessions(input.events, "CheckoutView", from, to);
  const created = input.orders.filter((order) => inRange(order.created_at, from, to));
  const leads = created.length;
  const waiting = created.filter(
    (order) => order.status === "awaiting_payment" || order.status === "pending_review"
  ).length;
  const purchased = input.orders.filter((order) => order.status === "paid" && inRange(order.paid_at, from, to)).length;
  const pct = (num: number, den: number) => (den ? round1((num / den) * 100) : 0);
  const sections = LANDING_SECTIONS.map((section) => {
    const count = uniqueSessions(input.events, section.event, from, to);
    return { event: section.event, label: section.label, count, pct: pct(count, opens) };
  });
  return {
    opens,
    uniqueVisitors,
    scroll25,
    scroll50,
    scroll75,
    scroll100,
    sections,
    reachedPay,
    leads,
    waiting,
    purchased,
    openToScroll: pct(scroll50, opens),
    scrollToPay: pct(reachedPay, scroll50 || opens),
    payToLead: pct(leads, reachedPay || opens),
    leadToWaiting: pct(waiting, leads),
    leadToPurchase: pct(purchased, leads),
    openToPurchase: pct(purchased, opens),
  };
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

function attributionForSession(
  sessionId: string,
  visits: AnalyticsVisit[],
  orders: AnalyticsOrder[]
) {
  const visit = visits.find((row) => row.session_id === sessionId && (row.utm_campaign || row.utm_content || row.fbclid));
  const anyVisit = visits.find((row) => row.session_id === sessionId);
  const order = orders.find((row) => row.session_id === sessionId);
  return formatAttribution(visit || order || anyVisit || {});
}

function emptySource(title: string, detail: string): AnalyticsSource {
  return {
    title,
    detail,
    opens: 0,
    scroll25: 0,
    scroll50: 0,
    scroll75: 0,
    scroll100: 0,
    sections: emptySections(),
    reachedPay: 0,
    leads: 0,
    waiting: 0,
    closed: 0,
    income: 0,
  };
}

export function summarizeSources(
  orders: AnalyticsOrder[],
  from: string,
  to: string,
  visits: AnalyticsVisit[] = [],
  events: AnalyticsEvent[] = []
): AnalyticsSource[] {
  const buckets = new Map<string, AnalyticsSource>();
  function bucketFor(title: string, detail: string) {
    const key = `${title}|${detail}`;
    const existing = buckets.get(key);
    if (existing) return existing;
    const created = emptySource(title, detail);
    buckets.set(key, created);
    return created;
  }

  const visitsIn = visits.filter((visit) => inRange(visit.created_at, from, to));
  const eventsIn = events.filter((event) => inRange(event.created_at, from, to));
  const sessionIds = new Set<string>();
  visitsIn.forEach((visit) => sessionIds.add(visit.session_id));
  eventsIn.forEach((event) => sessionIds.add(event.session_id));
  orders.forEach((order) => {
    if (order.session_id && (inRange(order.created_at, from, to) || (order.status === "paid" && inRange(order.paid_at, from, to)))) {
      sessionIds.add(order.session_id);
    }
  });

  const eventsBySession = new Map<string, Set<string>>();
  for (const event of eventsIn) {
    const set = eventsBySession.get(event.session_id) || new Set<string>();
    set.add(event.name);
    eventsBySession.set(event.session_id, set);
  }

  for (const sessionId of Array.from(sessionIds)) {
    const formatted = attributionForSession(sessionId, visitsIn.length ? visitsIn : visits, orders);
    const row = bucketFor(formatted.title, formatted.detail);
    const names = eventsBySession.get(sessionId) || new Set<string>();
    row.opens += 1;
    if (names.has("Scroll25")) row.scroll25 += 1;
    if (names.has("Scroll50")) row.scroll50 += 1;
    if (names.has("Scroll75")) row.scroll75 += 1;
    if (names.has("Scroll100")) row.scroll100 += 1;
    if (names.has("CheckoutView")) row.reachedPay += 1;
    row.sections = row.sections.map((section) =>
      names.has(section.event) ? { ...section, count: section.count + 1 } : section
    );
  }

  for (const order of orders) {
    if (!inRange(order.created_at, from, to) && !(order.status === "paid" && inRange(order.paid_at, from, to))) {
      continue;
    }
    const formatted = formatAttribution(order);
    const row = bucketFor(formatted.title, formatted.detail);
    if (inRange(order.created_at, from, to)) {
      row.leads += 1;
      if (order.status === "awaiting_payment" || order.status === "pending_review") {
        row.waiting += 1;
      }
    }
    if (order.status === "paid" && inRange(order.paid_at, from, to)) {
      row.closed += 1;
      row.income = roundMoney(row.income + Number(order.amount || 0));
    }
  }

  for (const row of Array.from(buckets.values())) {
    row.sections = row.sections.map((section) => ({
      ...section,
      pct: row.opens ? round1((section.count / row.opens) * 100) : 0,
    }));
  }

  return Array.from(buckets.values()).sort(
    (a, b) => b.income - a.income || b.closed - a.closed || b.opens - a.opens || b.leads - a.leads
  );
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
  events?: AnalyticsEvent[];
  product?: AnalyticsProductFilter;
  openPipeline?: number;
}): AnalyticsReport {
  const product = input.product || "all";
  const orders = input.orders.filter((row) => matchesProduct(row, product));
  const visits = input.visits.filter((row) => matchesProduct(row, product));
  const events = (input.events || []).filter((row) => matchesProduct(row, product));
  const range = periodRange(input.period, input.now);
  const current = summarizeWindow(orders, visits, range.from, range.to);
  const previous = summarizeWindow(orders, visits, range.previousFrom, range.previousTo);
  const openPipeline = input.openPipeline ?? 0;
  const funnel = buildFunnel({ visits, events, orders, from: range.from, to: range.to });
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
    series: buildSeries(orders, visits, range.fromYmd, range.toYmdExclusive),
    sources: summarizeSources(orders, range.from, range.to, visits, events),
    funnel,
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
    product_slug: row.product_slug ? String(row.product_slug) : "1000",
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
    product_slug: row.product_slug ? String(row.product_slug) : "1000",
    utm_source: row.utm_source ? String(row.utm_source) : null,
    utm_campaign: row.utm_campaign ? String(row.utm_campaign) : null,
    utm_content: row.utm_content ? String(row.utm_content) : null,
    utm_term: row.utm_term ? String(row.utm_term) : null,
    fbclid: row.fbclid ? String(row.fbclid) : null,
    fbc: row.fbc ? String(row.fbc) : null,
  };
}

function asEvent(row: Record<string, unknown>): AnalyticsEvent {
  return {
    session_id: String(row.session_id || ""),
    name: String(row.name || ""),
    created_at: String(row.created_at),
    product_slug: row.product_slug ? String(row.product_slug) : "1000",
  };
}

export async function getAnalyticsReport(
  period: AnalyticsPeriod,
  now = new Date(),
  product: AnalyticsProductFilter = "plant"
) {
  const range = periodRange(period, now);
  const productSql = product === "all" ? "" : ` AND COALESCE(product_slug, '1000') = ?`;
  const productArgs = product === "all" ? [] : [product];
  const database = await getDb();
  const [ordersResult, visitsResult, eventsResult, pipelineResult] = await Promise.all([
    database.execute({
      sql: `SELECT id, session_id, status, payment_method, amount, created_at, paid_at, product_slug,
                   utm_campaign, utm_content, utm_term, fbclid, fbc
            FROM orders
            WHERE (created_at >= ? OR COALESCE(paid_at, '') >= ?)${productSql}`,
      args: [range.previousFrom, range.previousFrom, ...productArgs],
    }),
    database.execute({
      sql: `SELECT session_id, created_at, product_slug, utm_source, utm_campaign, utm_content, utm_term, fbclid, fbc
            FROM visits WHERE created_at >= ?${productSql}`,
      args: [range.previousFrom, ...productArgs],
    }),
    database.execute({
      sql: `SELECT session_id, name, created_at, product_slug FROM events WHERE created_at >= ?${productSql}`,
      args: [range.previousFrom, ...productArgs],
    }),
    database.execute({
      sql: `SELECT COUNT(*) as c FROM orders WHERE status IN ('awaiting_payment', 'pending_review')${productSql}`,
      args: productArgs,
    }),
  ]);

  return buildAnalyticsReport({
    period,
    now,
    product,
    orders: ordersResult.rows.map((row) => asOrder(row as Record<string, unknown>)),
    visits: visitsResult.rows.map((row) => asVisit(row as Record<string, unknown>)),
    events: eventsResult.rows.map((row) => asEvent(row as Record<string, unknown>)),
    openPipeline: Number(pipelineResult.rows[0]?.c || 0),
  });
}

