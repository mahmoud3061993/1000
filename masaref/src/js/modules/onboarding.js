import { setupTotals } from "../calc.js";
import { EMPTY_SETUP } from "../constants.js";
import { saveSetup, seedDemo } from "../store.js";
import { go } from "../router.js";
import { toast } from "../ui.js";
import { formatMoney, html, qs } from "../utils.js";

export function renderOnboarding() {
  const t = setupTotals({
    income: 15000,
    rent: 4000,
    bills: 1500,
    debts: 1000,
    savingsGoal: 2000,
  });
  return html`<section class="page setup-page">
    <div class="setup-kicker">إعداد مرة واحدة</div>
    <h1>مرتبك بيخلص ومش عارف راح فين؟</h1>
    <p class="lead">
      حط الدخل والالتزامات. السيستم هيحسب المبلغ الآمن للصرف، وهيقولك مسموحلك تصرف كام النهارده.
    </p>
    <form class="setup-form" id="setup-form">
      <label>الدخل الشهري
        <input name="income" type="number" min="0" step="1" inputmode="numeric" placeholder="15000" required />
      </label>
      <label>الإيجار / القسط
        <input name="rent" type="number" min="0" step="1" inputmode="numeric" placeholder="4000" />
      </label>
      <label>فواتير
        <input name="bills" type="number" min="0" step="1" inputmode="numeric" placeholder="1500" />
      </label>
      <label>ديون
        <input name="debts" type="number" min="0" step="1" inputmode="numeric" placeholder="1000" />
      </label>
      <label>هدف التوفير
        <input name="savingsGoal" type="number" min="0" step="1" inputmode="numeric" placeholder="2000" />
      </label>
      <label>يوم الراتب
        <input name="payday" type="number" min="1" max="28" step="1" value="1" />
      </label>
      <div class="live-box" id="live-box">
        <small>المتاح للصرف بعد الالتزامات</small>
        <b>—</b>
        <em>بعد الحفظ هيظهر الحد اليومي</em>
      </div>
      <button class="btn" type="submit">ابدأ السيطرة على المصروف</button>
    </form>
    <button class="text-btn" type="button" id="demo-btn">شوف مثال: مرتب ${formatMoney(t.income)} والمتاح ${formatMoney(t.available)}</button>
  </section>`;
}

export function bindOnboarding() {
  const form = qs("#setup-form");
  const live = qs("#live-box");
  function refresh() {
    if (!form || !live) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const tot = setupTotals(data);
    live.querySelector("b").textContent = formatMoney(tot.available);
    const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    live.querySelector("em").textContent =
      tot.available > 0 ? `يعني تقريبًا ${Math.floor(tot.available / days)} جنيه في اليوم` : "الدخل لازم يكون أكبر من الالتزامات";
  }
  form?.querySelectorAll("input").forEach((el) => el.addEventListener("input", refresh));
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!Number(data.income)) {
      toast("حط الدخل الشهري الأول");
      return;
    }
    saveSetup({ ...EMPTY_SETUP, ...data });
    toast("اتحسب المبلغ الآمن. يلا نسيطر على الشهر.");
    go("dashboard");
  });
  qs("#demo-btn")?.addEventListener("click", () => {
    seedDemo();
    toast("ده مثال توضيحي. تقدر تمسحه من الإعدادات.");
    go("dashboard");
  });
}
