import { html } from "./utils.js";

export function toast(message, ms = 2600) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-on"));
  setTimeout(() => {
    el.classList.remove("is-on");
    setTimeout(() => el.remove(), 280);
  }, ms);
}

export function sheet({ title, body, actions = "" }) {
  closeTop();
  const root = document.getElementById("overlay-root");
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = html`<div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <h3>${title}</h3>
        <button type="button" class="icon-btn" data-close aria-label="إغلاق">×</button>
      </div>
      <div class="sheet-body">${{ __html: body }}</div>
      ${actions ? { __html: `<div class="sheet-actions">${actions}</div>` } : ""}
    </div>`;
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap || e.target.closest("[data-close]")) closeTop();
  });
  root.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add("is-on"));
  return wrap.querySelector(".sheet");
}

export function closeTop() {
  const root = document.getElementById("overlay-root");
  const wrap = root?.querySelector(".sheet-wrap:last-child");
  if (!wrap) return;
  wrap.classList.remove("is-on");
  setTimeout(() => wrap.remove(), 220);
}

export function hasOverlay() {
  return Boolean(document.querySelector(".sheet-wrap"));
}
