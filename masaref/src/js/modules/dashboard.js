import { CATEGORIES, categoryById } from "../constants.js";
import {
  allCategoryAlerts,
  formatArabicDate,
  noSpendStreak,
  periodCompare,
  runway,
  todaySpent,
  topSpenders,
  weeklyCompare,
} from "../calc.js";
import { getState } from "../store.js";
import { go } from "../router.js";
import { formatMoney, html, qs } from "../utils.js";

function toneClass(status) {
  if (status === "critical") return "danger";
  if (status === "warn") return "warn";
  return "ok";
}

export function renderDashboard() {
  const { setup, expenses } = getState();
  const now = new Date();
  const run = runway(setup, expenses, now);
  const tops = topSpenders(expenses, run.period, CATEGORIES, 3);
  const alerts = allCategoryAlerts(setup, expenses, CATEGORIES, now);
  const week = weeklyCompare(expenses, now);
  const vs = periodCompare(setup, expenses, now);
  const streak = noSpendStreak(expenses, now);
  const spentToday = todaySpent(expenses, now);
  const leftToday = Math.max(0, run.dailyAllowed - spentToday);

  const runoutLine = run.lastsTheMonth
    ? "بالمعدل الحالي فلوسك هتكفي الشهر."
    : `لو كملت بنفس معدل صرفك الحالي، فلوسك هتخلص يوم ${formatArabicDate(run.runoutDate)}.`;

  return html`<section class="page dash">
    <header class="dash-top">
      <div>
        <small>مصارف</small>
        <h1>مسموحلك تصرف النهارده</h1>
      </div>
      <button class="ghost" type="button" data-go="add">تسجيل سريع</button>
    </header>

    <article class="hero-allow ${leftToday <= 0 && spentToday > 0 ? "is-hot" : ""}">
      <small>الحد اليومي</small>
      <div class="hero-num">${formatMoney(run.dailyAllowed)}</div>
      <p>اتصرف النهارده ${formatMoney(spentToday)} · المتبقي النهاردة ${formatMoney(leftToday)}</p>
    </article>

    <article class="runway ${toneClass(run.status)}">
      <strong>🔥 فلوسي هتخلص إمتى؟</strong>
      <p>${runoutLine}</p>
    </article>

    ${alerts.length
      ? html`<div class="alert-stack">${{ __html: alerts
          .map((a) => {
            const msg =
              a.tone === "danger"
                ? `ميزانية ${a.name} اتعدّت بـ ${formatMoney(a.overBy)}.`
                : `مصروف ${a.name} أعلى من الطبيعي. بالمعدل الحالي هتتخطى الميزانية بحوالي ${formatMoney(a.overBy)}.`;
            return `<article class="alert ${a.tone}">⚠️ ${msg}</article>`;
          })
          .join("") }}</div>`
      : ""}

    <section class="panel">
      <h2>صورة الشهر</h2>
      <div class="stat-grid">
        <div><small>مرتب الشهر</small><b>${formatMoney(run.income)}</b></div>
        <div><small>اتصرف</small><b>${formatMoney(run.totalSpent)}</b></div>
        <div><small>متبقي</small><b>${formatMoney(run.remainingCash)}</b></div>
        <div><small>لازم يتشال للالتزامات</small><b>${formatMoney(run.mustReserve)}</b></div>
      </div>
      <div class="true-box">
        <small>المتاح الحقيقي للصرف</small>
        <strong>${formatMoney(run.trueAvailable)}</strong>
      </div>
    </section>

    <section class="panel">
      <h2>أكتر 3 حاجات بتاكل فلوسك</h2>
      ${tops.length
        ? html`<ul class="eaters">${{ __html: tops
            .map((t) => {
              const cat = categoryById(t.id);
              return `<li><span>${cat.emoji} ${t.name}</span><b>${formatMoney(t.total)}</b></li>`;
            })
            .join("") }}</ul>`
        : html`<p class="muted">لسه مفيش مصروف مسجّل. أول ما تسجّل، هبان مين بياكل فلوسك.</p>`}
    </section>

    <section class="panel play-row">
      <div>
        <small>No-Spend Days</small>
        <b>${streak.todayIsNoSpend ? "🟢 النهارده مفيش مصروفات غير أساسية" : "فيه صرف النهارده"}</b>
        <em>Streak: ${streak.streak} ${streak.streak === 1 ? "يوم" : "أيام"} 🔥</em>
      </div>
      <button class="ghost" type="button" data-go="play">التفاصيل</button>
    </section>

    <section class="panel">
      <h2>الأسبوع ده مقابل اللي فات</h2>
      <div class="week-cmp">
        <div><small>الأسبوع اللي فات</small><b>${formatMoney(week.previous)}</b></div>
        <div><small>الأسبوع ده</small><b>${formatMoney(week.current)}</b></div>
      </div>
      <p class="${week.saved >= 0 ? "gain" : "loss"}">
        ${week.saved >= 0
          ? `وفّرت ${formatMoney(week.saved)} 👏`
          : `زادت المصاريف ${formatMoney(-week.saved)} عن الأسبوع اللي فات`}
      </p>
      ${vs.previousSpent > 0
        ? html`<p class="muted">${vs.pct >= 0
            ? `مصروفاتك أقل ${vs.pct}% من نفس الفترة الشهر اللي فات.`
            : `مصروفاتك أعلى ${Math.abs(vs.pct)}% من نفس الفترة الشهر اللي فات.`}</p>`
        : ""}
    </section>
  </section>`;
}

export function bindDashboard() {
  qs("#app-main")?.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => go(btn.dataset.go));
  });
}
