import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryAlert,
  decidePurchase,
  money,
  noSpendStreak,
  periodForDate,
  runway,
  setupTotals,
  snapshot,
  weeklyCompare,
} from "../src/js/calc.js";

const setup = { income: 15000, rent: 4000, bills: 1500, debts: 1000, savingsGoal: 2000, payday: 1 };

test("available to spend matches the 15k example", () => {
  const t = setupTotals(setup);
  assert.equal(t.obligations, 6500);
  assert.equal(t.reserved, 8500);
  assert.equal(t.available, 6500);
});

test("daily allowance floors to 216 on a 30-day month", () => {
  const now = new Date("2026-09-01T12:00:00");
  const snap = snapshot(setup, [], now);
  assert.equal(snap.period.days, 30);
  assert.equal(snap.dailyAllowed, 216);
  assert.equal(snap.trueAvailable, 6500);
});

test("dashboard numbers after mixed spending", () => {
  const now = new Date("2026-09-08T12:00:00");
  const expenses = [
    { amount: 4000, categoryId: "rent", date: "2026-09-02" },
    { amount: 1850, categoryId: "food", date: "2026-09-04" },
    { amount: 1300, categoryId: "outings", date: "2026-09-05" },
    { amount: 700, categoryId: "impulse", date: "2026-09-07" },
  ];
  const snap = snapshot(setup, expenses, now);
  assert.equal(snap.totalSpent, 7850);
  assert.equal(snap.remainingCash, 7150);
  assert.equal(snap.mustReserve, 4500);
  assert.equal(snap.trueAvailable, 2650);
});

test("runway warns when the current pace burns the month early", () => {
  const now = new Date("2026-09-08T12:00:00");
  const expenses = [
    { amount: 4000, categoryId: "food", date: "2026-09-02" },
    { amount: 2000, categoryId: "outings", date: "2026-09-05" },
  ];
  const run = runway(setup, expenses, now);
  assert.equal(run.lastsTheMonth, false);
  assert.ok(run.runoutDate);
  assert.ok(["warn", "critical"].includes(run.status));
});

test("can-I-buy turns red when the purchase blows the envelope", () => {
  const now = new Date("2026-09-10T12:00:00");
  const expenses = [{ amount: 6000, categoryId: "food", date: "2026-09-03" }];
  const red = decidePurchase(setup, expenses, 1500, now);
  assert.equal(red.tone, "red");
  assert.ok(red.overBy > 0);
});

test("can-I-buy yellow when daily allowance drops hard", () => {
  const now = new Date("2026-09-02T12:00:00");
  const result = decidePurchase(setup, [], 1500, now);
  assert.equal(result.tone, "yellow");
  assert.ok(result.afterDaily < result.before.dailyAllowed);
  assert.equal(result.overBy, 0);
});

test("food alert fires when 80% of budget is gone before 60% of the month", () => {
  const now = new Date("2026-09-08T12:00:00");
  const food = { id: "food", name: "طلبات أكل", share: 0.28 };
  const budget = 6500 * 0.28;
  const spent = Math.round(budget * 0.85);
  const alert = categoryAlert(setup, [{ amount: spent, categoryId: "food", date: "2026-09-04" }], food, now);
  assert.ok(alert);
  assert.equal(alert.tone, "warn");
  assert.ok(alert.overBy > 0);
});

test("no-spend streak counts consecutive empty days", () => {
  const now = new Date("2026-09-10T12:00:00");
  const expenses = [{ amount: 80, categoryId: "food", date: "2026-09-07" }];
  const streak = noSpendStreak(expenses, now);
  assert.equal(streak.streak, 3);
  assert.equal(streak.todayIsNoSpend, true);
});

test("weekly compare reports savings when this week is cheaper", () => {
  const now = new Date("2026-09-10T12:00:00");
  const expenses = [
    { amount: 1740, categoryId: "food", date: "2026-08-31" },
    { amount: 1280, categoryId: "food", date: "2026-09-08" },
  ];
  const week = weeklyCompare(expenses, now);
  assert.equal(week.saved, 460);
});

test("money rounding stays stable", () => {
  assert.equal(money(0.1 + 0.2), 0.3);
});

test("period respects payday", () => {
  const period = periodForDate(new Date("2026-09-10T12:00:00"), 25);
  assert.equal(period.startIso, "2026-08-25");
  assert.equal(period.endIso, "2026-09-24");
});
