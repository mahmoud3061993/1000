import {
  averages,
  categoryBreakdown,
  collectCosts,
  comparePeriods,
  costPerKm,
  latestByType,
  monthCompare,
  monthlySeries,
  nextMaintenance,
  trackedKm,
  upcomingItems,
} from "../calculations.js";
import { barChart, donutChart, emptyChart } from "../charts.js";
import { DOCUMENT_TYPES, MAINTENANCE_TYPES, MONTHS_AR } from "../constants.js";
import { getSettings } from "../storage.js";
import { appState } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { field, pageTitle } from "../ui.js";
import { formatDate, formatKm, formatMoney, formatMonthYear, formatNumber, labelOf, monthsBetween, periodRange, todayIso } from "../utils.js";
import { icon } from "../icons.js";
import { fullToFullConsumption } from "../calculations.js";

export async function renderReports(root) {
  const { car } = appState();
  if (!car) return go("cars");
  root.innerHTML = `${pageTitle("التقارير", "ملخصات تقدر تطبعها أو تحفظها PDF.")}
    <div class="more-grid">
      ${tile("cost", "spark", "عربيتك بتكلفك كام؟", "التكلفة التشغيلية المسجّلة")}
      ${tile("monthly", "calendar", "تقرير عربيتي الشهري", "ملخص شهر كامل")}
      ${tile("history", "wrench", "سجل صيانة العربية", "مفيد عند البيع")}
      ${tile("snapshot", "share", "ملخص عربيتي", "صورة ملكية جاهزة للطباعة")}
      ${tile("health", "heart", "حالة عربيتي", "درجة المتابعة")}
    </div>`;
  root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
}

function tile(id, ic, title, sub) {
  return `<button class="more-tile" data-go="${id}" type="button">${icon(ic, 22)}<strong>${title}</strong><span class="faint">${sub}</span></button>`;
}

export async function renderCost(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  let period = "30d";
  const paint = () => {
    const range = periodRange(period, {
      from: document.getElementById("from")?.value,
      to: document.getElementById("to")?.value,
    });
    const costs = collectCosts(ctx, range.from, range.to);
    const km = trackedKm(ctx, range.from, range.to);
    const avg = averages(costs.total, range.from || new Date(Date.now() - 30 * 86400000), range.to);
    const cpk = costPerKm(costs.total, km.km);
    const cmp = comparePeriods(ctx, range.from, range.to);
    root.innerHTML = `${pageTitle("عربيتك بتكلفك كام؟", "الحسابات مبنية على المصاريف اللي سجلتها داخل السيستم.")}
      ${periodBar(period)}
      ${period === "custom" ? `<div class="form-grid two">${field({ id: "from", label: "من", type: "date" })}${field({ id: "to", label: "إلى", type: "date", value: todayIso() })}<button class="btn btn-primary" id="apply">تطبيق</button></div>` : ""}
      <section class="hero-card">
        <div class="hero-label">متوسط تكلفة عربيتك الشهرية</div>
        <div class="hero-value">${formatMoney(avg.monthly, currency())}</div>
        <div class="hero-delta">يعني حوالي ${formatMoney(avg.daily, currency())} / يوم</div>
      </section>
      <div class="kpi-grid">
        ${kpi("الإجمالي", costs.total)}
        ${kpi("البنزين", costs.fuelTotal)}
        ${kpi("الصيانة", costs.maintTotal)}
        ${kpi("الإصلاحات", costs.repairTotal)}
        ${kpi("المستندات", costs.docsTotal)}
        ${kpi("أخرى", costs.otherTotal)}
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="label">متوسط أسبوعي</div><div class="value">${formatMoney(avg.weekly, currency())}</div></div>
        <div class="kpi-card"><div class="label">تكلفة الكيلومتر</div><div class="value">${cpk != null ? formatMoney(cpk, currency()) : "مفيش مسافة كافية"}</div></div>
      </div>
      ${cmp.change != null ? `<p class="muted">مقارنة بالفترة اللي قبلها: ${cmp.change > 0 ? "+" : ""}${formatNumber(cmp.change, 1)}%</p>` : ""}
      <p class="faint">الحسابات مبنية على المصاريف اللي سجلتها داخل السيستم. الاستهلاك أو الإهلاك مش محسوبين إلا لو سجلتهم كمصروف.</p>
      <section class="chart-wrap"><div id="donut"></div></section>
      <button class="btn btn-ghost no-print" id="print">${icon("print", 18)} طباعة / PDF</button>`;
    bindPeriod(root, (id) => {
      period = id;
      paint();
    });
    root.querySelector("#apply")?.addEventListener("click", paint);
    const items = categoryBreakdown(costs);
    const el = root.querySelector("#donut");
    if (!costs.total) emptyChart(el, "سجّل مصاريف عشان يظهر التوزيع.");
    else donutChart(el, items, { currency: currency() });
    root.querySelector("#print").onclick = () => window.print();
  };
  paint();
}

export async function renderMonthly(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  const paint = () => {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const costs = collectCosts(ctx, from, to);
    const prev = collectCosts(ctx, new Date(year, month - 1, 1), new Date(year, month, 0, 23, 59, 59, 999));
    const km = trackedKm(ctx, from, to);
    const cpk = costPerKm(costs.total, km.km);
    const fuels = costs.fuelRows.length;
    const done = latestByType(ctx.maintenance.filter((m) => m.date >= iso(from) && m.date <= iso(to)));
    const upcoming = upcomingItems(ctx, 4);
    const change = prev.total ? ((costs.total - prev.total) / prev.total) * 100 : null;
    root.innerHTML = `<div class="print-header print-only"><div><strong>عربيتي</strong><div>تقرير عربيتي الشهري</div></div><div>${esc(car.name)} · ${formatKm(car.odometer)}</div></div>
      ${pageTitle("تقرير عربيتي الشهري", `${MONTHS_AR[month]} ${year}`)}
      <div class="row wrap no-print">
        <button class="btn btn-ghost" id="prev">الشهر السابق</button>
        <button class="btn btn-ghost" id="next">الشهر التالي</button>
        <button class="btn btn-primary" id="print">${icon("print", 18)} طباعة / PDF</button>
      </div>
      <section class="hero-card"><div class="hero-label">إجمالي المصاريف</div><div class="hero-value">${formatMoney(costs.total, currency())}</div>
        ${change != null ? `<div class="hero-delta">مقارنة بالشهر السابق ${formatMoney(prev.total, currency())} (${change > 0 ? "+" : ""}${formatNumber(change, 1)}%)</div>` : `<div class="hero-delta">مفيش شهر سابق للمقارنة</div>`}
      </section>
      <div class="kpi-grid four">
        ${kpi("البنزين", costs.fuelTotal)}
        ${kpi("الصيانة", costs.maintTotal)}
        ${kpi("الإصلاحات", costs.repairTotal)}
        ${kpi("أخرى", costs.otherTotal + costs.docsTotal)}
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="label">عدد التفويلات</div><div class="value">${fuels}</div></div>
        <div class="kpi-card"><div class="label">المسافة المسجلة</div><div class="value">${km.km ? formatKm(km.km) : "—"}</div></div>
        <div class="kpi-card"><div class="label">تكلفة الكيلومتر</div><div class="value">${cpk != null ? formatMoney(cpk, currency()) : "—"}</div></div>
      </div>
      <section class="card"><div class="section-title">صيانة تمت</div>${done.length ? done.map((d) => `<div>${labelOf(MAINTENANCE_TYPES, d.type)}</div>`).join("") : `<p class="muted">مفيش صيانة في الشهر ده.</p>`}</section>
      <section class="card"><div class="section-title">جاي</div>${upcoming.map((u) => `<div class="upcoming-item"><span>${esc(u.title)}</span><span class="faint">${u.remainDays != null ? u.remainDays + " يوم" : u.remainKm != null ? formatKm(u.remainKm) : ""}</span></div>`).join("") || `<p class="muted">مفيش مواعيد قريبة.</p>`}</section>
      <p class="faint">اتعمل ${formatDate(new Date())} · ${esc(car.name)}</p>`;
    root.querySelector("#prev").onclick = () => {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      paint();
    };
    root.querySelector("#next").onclick = () => {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      paint();
    };
    root.querySelector("#print").onclick = () => window.print();
  };
  paint();
}

export async function renderHistory(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  const hideNotes = getSettings().hidePrivateNotes;
  root.innerHTML = `${pageTitle("سجل صيانة العربية", "نسخة للطباعة عند البيع أو المتابعة.")}
    <label class="check-item no-print"><input type="checkbox" id="hide" ${hideNotes ? "checked" : ""}/> إخفاء الملاحظات الخاصة</label>
    <div class="form-grid two no-print">
      ${field({ id: "from", label: "من", type: "date" })}
      ${field({ id: "to", label: "إلى", type: "date", value: todayIso() })}
    </div>
    <button class="btn btn-primary no-print" id="print">${icon("print", 18)} طباعة / PDF</button>
    <div id="doc"></div>`;
  const paint = () => {
    const from = document.getElementById("from").value ? new Date(document.getElementById("from").value) : null;
    const to = document.getElementById("to").value ? new Date(document.getElementById("to").value + "T23:59:59") : new Date();
    const hide = document.getElementById("hide").checked;
    const inP = (r) => {
      const d = new Date(r.date || r.purchaseDate || r.installDate);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    const note = (n) => (!hide && n ? `<div class="faint">${esc(n)}</div>` : "");
    root.querySelector("#doc").innerHTML = `<div class="print-header"><div><strong>سجل صيانة العربية</strong><div>${esc(car.name)} · ${esc(car.year || "")} · ${formatKm(car.odometer)}</div></div><div>${formatDate(new Date())}</div></div>
      <section class="card"><h3>الصيانة</h3>${ctx.maintenance.filter(inP).map((r) => `<div class="upcoming-item"><div>${labelOf(MAINTENANCE_TYPES, r.type)} · ${formatDate(r.date)} · ${formatKm(r.odometer)}${note(r.notes)}</div><strong>${formatMoney(r.total, currency())}</strong></div>`).join("") || "<p class='muted'>—</p>"}</section>
      <section class="card"><h3>الإصلاحات</h3>${ctx.repairs.filter(inP).map((r) => `<div class="upcoming-item"><div>${esc(r.problem)} · ${formatDate(r.date)}${note(r.notes)}</div><strong>${formatMoney(r.total, currency())}</strong></div>`).join("") || "<p class='muted'>—</p>"}</section>
      <section class="card"><h3>البطارية</h3>${ctx.batteries.map((b) => `<p>${esc(b.brand)} ${esc(b.model || "")} · ${formatDate(b.purchaseDate)}</p>`).join("") || "<p class='muted'>—</p>"}</section>
      <section class="card"><h3>الكاوتش</h3>${ctx.tires.map((t) => `<p>${esc({ fl: "أمامي شمال", fr: "أمامي يمين", rl: "خلفي شمال", rr: "خلفي يمين" }[t.position] || t.position)} ${esc(t.brand)} · ${formatDate(t.installDate)}</p>`).join("") || "<p class='muted'>—</p>"}</section>
      <section class="card"><h3>المستندات</h3>${ctx.documents.map((d) => `<p>${esc(d.title || labelOf(DOCUMENT_TYPES, d.type))} حتى ${formatDate(d.endDate)}</p>`).join("") || "<p class='muted'>—</p>"}</section>`;
  };
  paint();
  root.querySelector("#from").onchange = paint;
  root.querySelector("#to").onchange = paint;
  root.querySelector("#hide").onchange = paint;
  root.querySelector("#print").onclick = () => window.print();
}

export async function renderSnapshot(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  const all = collectCosts(ctx, null, new Date());
  const months = Math.max(1, monthsBetween(car.createdAt, new Date()));
  const km = trackedKm(ctx, null, new Date());
  const cons = fullToFullConsumption(ctx.fuel);
  const upcoming = upcomingItems(ctx, 3);
  root.innerHTML = `<div class="print-header print-only"><strong>ملخص عربيتي</strong><span>${formatDate(new Date())}</span></div>
    ${pageTitle("ملخص عربيتي")}
    <section class="hero-card">
      <div class="hero-label">${esc(car.make)} ${esc(car.model)}</div>
      <div class="hero-value">${esc(car.name)}</div>
      <div class="hero-delta">${esc(car.year || "")} · ${formatKm(car.odometer)}</div>
    </section>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="label">شهور المتابعة</div><div class="value">${months}</div></div>
      <div class="kpi-card"><div class="label">كيلومتر متسجل</div><div class="value">${km.km ? formatKm(km.km) : "—"}</div></div>
      <div class="kpi-card"><div class="label">إجمالي المصاريف</div><div class="value">${formatMoney(all.total, currency())}</div></div>
      <div class="kpi-card"><div class="label">متوسط شهري</div><div class="value">${formatMoney(all.total / months, currency())}</div></div>
      <div class="kpi-card"><div class="label">متوسط استهلاك</div><div class="value">${cons.avgKmL ? formatNumber(cons.avgKmL, 2) + " كم/لتر" : "—"}</div></div>
      <div class="kpi-card"><div class="label">سجلات الصيانة</div><div class="value">${ctx.maintenance.length}</div></div>
    </div>
    <section class="card"><div class="section-title">صيانة جاية</div>${upcoming.map((u) => `<div>${esc(u.title)}</div>`).join("") || "<p class='muted'>—</p>"}</section>
    <button class="btn btn-primary no-print" id="print">${icon("print", 18)} طباعة / حفظ PDF</button>`;
  root.querySelector("#print").onclick = () => window.print();
  void formatMonthYear;
  void monthlySeries;
  void monthCompare;
  void barChart;
}

function periodBar(active) {
  const items = [
    ["30d", "آخر 30 يوم"],
    ["3m", "آخر 3 شهور"],
    ["6m", "آخر 6 شهور"],
    ["ytd", "السنة الحالية"],
    ["all", "من بداية التسجيل"],
    ["custom", "فترة مخصصة"],
  ];
  return `<div class="wrap">${items.map(([id, l]) => `<button class="chip ${id === active ? "is-active" : ""}" data-p="${id}">${l}</button>`).join("")}</div>`;
}
function bindPeriod(root, fn) {
  root.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => fn(b.dataset.p)));
}
function kpi(l, v) {
  return `<div class="kpi-card"><div class="label">${l}</div><div class="value">${formatMoney(v, currency())}</div></div>`;
}
function iso(d) {
  return d.toISOString().slice(0, 10);
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
