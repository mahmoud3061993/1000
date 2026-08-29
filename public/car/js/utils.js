const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESC[ch]);
}

export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    const raw = values[i];
    const piece =
      raw && typeof raw === "object" && raw.__html
        ? raw.__html
        : raw == null
          ? ""
          : escapeHtml(raw);
    return out + str + piece;
  }, "");
}

export function raw(value) {
  return { __html: String(value ?? "") };
}

export function uid(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T12:00:00`);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function daysBetween(a, b) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}

export function moneyNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatNumber(value, fraction = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-US", {
    numberingSystem: "latn",
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(n);
}

export function formatMoney(value, symbol = "جنيه") {
  const n = moneyNumber(value);
  const hasDec = Math.abs(n % 1) > 0.0005;
  return `${formatNumber(n, hasDec ? 2 : 0)} ${symbol}`;
}

export function formatKm(value) {
  return `${formatNumber(Math.round(Number(value) || 0))} كم`;
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    numberingSystem: "latn",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatMonthYear(date) {
  const d = toDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    numberingSystem: "latn",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function round(n, digits = 2) {
  const f = 10 ** digits;
  return Math.round((Number(n) || 0) * f) / f;
}

export function pctChange(current, previous) {
  if (!previous || previous === 0) return null;
  return round(((current - previous) / Math.abs(previous)) * 100, 1);
}

export function inRange(date, from, to) {
  const d = toDate(date);
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function monthRange(offset = 0, fromDate = new Date()) {
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + offset, 1);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to, key: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}` };
}

export function periodRange(id, custom = {}) {
  const now = new Date();
  if (id === "30d") return { from: new Date(now.getTime() - 29 * 86400000), to: now, label: "آخر 30 يوم" };
  if (id === "3m") return { from: addMonths(now, -3), to: now, label: "آخر 3 شهور" };
  if (id === "6m") return { from: addMonths(now, -6), to: now, label: "آخر 6 شهور" };
  if (id === "ytd") return { from: new Date(now.getFullYear(), 0, 1), to: now, label: "السنة الحالية" };
  if (id === "all") return { from: null, to: now, label: "كل الفترة" };
  if (id === "custom") {
    return {
      from: custom.from ? startOfDay(toDate(custom.from)) : null,
      to: custom.to ? endOfDay(toDate(custom.to)) : now,
      label: "فترة مخصصة",
    };
  }
  return monthRange(0);
}

export function labelOf(list, id) {
  return list.find((x) => x.id === id)?.label || id || "—";
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function on(el, ev, fn) {
  el.addEventListener(ev, fn);
  return () => el.removeEventListener(ev, fn);
}

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function isNative() {
  try {
    return !!(globalThis.Capacitor?.isNativePlatform && Capacitor.isNativePlatform());
  } catch {
    return false;
  }
}

export function isOfflineHtml() {
  return Boolean(globalThis.ARABITY_OFFLINE_FILE) || globalThis.location?.protocol === "file:";
}

export function offlineHtmlUrl() {
  if (isOfflineHtml() || isNative()) return "";
  const path = globalThis.location?.pathname || "";
  if (/\/car(\/|$)/.test(path)) return "/car/arabity-offline.html";
  return "arabity-offline.html";
}

export function nativePlugin(name) {
  return globalThis.Capacitor?.Plugins?.[name] || null;
}

export function parseNum(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function sortByDateDesc(list, field = "date") {
  return [...list].sort((a, b) => {
    const da = toDate(a[field])?.getTime() || 0;
    const db = toDate(b[field])?.getTime() || 0;
    if (db !== da) return db - da;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function monthsBetween(from, to) {
  const a = toDate(from);
  const b = toDate(to) || new Date();
  if (!a) return 0;
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1);
}

export function fileStamp(date = new Date()) {
  const d = toDate(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
