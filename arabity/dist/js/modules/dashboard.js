import { appState, openQuickAdd } from "../session.js";
import {
  categoryBreakdown,
  monthCompare,
  monthlySeries,
  recentActivity,
  trackedKm,
  upcomingItems,
} from "../calculations.js";
import { barChart, emptyChart } from "../charts.js";
import { buildInsights } from "../insights.js";
import { careScore } from "../scoring.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { badgeFor, pageTitle } from "../ui.js";
import { formatKm, formatMoney, formatNumber, formatDate } from "../utils.js";
import { icon } from "../icons.js";

export async function renderDashboard(root) {
  const { ctx, car } = appState();
  if (!car) {
    root.innerHTML = `<div class="empty-state"><h3>ضيف عربيتك الأول</h3><button class="btn btn-primary" id="g">إضافة عربية</button></div>`;
    root.querySelector("#g").onclick = () => go("cars", { add: "1" });
    return;
  }
  const sym = currency();
  const cmp = monthCompare(ctx);
  const series = monthlySeries(ctx, 6);
  const insights = buildInsights(ctx, sym);
  const upcoming = upcomingItems(ctx);
  const recent = recentActivity(ctx, 6);
  const score = careScore(ctx);
  const km = trackedKm(ctx, cmp.cur.from, cmp.cur.to);
  const avgMonthly = series.length ? series.reduce((a, s) => a + s.total, 0) / series.filter((s) => s.total).length || 0 : 0;
  const cpk = km.km ? cmp.current.total / km.km : null;
  const delta = cmp.change;
  const deltaHtml =
    delta == null
      ? `<span class="hero-delta">أول شهر متسجل لسه — مفيش مقارنة بالشهر اللي فات.</span>`
      : `<span class="hero-delta ${delta > 0 ? "up" : "down"}">${delta > 0 ? "أعلى" : "أقل"} بـ ${formatNumber(Math.abs(delta), 1)}% من الشهر اللي فات ${delta > 0 ? "↑" : "↓"}</span>`;

  root.innerHTML = `${pageTitle("الرئيسية", "اعرف عربيتك بتكلفك كام فعلًا.")}
    <section class="hero-card">
      <div class="hero-label">عربيتك كلفتك الشهر ده</div>
      <div class="hero-value">${formatMoney(cmp.current.total, sym)}</div>
      ${deltaHtml}
    </section>
    <div class="kpi-grid">
      ${kpi("البنزين", cmp.current.fuelTotal, sym)}
      ${kpi("الصيانة", cmp.current.maintTotal, sym)}
      ${kpi("الإصلاحات", cmp.current.repairTotal, sym)}
      ${kpi("مصاريف أخرى", cmp.current.otherTotal + cmp.current.docsTotal, sym)}
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="label">متوسط شهري (آخر الشهور المسجلة)</div><div class="value">${formatMoney(avgMonthly || 0, sym)}</div></div>
      <div class="kpi-card"><div class="label">تكلفة الكيلومتر</div><div class="value">${cpk != null ? formatMoney(cpk, sym) : "محتاجين مسافة مسجّلة"}</div></div>
    </div>
    <section class="insight-card">
      <div class="faint">ملاحظة من بياناتك</div>
      <p>${esc(insights[0]?.text || "سجّل أول تفويلة أو مصروف، وهنا هتظهر ملاحظات مفيدة من أرقامك.")}</p>
      ${insights[0]?.action ? `<p class="muted">${esc(insights[0].action)}</p>` : ""}
    </section>
    <section class="card">
      <div class="section-title">قرب ميعادها</div>
      ${
        upcoming.length
          ? upcoming
              .map(
                (u) => `<div class="upcoming-item">
            <div><div class="list-title">${esc(u.title)}</div>
            <div class="faint">${u.remainKm != null ? "فاضل " + formatKm(Math.max(0, u.remainKm)) : u.remainDays != null ? (u.remainDays < 0 ? "متأخر " + Math.abs(u.remainDays) + " يوم" : "فاضل " + u.remainDays + " يوم") : ""}</div></div>
            ${badgeFor(u.status)}
          </div>`
              )
              .join("")
          : `<p class="muted">مفيش مواعيد قريبة. لما تضيف صيانة أو رخصة هتظهر هنا.</p>`
      }
    </section>
    <section class="chart-wrap">
      <div class="section-title">مصاريف آخر 6 شهور</div>
      <div id="month-chart"></div>
    </section>
    <section class="card">
      <div class="section-title">آخر حاجة سجلتها <button class="btn btn-ghost btn-sm no-print" id="all-tl">السجل</button></div>
      <div class="stack" id="recent"></div>
    </section>
    <section class="card-soft">
      <div class="row" style="justify-content:space-between">
        <div>
          <div class="faint">حالة متابعة العربية</div>
          <strong>${score.total} / 100 — ${esc(score.headline)}</strong>
        </div>
        <button class="btn btn-ghost btn-sm" id="health">التفاصيل</button>
      </div>
    </section>
    <button class="fab no-print" type="button" id="fab">${icon("plus", 18)} تسجيل جديد</button>`;

  const chartEl = root.querySelector("#month-chart");
  if (series.every((s) => !s.total)) emptyChart(chartEl, "لسه مفيش مصاريف كافية نرسم بيها الشهور.");
  else barChart(chartEl, series, { currency: sym });

  const recBox = root.querySelector("#recent");
  if (!recent.length) recBox.innerHTML = `<p class="muted">لسه مفيش نشاط. ابدأ بتسجيل تفويلة أو مصروف.</p>`;
  else
    recBox.innerHTML = recent
      .map(
        (r) => `<div class="upcoming-item"><div><div class="list-title">${esc(r.title)}</div><div class="faint">${formatDate(r.date)}</div></div><strong>${formatMoney(r.amount || 0, sym)}</strong></div>`
      )
      .join("");

  root.querySelector("#fab").onclick = openQuickAdd;
  root.querySelector("#health").onclick = () => go("health");
  root.querySelector("#all-tl").onclick = () => go("timeline");
  void categoryBreakdown;
}

function kpi(label, value, sym) {
  return `<div class="kpi-card"><div class="label">${label}</div><div class="value">${formatMoney(value, sym)}</div></div>`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
