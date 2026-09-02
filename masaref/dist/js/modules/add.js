import { CATEGORIES, categoryById } from "../constants.js";
import { isoDate, snapshot, todaySpent } from "../calc.js";
import { addExpense, getState } from "../store.js";
import { go } from "../router.js";
import { toast } from "../ui.js";
import { formatMoney, html, qs } from "../utils.js";

export function renderAdd(params = {}) {
  const { setup, expenses } = getState();
  const snap = snapshot(setup, expenses);
  const spentToday = todaySpent(expenses);
  const leftToday = Math.max(0, snap.dailyAllowed - spentToday);
  const preset = params.category || "food";
  const amount = params.amount ? String(params.amount) : "";
  const cats = CATEGORIES.filter((c) => !c.fixed);
  const fixed = CATEGORIES.filter((c) => c.fixed);
  return html`<section class="page add-page">
    <header class="page-head">
      <h1>سجّل المصروف بسرعة</h1>
      <p>المتبقي النهارده ${formatMoney(leftToday)} من حد ${formatMoney(snap.dailyAllowed)}</p>
    </header>
    <form id="add-form" class="add-form">
      <label class="amount-label">كام؟
        <input name="amount" type="number" min="1" step="1" inputmode="numeric" required placeholder="50" value="${amount}" autofocus />
      </label>
      <p class="cat-label">في إيه؟</p>
      <div class="cat-grid" role="listbox">
        ${{ __html: cats
          .map(
            (c) =>
              `<label class="cat-chip ${c.id === preset ? "is-on" : ""}">
                <input type="radio" name="categoryId" value="${c.id}" ${c.id === preset ? "checked" : ""} />
                <span>${c.emoji} ${c.name}</span>
              </label>`
          )
          .join("") }}
      </div>
      <details class="fixed-more">
        <summary>ده التزام؟ (إيجار / فاتورة / دين / توفير)</summary>
        <div class="cat-grid">
          ${{ __html: fixed
            .map(
              (c) =>
                `<label class="cat-chip">
                  <input type="radio" name="categoryId" value="${c.id}" />
                  <span>${c.emoji} ${c.name}</span>
                </label>`
            )
            .join("") }}
        </div>
      </details>
      <label>ملاحظة (اختياري)
        <input name="note" maxlength="80" placeholder="مثال: عشا، أوبر، هدية" />
      </label>
      <label>التاريخ
        <input name="date" type="date" value="${isoDate(new Date())}" />
      </label>
      <button class="btn" type="submit">سجّل</button>
    </form>
  </section>`;
}

export function bindAdd() {
  const form = qs("#add-form");
  form?.querySelectorAll(".cat-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      form.querySelectorAll(".cat-chip").forEach((c) => c.classList.remove("is-on"));
      chip.classList.add("is-on");
    });
  });
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      toast("حط مبلغ صحيح");
      return;
    }
    const rec = addExpense(data);
    const cat = categoryById(rec.categoryId);
    toast(`اتسجل ${formatMoney(rec.amount)} على ${cat.name}`);
    go("dashboard");
  });
}
