/** Spending-control math. No UI. Safe to unit-test. */

export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T12:00:00`);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isoDate(value) {
  const d = toDate(value) || new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(value) {
  const d = new Date(toDate(value) || new Date());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(value, days) {
  const d = new Date(toDate(value) || new Date());
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a, b) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function arabicMonthName(date) {
  const d = toDate(date) || new Date();
  return d.toLocaleDateString("ar-EG", { month: "long" });
}

export function formatArabicDate(value) {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

export const FIXED_CATEGORY_IDS = ["rent", "bills", "debts", "savings"];

export function isFixedCategory(id) {
  return FIXED_CATEGORY_IDS.includes(String(id || ""));
}

export function setupTotals(setup = {}) {
  const income = money(setup.income);
  const rent = money(setup.rent);
  const bills = money(setup.bills);
  const debts = money(setup.debts);
  const savingsGoal = money(setup.savingsGoal);
  const obligations = money(rent + bills + debts);
  const reserved = money(obligations + savingsGoal);
  const available = money(Math.max(0, income - reserved));
  return { income, rent, bills, debts, savingsGoal, obligations, reserved, available };
}

/**
 * Salary cycle. payday=1 means calendar month.
 * payday=25 means 25th → 24th of next month.
 */
export function periodForDate(now = new Date(), payday = 1) {
  const d = startOfDay(now);
  let pay = Number(payday) || 1;
  pay = clamp(Math.round(pay), 1, 28);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  let start;
  if (day >= pay) start = new Date(year, month, pay);
  else start = new Date(year, month - 1, pay);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start.getFullYear(), start.getMonth() + 1, pay);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  const days = daysBetween(start, end) + 1;
  const elapsed = clamp(daysBetween(start, d) + 1, 1, days);
  const remaining = clamp(days - elapsed + 1, 1, days);
  return {
    start,
    end,
    startIso: isoDate(start),
    endIso: isoDate(end),
    days,
    elapsed,
    remaining,
    progress: elapsed / days,
    payday: pay,
  };
}

export function inPeriod(expense, period) {
  const day = isoDate(expense?.date || expense?.createdAt);
  return day >= period.startIso && day <= period.endIso;
}

export function splitExpenses(expenses, period) {
  const list = (expenses || []).filter((item) => inPeriod(item, period));
  const discretionary = [];
  const fixedPaid = [];
  for (const item of list) {
    if (isFixedCategory(item.categoryId)) fixedPaid.push(item);
    else discretionary.push(item);
  }
  const sum = (arr) => money(arr.reduce((n, item) => n + money(item.amount), 0));
  return {
    all: list,
    discretionary,
    fixedPaid,
    totalSpent: sum(list),
    discretionarySpent: sum(discretionary),
    fixedPaidTotal: sum(fixedPaid),
  };
}

export function snapshot(setup, expenses, now = new Date()) {
  const totals = setupTotals(setup);
  const period = periodForDate(now, setup?.payday || 1);
  const split = splitExpenses(expenses, period);
  const remainingCash = money(totals.income - split.totalSpent);
  const mustReserve = money(Math.max(0, totals.reserved - split.fixedPaidTotal));
  const trueAvailable = money(Math.max(0, remainingCash - mustReserve));
  const overspent = money(Math.max(0, mustReserve - remainingCash));
  const dailyAllowed = period.remaining > 0 ? Math.floor(trueAvailable / period.remaining) : 0;
  const startingDaily = period.days > 0 ? Math.floor(totals.available / period.days) : 0;
  const spentShare = totals.income > 0 ? split.totalSpent / totals.income : 0;

  return {
    ...totals,
    period,
    ...split,
    remainingCash,
    mustReserve,
    trueAvailable,
    overspent,
    dailyAllowed,
    startingDaily,
    spentShare,
    safe: overspent <= 0 && trueAvailable >= 0,
  };
}

export function runway(setup, expenses, now = new Date()) {
  const snap = snapshot(setup, expenses, now);
  const elapsed = Math.max(1, snap.period.elapsed);
  const pace = money(snap.discretionarySpent / elapsed);
  if (pace <= 0) {
    return {
      ...snap,
      pace: 0,
      daysUntilEmpty: null,
      runoutDate: null,
      runoutIso: null,
      lastsTheMonth: true,
      status: "safe",
    };
  }
  const daysUntilEmpty = snap.trueAvailable / pace;
  const runoutDate = addDays(now, daysUntilEmpty);
  const lastsTheMonth = startOfDay(runoutDate) > startOfDay(snap.period.end);
  let status = "ok";
  if (!lastsTheMonth) status = daysUntilEmpty <= 3 ? "critical" : "warn";
  return {
    ...snap,
    pace,
    daysUntilEmpty,
    runoutDate,
    runoutIso: isoDate(runoutDate),
    lastsTheMonth,
    status,
  };
}

export function decidePurchase(setup, expenses, amount, now = new Date()) {
  const cost = money(amount);
  const before = snapshot(setup, expenses, now);
  const afterAvailable = money(before.trueAvailable - cost);
  const afterDaily =
    afterAvailable <= 0 || before.period.remaining <= 0
      ? 0
      : Math.floor(Math.max(0, afterAvailable) / before.period.remaining);
  if (cost <= 0) {
    return {
      tone: "neutral",
      label: "حط المبلغ",
      cost,
      before,
      afterAvailable: before.trueAvailable,
      afterDaily: before.dailyAllowed,
      overBy: 0,
    };
  }
  if (afterAvailable < 0) {
    return {
      tone: "red",
      label: "هتخطى الميزانية",
      cost,
      before,
      afterAvailable: 0,
      afterDaily: 0,
      overBy: money(-afterAvailable),
    };
  }
  const drop = before.dailyAllowed - afterDaily;
  const heavy = cost >= before.trueAvailable * 0.25 || drop >= 40;
  return {
    tone: heavy ? "yellow" : "green",
    label: heavy ? "تقدر، بس هتأثر على باقي الشهر" : "ينفع",
    cost,
    before,
    afterAvailable,
    afterDaily,
    overBy: 0,
    drop,
  };
}

export function categoryTotals(expenses, period) {
  const map = new Map();
  for (const item of expenses || []) {
    if (!inPeriod(item, period)) continue;
    const id = item.categoryId || "other";
    map.set(id, money((map.get(id) || 0) + money(item.amount)));
  }
  return map;
}

export function topSpenders(expenses, period, categories, limit = 3) {
  const totals = categoryTotals(expenses, period);
  const rows = [...totals.entries()]
    .filter(([id]) => !isFixedCategory(id))
    .map(([id, total]) => {
      const cat = categories.find((c) => c.id === id) || { id, name: id };
      return { id, name: cat.name, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  return rows;
}

export function categoryAlert(setup, expenses, category, now = new Date()) {
  if (!category || isFixedCategory(category.id)) return null;
  const snap = snapshot(setup, expenses, now);
  const share = Number(category.share) || 0;
  const budget = money(snap.available * share);
  if (budget <= 0) return null;
  const spent = money(
    snap.discretionary
      .filter((item) => item.categoryId === category.id)
      .reduce((n, item) => n + money(item.amount), 0)
  );
  const used = spent / budget;
  const progress = snap.period.progress;
  if (used >= 0.8 && progress < 0.6) {
    const projected = progress > 0 ? money(spent / progress) : spent;
    const overBy = money(Math.max(0, projected - budget));
    return {
      tone: "warn",
      categoryId: category.id,
      name: category.name,
      spent,
      budget,
      used,
      projected,
      overBy,
    };
  }
  if (used > 1) {
    return {
      tone: "danger",
      categoryId: category.id,
      name: category.name,
      spent,
      budget,
      used,
      projected: spent,
      overBy: money(spent - budget),
    };
  }
  return null;
}

export function allCategoryAlerts(setup, expenses, categories, now = new Date()) {
  return (categories || [])
    .map((cat) => categoryAlert(setup, expenses, cat, now))
    .filter(Boolean);
}

export function weekRange(now, offsetWeeks = 0) {
  const d = startOfDay(now);
  const weekday = (d.getDay() + 6) % 7; // Monday=0
  const start = addDays(d, -weekday - offsetWeeks * 7);
  const end = addDays(start, 6);
  return { start, end, startIso: isoDate(start), endIso: isoDate(end) };
}

export function sumBetween(expenses, startIso, endIso, discretionaryOnly = true) {
  return money(
    (expenses || [])
      .filter((item) => {
        if (discretionaryOnly && isFixedCategory(item.categoryId)) return false;
        const day = isoDate(item.date);
        return day >= startIso && day <= endIso;
      })
      .reduce((n, item) => n + money(item.amount), 0)
  );
}

export function weeklyCompare(expenses, now = new Date()) {
  const thisWeek = weekRange(now, 0);
  const lastWeek = weekRange(now, 1);
  const current = sumBetween(expenses, thisWeek.startIso, thisWeek.endIso);
  const previous = sumBetween(expenses, lastWeek.startIso, lastWeek.endIso);
  const saved = money(previous - current);
  const pct = previous > 0 ? Math.round(((previous - current) / previous) * 100) : current === 0 ? 0 : -100;
  return { thisWeek, lastWeek, current, previous, saved, pct };
}

export function periodCompare(setup, expenses, now = new Date()) {
  const current = periodForDate(now, setup?.payday || 1);
  const previousNow = addDays(current.start, -1);
  const previous = periodForDate(previousNow, setup?.payday || 1);
  const here = splitExpenses(expenses, current);
  const elapsedPrev = {
    ...previous,
    endIso: isoDate(addDays(previous.start, current.elapsed - 1)),
  };
  const there = money(
    (expenses || [])
      .filter((item) => {
        if (isFixedCategory(item.categoryId)) return false;
        const day = isoDate(item.date);
        return day >= previous.startIso && day <= elapsedPrev.endIso;
      })
      .reduce((n, item) => n + money(item.amount), 0)
  );
  const diff = money(there - here.discretionarySpent);
  const pct = there > 0 ? Math.round((diff / there) * 100) : 0;
  return { currentSpent: here.discretionarySpent, previousSpent: there, diff, pct };
}

export function dailySpendMap(expenses, discretionaryOnly = true) {
  const map = new Map();
  for (const item of expenses || []) {
    if (discretionaryOnly && isFixedCategory(item.categoryId)) continue;
    const day = isoDate(item.date);
    map.set(day, money((map.get(day) || 0) + money(item.amount)));
  }
  return map;
}

export function noSpendStreak(expenses, now = new Date()) {
  const map = dailySpendMap(expenses, true);
  let streak = 0;
  let cursor = startOfDay(now);
  // If today already has spend, streak is 0. Otherwise count backwards.
  for (let i = 0; i < 400; i += 1) {
    const key = isoDate(cursor);
    const spent = money(map.get(key) || 0);
    if (spent > 0) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  const todayIso = isoDate(now);
  const todayIsNoSpend = money(map.get(todayIso) || 0) <= 0;
  return { streak, todayIsNoSpend, todaySpent: money(map.get(todayIso) || 0) };
}

export function todaySpent(expenses, now = new Date()) {
  const day = isoDate(now);
  return money(
    (expenses || [])
      .filter((item) => isoDate(item.date) === day)
      .reduce((n, item) => n + money(item.amount), 0)
  );
}
