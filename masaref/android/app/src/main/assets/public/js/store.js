import { STORAGE_KEY } from "./constants.js";
import { isoDate, money } from "./calc.js";
import { nowIso, uid } from "./utils.js";

const EMPTY = {
  version: 1,
  setup: null,
  expenses: [],
  noSpendLog: [],
  createdAt: null,
  updatedAt: null,
};

let cache = structuredClone(EMPTY);
const listeners = new Set();

function safeParse(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return structuredClone(EMPTY);
    return {
      ...structuredClone(EMPTY),
      ...data,
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      noSpendLog: Array.isArray(data.noSpendLog) ? data.noSpendLog : [],
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

function persist() {
  cache.updatedAt = nowIso();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach((fn) => fn(cache));
}

export function loadStore() {
  cache = safeParse(localStorage.getItem(STORAGE_KEY) || "");
  return cache;
}

export function getState() {
  return cache;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function saveSetup(setup) {
  cache.setup = {
    income: money(setup.income),
    rent: money(setup.rent),
    bills: money(setup.bills),
    debts: money(setup.debts),
    savingsGoal: money(setup.savingsGoal),
    payday: Math.min(28, Math.max(1, Number(setup.payday) || 1)),
    name: String(setup.name || "").trim(),
  };
  if (!cache.createdAt) cache.createdAt = nowIso();
  persist();
  return cache.setup;
}

export function addExpense(input) {
  const rec = {
    id: uid("exp"),
    amount: money(input.amount),
    categoryId: input.categoryId || "other",
    note: String(input.note || "").trim(),
    date: isoDate(input.date || new Date()),
    createdAt: nowIso(),
  };
  cache.expenses.push(rec);
  persist();
  return rec;
}

export function updateExpense(id, patch) {
  const rec = cache.expenses.find((e) => e.id === id);
  if (!rec) return null;
  if (patch.amount != null) rec.amount = money(patch.amount);
  if (patch.categoryId) rec.categoryId = patch.categoryId;
  if (patch.note != null) rec.note = String(patch.note).trim();
  if (patch.date) rec.date = isoDate(patch.date);
  persist();
  return rec;
}

export function deleteExpense(id) {
  cache.expenses = cache.expenses.filter((e) => e.id !== id);
  persist();
}

export function markNoSpend(date = new Date()) {
  const day = isoDate(date);
  if (!cache.noSpendLog.includes(day)) cache.noSpendLog.push(day);
  persist();
}

export function exportBackup() {
  return JSON.stringify({ ...cache, exportedAt: nowIso() }, null, 2);
}

export function importBackup(raw, mode = "replace") {
  const data = safeParse(raw);
  if (mode === "replace") {
    cache = data;
  } else {
    const ids = new Set(cache.expenses.map((e) => e.id));
    for (const exp of data.expenses) {
      if (!ids.has(exp.id)) cache.expenses.push(exp);
    }
    if (data.setup && !cache.setup) cache.setup = data.setup;
  }
  persist();
  return cache;
}

export function resetAll() {
  cache = structuredClone(EMPTY);
  persist();
}

export function seedDemo() {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return isoDate(d);
  };
  cache.setup = {
    income: 15000,
    rent: 4000,
    bills: 1500,
    debts: 1000,
    savingsGoal: 2000,
    payday: 1,
    name: "",
  };
  cache.expenses = [
    { id: uid("exp"), amount: 4000, categoryId: "rent", note: "إيجار الشهر", date: iso(Math.min(today.getDate() - 1, 3)), createdAt: nowIso() },
    { id: uid("exp"), amount: 1850, categoryId: "food", note: "طلبات أكل", date: iso(1), createdAt: nowIso() },
    { id: uid("exp"), amount: 1300, categoryId: "outings", note: "قهوة وخروجات", date: iso(2), createdAt: nowIso() },
    { id: uid("exp"), amount: 970, categoryId: "impulse", note: "مشتريات من غير خطة", date: iso(3), createdAt: nowIso() },
    { id: uid("exp"), amount: 430, categoryId: "transport", note: "مواصلات", date: iso(1), createdAt: nowIso() },
    { id: uid("exp"), amount: 300, categoryId: "food", note: "عشا بره", date: iso(0), createdAt: nowIso() },
  ];
  cache.createdAt = nowIso();
  persist();
  return cache;
}
