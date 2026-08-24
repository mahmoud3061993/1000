import { appState } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { chips, pageTitle } from "../ui.js";
import { formatDate, formatMoney, sortByDateDesc } from "../utils.js";
import { icon } from "../icons.js";
import { expenseLabel } from "../calculations.js";
import { DOCUMENT_TYPES, MAINTENANCE_TYPES } from "../constants.js";
import { labelOf } from "../utils.js";

const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "fuel", label: "بنزين" },
  { id: "maintenance", label: "صيانة" },
  { id: "repair", label: "إصلاحات" },
  { id: "expense", label: "مصاريف" },
  { id: "document", label: "مستندات" },
];

export async function renderTimeline(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  let filter = "all";
  let q = "";
  const rows = collect(ctx);
  root.innerHTML = `${pageTitle("سجل العربية", "كل اللي اتسجل، من الأحدث للأقدم.")}
    <div class="search-box">${icon("search", 18)}<input id="q" placeholder="بحث في السجل" /></div>
    <div id="chips">${chips(FILTERS, filter)}</div>
    <div id="list"></div>`;
  const paint = () => {
    const list = rows.filter((r) => (filter === "all" || r.kind === filter) && (!q || `${r.title} ${r.meta}`.includes(q)));
    const box = root.querySelector("#list");
    if (!rows.length) {
      box.innerHTML = `<div class="empty-state"><h3>السجل فاضي لسه.</h3><p class="muted">كل تفويلة وصيانة وإصلاح ومصروف هتتجمع هنا تلقائي.</p></div>`;
      return;
    }
    if (!list.length) {
      box.innerHTML = `<p class="muted">مفيش نتائج. <button class="btn btn-sm btn-ghost" id="clear">مسح الفلاتر</button></p>`;
      box.querySelector("#clear").onclick = () => {
        filter = "all";
        q = "";
        document.getElementById("q").value = "";
        bind();
        paint();
      };
      return;
    }
    box.innerHTML = list
      .slice(0, 80)
      .map(
        (r) => `<div class="timeline-item">
        <span class="timeline-dot"></span>
        <div><div class="list-title">${esc(r.title)}</div><div class="faint">${formatDate(r.date)} · ${esc(r.meta || "")}</div></div>
        <strong>${formatMoney(r.amount || 0, currency())}</strong>
      </div>`
      )
      .join("");
  };
  const bind = () => {
    root.querySelector("#chips").innerHTML = chips(FILTERS, filter);
    root.querySelectorAll("[data-chip]").forEach((c) => {
      c.onclick = () => {
        filter = c.dataset.chip;
        bind();
        paint();
      };
    });
  };
  bind();
  paint();
  document.getElementById("q").oninput = (e) => {
    q = e.target.value.trim();
    paint();
  };
}

function collect(ctx) {
  const rows = [];
  for (const r of ctx.fuel) rows.push({ kind: "fuel", date: r.date, title: "بنزين", amount: r.total, meta: r.station || "" });
  for (const r of ctx.maintenance) rows.push({ kind: "maintenance", date: r.date, title: labelOf(MAINTENANCE_TYPES, r.type), amount: r.total, meta: r.workshop || "" });
  for (const r of ctx.repairs) rows.push({ kind: "repair", date: r.date, title: r.problem || "إصلاح", amount: r.total, meta: r.workshop || "" });
  for (const r of ctx.expenses) rows.push({ kind: "expense", date: r.date, title: expenseLabel(r, ctx.customCategories), amount: r.amount, meta: "" });
  for (const r of ctx.documents) rows.push({ kind: "document", date: r.date || r.startDate, title: r.title || labelOf(DOCUMENT_TYPES, r.type), amount: r.cost, meta: "" });
  return sortByDateDesc(rows);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
