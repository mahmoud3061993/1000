import { noSpendStreak, weeklyCompare } from "../calc.js";
import { getState, markNoSpend } from "../store.js";
import { toast } from "../ui.js";
import { formatMoney, html, qs } from "../utils.js";

export function renderPlay() {
  const { expenses } = getState();
  const streak = noSpendStreak(expenses);
  const week = weeklyCompare(expenses);
  return html`<section class="page">
    <header class="page-head">
      <h1>أيام من غير إسراف</h1>
      <p>المكسب مش في تسجيل الأرقام. المكسب إنك تمسك نفسك.</p>
    </header>
    <article class="hero-allow">
      <small>Streak</small>
      <div class="hero-num">${streak.streak} 🔥</div>
      <p>${streak.todayIsNoSpend ? "🟢 النهارده مفيش مصروفات غير أساسية" : "فيه صرف حر النهارده — السلسلة بتتحسب من الأيام الفاضية."}</p>
    </article>
    <section class="panel">
      <h2>الأسبوع</h2>
      <div class="week-cmp">
        <div><small>الأسبوع اللي فات</small><b>${formatMoney(week.previous)}</b></div>
        <div><small>الأسبوع ده</small><b>${formatMoney(week.current)}</b></div>
      </div>
      <p class="${week.saved >= 0 ? "gain" : "loss"}">
        ${week.saved >= 0 ? `وفّرت ${formatMoney(week.saved)} 👏` : `زودت ${formatMoney(-week.saved)} عن الأسبوع اللي فات`}
      </p>
    </section>
    <button class="btn" type="button" id="mark-nospend">علّم النهارده No-Spend</button>
  </section>`;
}

export function bindPlay() {
  qs("#mark-nospend")?.addEventListener("click", () => {
    markNoSpend();
    toast("اتعلم. لو مفيش صرف حر، الستريك هيفضل يكبر لوحده.");
  });
}
