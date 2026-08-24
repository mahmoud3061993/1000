import {
  DOCUMENT_TYPES,
  EXPENSE_CATEGORIES,
  MAINTENANCE_TYPES,
  MONTHS_AR,
} from "./constants.js";
import {
  addMonths,
  daysBetween,
  inRange,
  labelOf,
  moneyNumber,
  monthRange,
  monthsBetween,
  pctChange,
  round,
  sortByDateDesc,
  toDate,
} from "./utils.js";

export function recordDate(r) {
  return toDate(r.date || r.startDate || r.endDate || r.installDate || r.purchaseDate || r.createdAt);
}

export function collectCosts(ctx, from, to) {
  const { fuel, maintenance, repairs, expenses, documents } = ctx;
  const take = (list, amountFn) =>
    list.filter((r) => inRange(recordDate(r), from, to)).map((r) => ({ ...r, amount: moneyNumber(amountFn(r)) }));

  const fuelRows = take(fuel, (r) => r.total);
  const maintRows = take(maintenance, (r) => r.total);
  const repairRows = take(repairs, (r) => r.total);
  const expRows = take(expenses, (r) => r.amount);
  const docRows = take(documents, (r) => r.cost);

  const sum = (rows) => rows.reduce((a, r) => a + r.amount, 0);
  const fuelTotal = sum(fuelRows);
  const maintTotal = sum(maintRows);
  const repairTotal = sum(repairRows);
  const otherTotal = sum(expRows);
  const docsTotal = sum(docRows);
  const total = fuelTotal + maintTotal + repairTotal + otherTotal + docsTotal;

  return {
    fuelRows,
    maintRows,
    repairRows,
    expRows,
    docRows,
    fuelTotal,
    maintTotal,
    repairTotal,
    otherTotal,
    docsTotal,
    total,
  };
}

export function trackedKm(ctx, from, to) {
  const odos = [];
  for (const list of [ctx.fuel, ctx.maintenance, ctx.repairs]) {
    for (const r of list) {
      if (!inRange(recordDate(r), from, to)) continue;
      const n = Number(r.odometer);
      if (Number.isFinite(n) && n > 0) odos.push(n);
    }
  }
  if (ctx.car?.odometer) odos.push(Number(ctx.car.odometer));
  if (odos.length < 2) return { km: 0, min: 0, max: 0 };
  const min = Math.min(...odos);
  const max = Math.max(...odos);
  return { km: Math.max(0, max - min), min, max };
}

export function costPerKm(total, km) {
  if (!km) return null;
  return round(total / km, 2);
}

export function averages(total, from, to) {
  const start = from || toDate(to);
  const end = to || new Date();
  const days = Math.max(1, daysBetween(start, end) + (from ? 1 : 0) || 1);
  const months = Math.max(1, monthsBetween(start, end));
  return {
    daily: round(total / days, 2),
    weekly: round(total / (days / 7), 2),
    monthly: round(total / months, 2),
    days,
    months,
  };
}

export function categoryBreakdown(costs) {
  const items = [
    { id: "fuel", label: "البنزين", value: costs.fuelTotal },
    { id: "maintenance", label: "الصيانة", value: costs.maintTotal },
    { id: "repairs", label: "الإصلاحات", value: costs.repairTotal },
    { id: "documents", label: "المستندات", value: costs.docsTotal },
    { id: "other", label: "مصاريف أخرى", value: costs.otherTotal },
  ];
  const total = costs.total || 0;
  return items
    .map((x) => ({ ...x, pct: total ? round((x.value / total) * 100, 1) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function topExpenseThisMonth(costs) {
  const cats = categoryBreakdown(costs);
  return cats[0] && cats[0].value > 0 ? cats[0] : null;
}

export function monthlySeries(ctx, months = 6) {
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const { from, to, key } = monthRange(-i);
    const c = collectCosts(ctx, from, to);
    out.push({
      key,
      label: MONTHS_AR[from.getMonth()],
      year: from.getFullYear(),
      total: c.total,
      fuel: c.fuelTotal,
      maintenance: c.maintTotal,
      repairs: c.repairTotal,
      other: c.otherTotal + c.docsTotal,
    });
  }
  return out;
}

export function fullToFullConsumption(fuelEntries) {
  const full = sortByDateDesc(fuelEntries.filter((f) => f.isFull && Number(f.odometer) > 0 && Number(f.liters) > 0), "date").reverse();
  full.sort((a, b) => Number(a.odometer) - Number(b.odometer) || (toDate(a.date) - toDate(b.date)));
  const samples = [];
  for (let i = 1; i < full.length; i++) {
    const prev = full[i - 1];
    const curr = full[i];
    const distance = Number(curr.odometer) - Number(prev.odometer);
    const liters = Number(curr.liters);
    if (distance <= 0 || liters <= 0) continue;
    const kmL = distance / liters;
    samples.push({
      fromId: prev.id,
      toId: curr.id,
      distance,
      liters,
      kmL: round(kmL, 2),
      l100: round(100 / kmL, 2),
      costPerKm: curr.total && distance ? round(Number(curr.total) / distance, 2) : null,
      date: curr.date,
    });
  }
  const avg = samples.length ? round(samples.reduce((a, s) => a + s.kmL, 0) / samples.length, 2) : null;
  return { samples, avgKmL: avg, avgL100: avg ? round(100 / avg, 2) : null, ready: samples.length >= 1 };
}

export function recentConsumptionShift(samples, count = 3) {
  if (samples.length < count + 1) return null;
  const recent = samples.slice(-count);
  const older = samples.slice(0, -count);
  if (!older.length) return null;
  const r = recent.reduce((a, s) => a + s.l100, 0) / recent.length;
  const o = older.reduce((a, s) => a + s.l100, 0) / older.length;
  if (!o) return null;
  const change = ((r - o) / o) * 100;
  return { recent: round(r, 2), older: round(o, 2), change: round(change, 1), up: change >= 8 };
}

export function nextMaintenance(record, car) {
  if (!record) return null;
  const lastOdo = Number(record.odometer) || 0;
  const lastDate = toDate(record.date);
  let nextOdo = null;
  let nextDate = null;
  if (record.intervalKm) nextOdo = lastOdo + Number(record.intervalKm);
  if (record.intervalMonths && lastDate) nextDate = addMonths(lastDate, Number(record.intervalMonths));
  if (record.nextDate) nextDate = toDate(record.nextDate);
  const currentOdo = Number(car?.odometer || lastOdo);
  const remainKm = nextOdo != null ? nextOdo - currentOdo : null;
  const remainDays = nextDate ? daysBetween(new Date(), nextDate) : null;
  const status = maintenanceStatus(remainKm, remainDays);
  return { lastOdo, lastDate, nextOdo, nextDate, remainKm, remainDays, status, type: record.type, label: labelOf(MAINTENANCE_TYPES, record.type) };
}

export function maintenanceStatus(remainKm, remainDays) {
  const overdue = (remainKm != null && remainKm < 0) || (remainDays != null && remainDays < 0);
  if (overdue) return { id: "overdue", label: "متأخر" };
  const due = (remainKm != null && remainKm <= 200) || (remainDays != null && remainDays <= 7);
  if (due) return { id: "due", label: "حان الموعد" };
  const approaching = (remainKm != null && remainKm <= 1000) || (remainDays != null && remainDays <= 30);
  if (approaching) return { id: "approaching", label: "قرب الميعاد" };
  if (remainKm == null && remainDays == null) return { id: "none", label: "من غير ميعاد" };
  return { id: "safe", label: "في الموعد" };
}

export function latestByType(records, typeField = "type") {
  const map = new Map();
  for (const r of sortByDateDesc(records)) {
    const key = r[typeField] || r.id;
    if (!map.has(key)) map.set(key, r);
  }
  return [...map.values()];
}

export function documentStatus(doc) {
  const end = toDate(doc.endDate);
  if (!end) return { id: "none", label: "من غير تاريخ", days: null };
  const days = daysBetween(new Date(), end);
  if (days < 0) return { id: "expired", label: "منتهي", days };
  if (days < 30) return { id: "urgent", label: "عاجل", days };
  if (days <= 60) return { id: "approaching", label: "قرب الميعاد", days };
  return { id: "safe", label: "آمن", days };
}

export function upcomingItems(ctx, limit = 6) {
  const items = [];
  for (const rec of latestByType(ctx.maintenance)) {
    const n = nextMaintenance(rec, ctx.car);
    if (!n || (n.remainKm == null && n.remainDays == null)) continue;
    items.push({
      id: rec.id,
      kind: "maintenance",
      title: n.label,
      remainKm: n.remainKm,
      remainDays: n.remainDays,
      status: n.status,
      sort: n.remainKm != null ? n.remainKm : (n.remainDays || 9999) * 20,
    });
  }
  for (const doc of ctx.documents) {
    const st = documentStatus(doc);
    if (st.days == null) continue;
    items.push({
      id: doc.id,
      kind: "document",
      title: doc.title || labelOf(DOCUMENT_TYPES, doc.type),
      remainDays: st.days,
      status: { id: st.id, label: st.label },
      sort: (st.days || 0) * 20,
    });
  }
  for (const rem of ctx.reminders || []) {
    if (rem.done) continue;
    if (rem.kind === "km") {
      const remain = Number(rem.odometer) - Number(ctx.car?.odometer || 0);
      items.push({
        id: rem.id,
        kind: "reminder",
        title: rem.title,
        remainKm: remain,
        status: maintenanceStatus(remain, null),
        sort: remain,
      });
    } else if (rem.date) {
      const days = daysBetween(new Date(), toDate(rem.date));
      items.push({
        id: rem.id,
        kind: "reminder",
        title: rem.title,
        remainDays: days,
        status: maintenanceStatus(null, days),
        sort: days * 20,
      });
    }
  }
  const rank = { overdue: 0, expired: 0, due: 1, urgent: 1, approaching: 2, safe: 3, none: 4 };
  return items
    .sort((a, b) => (rank[a.status.id] ?? 5) - (rank[b.status.id] ?? 5) || a.sort - b.sort)
    .slice(0, limit);
}

export function recentActivity(ctx, limit = 8) {
  const rows = [];
  for (const r of ctx.fuel) rows.push({ ...r, kind: "fuel", title: "بنزين", amount: r.total, date: r.date });
  for (const r of ctx.maintenance) rows.push({ ...r, kind: "maintenance", title: labelOf(MAINTENANCE_TYPES, r.type), amount: r.total, date: r.date });
  for (const r of ctx.repairs) rows.push({ ...r, kind: "repair", title: r.problem || "إصلاح", amount: r.total, date: r.date });
  for (const r of ctx.expenses) rows.push({ ...r, kind: "expense", title: labelOf(EXPENSE_CATEGORIES, r.category), amount: r.amount, date: r.date });
  for (const r of ctx.documents) rows.push({ ...r, kind: "document", title: r.title || labelOf(DOCUMENT_TYPES, r.type), amount: r.cost, date: r.date || r.startDate });
  return sortByDateDesc(rows).slice(0, limit);
}

export function tireAge(record) {
  const d = toDate(record.installDate || record.manufactureDate);
  if (!d) return null;
  return monthsBetween(d, new Date());
}

export function batteryAge(record) {
  const d = toDate(record.purchaseDate || record.installDate);
  if (!d) return null;
  return monthsBetween(d, new Date());
}

export function comparePeriods(ctx, from, to) {
  const current = collectCosts(ctx, from, to);
  if (!from) return { current, previous: null, change: null };
  const span = (to || new Date()) - from;
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(from.getTime() - span);
  const previous = collectCosts(ctx, prevFrom, prevTo);
  return { current, previous, change: pctChange(current.total, previous.total) };
}

export function monthCompare(ctx) {
  const cur = monthRange(0);
  const prev = monthRange(-1);
  const current = collectCosts(ctx, cur.from, cur.to);
  const previous = collectCosts(ctx, prev.from, prev.to);
  return { current, previous, change: pctChange(current.total, previous.total), cur, prev };
}

export function expenseLabel(r, customCats = []) {
  return labelOf([...EXPENSE_CATEGORIES, ...customCats.map((c) => ({ id: c.id, label: c.name }))], r.category);
}
