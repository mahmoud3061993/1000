const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESC[ch]);
}

export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    const rawVal = values[i];
    const piece =
      rawVal && typeof rawVal === "object" && rawVal.__html
        ? rawVal.__html
        : rawVal == null
          ? ""
          : escapeHtml(rawVal);
    return out + str + piece;
  }, "");
}

export function raw(value) {
  return { __html: String(value ?? "") };
}

export function uid(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatMoney(value, symbol = "جنيه") {
  const n = Number(value) || 0;
  const formatted = Math.abs(n).toLocaleString("ar-EG", {
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
  return `${formatted} ${symbol}`;
}

export function formatInt(value) {
  return Math.round(Number(value) || 0).toLocaleString("ar-EG");
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function on(el, ev, fn) {
  el?.addEventListener(ev, fn);
}

export function isNative() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}
