import { icon } from "./icons.js";
import { escapeHtml, html, raw } from "./utils.js";

const overlay = () => document.getElementById("overlay-root");
const toasts = () => document.getElementById("toast-root");
const stack = [];

export function toast(message, { type = "success", action } = {}) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${escapeHtml(message)}</span>${action ? `<button class="btn btn-sm" type="button">${escapeHtml(action.label)}</button>` : ""}`;
  if (action) el.querySelector("button").onclick = () => action.onClick();
  toasts().appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function pushOverlay(el, { onClose } = {}) {
  const backdrop = document.createElement("div");
  backdrop.className = "overlay-backdrop";
  backdrop.addEventListener("click", () => closeTop());
  overlay().appendChild(backdrop);
  overlay().appendChild(el);
  stack.push({ backdrop, el, onClose });
  document.body.style.overflow = "hidden";
}

export function closeTop() {
  const item = stack.pop();
  if (!item) return false;
  item.backdrop.remove();
  item.el.remove();
  item.onClose?.();
  if (!stack.length) document.body.style.overflow = "";
  return true;
}

export function closeAll() {
  while (closeTop()) {}
}

export function hasOverlay() {
  return stack.length > 0;
}

export function modal({ title, body, actions = [], danger = false }) {
  const el = document.createElement("div");
  el.className = "modal";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `
    <div class="page-head-row">
      <h2>${escapeHtml(title)}</h2>
      <button type="button" class="btn btn-ghost btn-sm" data-close aria-label="إغلاق">${icon("close", 18)}</button>
    </div>
    <div class="stack" style="margin-top:12px">${typeof body === "string" ? body : ""}</div>
    <div class="form-actions" style="margin-top:16px"></div>`;
  if (typeof body !== "string" && body) el.querySelector(".stack").appendChild(body);
  const box = el.querySelector(".form-actions");
  for (const a of actions) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `btn ${a.primary ? (danger ? "btn-danger" : "btn-primary") : "btn-ghost"}`;
    b.textContent = a.label;
    b.onclick = async () => {
      const ok = await a.onClick?.();
      if (ok !== false) closeTop();
    };
    box.appendChild(b);
  }
  el.querySelector("[data-close]").onclick = () => closeTop();
  pushOverlay(el);
  return el;
}

export function confirmDialog({ title, message, confirmLabel = "تأكيد", danger = false }) {
  return new Promise((resolve) => {
    modal({
      title,
      body: `<p>${escapeHtml(message)}</p>`,
      danger,
      actions: [
        { label: "رجوع", onClick: () => resolve(false) },
        {
          label: confirmLabel,
          primary: true,
          onClick: () => {
            resolve(true);
          },
        },
      ],
    });
  });
}

export function sheet({ title, body }) {
  const el = document.createElement("div");
  el.className = "sheet";
  el.setAttribute("role", "dialog");
  el.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="page-head-row">
      <h2>${escapeHtml(title)}</h2>
      <button type="button" class="btn btn-ghost btn-sm" data-close aria-label="إغلاق">${icon("close", 18)}</button>
    </div>
    <div class="sheet-body" style="margin-top:12px"></div>`;
  const box = el.querySelector(".sheet-body");
  if (typeof body === "string") box.innerHTML = body;
  else if (body) box.appendChild(body);
  el.querySelector("[data-close]").onclick = () => closeTop();
  pushOverlay(el);
  return el;
}

export function isMobile() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

export function overlayFor(opts) {
  return isMobile() ? sheet(opts) : modal(opts);
}

export function emptyState({ iconName = "info", title, text, cta, onClick }) {
  return html`<div class="empty-state">
    <div class="icon-wrap">${raw(icon(iconName, 28))}</div>
    <h3>${title}</h3>
    <p class="muted">${text}</p>
    ${raw(cta ? `<button class="btn btn-primary" type="button" data-empty-cta>${escapeHtml(cta)}</button>` : "")}
  </div>`.replace(
    "data-empty-cta",
    "data-empty-cta"
  );
}

export function bindEmpty(root, onClick) {
  root.querySelector("[data-empty-cta]")?.addEventListener("click", onClick);
}

export function field({
  id,
  label,
  type = "text",
  value = "",
  unit,
  placeholder,
  required,
  optional,
  options,
  min,
  step,
  inputMode,
  rows,
}) {
  const opt = optional ? ` <span class="field-optional">(اختياري)</span>` : "";
  const req = required ? " required" : "";
  let control;
  if (options) {
    const opts = options
      .map((o) => `<option value="${escapeHtml(o.id)}" ${String(o.id) === String(value) ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
      .join("");
    control = `<select id="${id}"${req}>${opts}</select>`;
  } else if (type === "textarea") {
    control = `<textarea id="${id}" rows="${rows || 3}" placeholder="${escapeHtml(placeholder || "")}">${escapeHtml(value)}</textarea>`;
  } else {
    control = `<input id="${id}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder || "")}" ${min != null ? `min="${min}"` : ""} ${step ? `step="${step}"` : ""} ${inputMode ? `inputmode="${inputMode}"` : ""}${req} />`;
  }
  return `<div class="field"><label class="field-label" for="${id}">${escapeHtml(label)}${opt}</label>
    <div class="field-control">${control}${unit ? `<span class="field-suffix">${escapeHtml(unit)}</span>` : ""}</div>
    <div class="field-error" id="${id}-error" hidden></div></div>`;
}

export function setError(id, msg) {
  const el = document.getElementById(`${id}-error`);
  if (!el) return;
  if (!msg) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = msg;
}

export function val(id) {
  return document.getElementById(id)?.value ?? "";
}

export function badgeFor(status) {
  const map = {
    safe: "badge-safe",
    good: "badge-safe",
    ok: "badge-safe",
    approaching: "badge-warn",
    warn: "badge-warn",
    due: "badge-due",
    urgent: "badge-due",
    overdue: "badge-danger",
    expired: "badge-danger",
    danger: "badge-danger",
    none: "badge-warn",
  };
  const cls = map[status.id] || "badge-warn";
  return `<span class="badge ${cls}">${escapeHtml(status.label)}</span>`;
}

export function pageTitle(title, sub) {
  return `<div class="page-head"><h1>${escapeHtml(title)}</h1>${sub ? `<p class="muted">${escapeHtml(sub)}</p>` : ""}</div>`;
}

export function listItem({ title, meta, amount, badge, demo }) {
  return `<article class="list-card">
    <div>
      <div class="list-title">${escapeHtml(title)} ${demo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
      <div class="faint">${escapeHtml(meta || "")}</div>
    </div>
    <div style="text-align:left">
      ${amount != null ? `<strong>${escapeHtml(amount)}</strong>` : ""}
      <div>${badge || ""}</div>
    </div>
  </article>`;
}

export function chips(items, active, onHtml = true) {
  return `<div class="wrap">${items
    .map(
      (it) =>
        `<button type="button" class="chip ${it.id === active ? "is-active" : ""}" data-chip="${escapeHtml(it.id)}">${escapeHtml(it.label)}</button>`
    )
    .join("")}</div>`;
}
