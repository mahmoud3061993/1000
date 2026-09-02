import { decidePurchase, formatArabicDate } from "../calc.js";
import { getState } from "../store.js";
import { go } from "../router.js";
import { formatMoney, html, qs } from "../utils.js";

function verdict(result) {
  if (result.tone === "red") {
    return html`<article class="verdict red">
      <strong>🔴 الشراء دلوقتي هيخليك تتخطى ميزانيتك المتوقعة بـ ${formatMoney(result.overBy)}.</strong>
      <p>المتاح الحقيقي ${formatMoney(result.before.trueAvailable)}، والحاجة دي ${formatMoney(result.cost)}.</p>
    </article>`;
  }
  if (result.tone === "yellow") {
    return html`<article class="verdict yellow">
      <strong>🟡 تقدر تشتريها، لكن مصروفك اليومي لباقي الشهر هينزل من ${formatMoney(result.before.dailyAllowed)} إلى ${formatMoney(result.afterDaily)}.</strong>
      <p>هيفضل لك ${formatMoney(result.afterAvailable)} لباقي الشهر.</p>
    </article>`;
  }
  if (result.tone === "green") {
    return html`<article class="verdict green">
      <strong>🟢 ينفع. الحد اليومي هيبقى ${formatMoney(result.afterDaily)} بدل ${formatMoney(result.before.dailyAllowed)}.</strong>
      <p>لسه فاضل ${formatMoney(result.afterAvailable)} للمصروف الحر.</p>
    </article>`;
  }
  return html`<article class="verdict"><p>حط المبلغ اللي ناوي تشتريه.</p></article>`;
}

export function renderDecide(params = {}) {
  const amount = Number(params.amount || 0);
  const { setup, expenses } = getState();
  const result = decidePurchase(setup, expenses, amount);
  return html`<section class="page decide-page">
    <header class="page-head">
      <h1>ينفع أشتريها؟</h1>
      <p>قبل ما تدفع، السيستم يحسب دخلك والتزاماتك والأيام المتبقية.</p>
    </header>
    <form id="decide-form" class="add-form">
      <label class="amount-label">المبلغ
        <input name="amount" type="number" min="1" step="1" inputmode="numeric" value="${amount || ""}" placeholder="1500" required />
      </label>
      <button class="btn" type="submit">احسب القرار</button>
    </form>
    <div id="verdict">${{ __html: verdict(result) }}</div>
    ${result.tone === "green" || result.tone === "yellow"
      ? html`<button class="btn secondary" type="button" id="log-it">تمام، سجّلها كمصروف</button>`
      : ""}
    <p class="muted">لو كملت بنفس معدل الصرف، فلوسك${result.before
      ? ""
      : ""} ${result.tone === "red" ? "هتتزنق بدري." : `هتتراجع يوم ${formatArabicDate(result.before?.period?.end)} لو السرعة زادت.`}</p>
  </section>`;
}

export function bindDecide() {
  qs("#decide-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Number(new FormData(e.currentTarget).get("amount"));
    go("decide", { amount: String(amount || "") });
  });
  qs("#log-it")?.addEventListener("click", () => {
    const amount = Number(qs("#decide-form [name=amount]")?.value);
    go("add", { amount: String(amount || ""), category: "impulse" });
  });
}
