import { categoryById } from "../constants.js";
import { snapshot } from "../calc.js";
import { deleteExpense, getState } from "../store.js";
import { go } from "../router.js";
import { toast } from "../ui.js";
import { formatMoney, html, qs } from "../utils.js";

export function renderExpenses() {
  const { setup, expenses } = getState();
  const snap = snapshot(setup, expenses);
  const list = [...snap.all].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  return html`<section class="page">
    <header class="page-head">
      <h1>فلوسي راحت فين؟</h1>
      <p>اتصرف ${formatMoney(snap.totalSpent)} من ${formatMoney(snap.income)} · المتاح الحقيقي ${formatMoney(snap.trueAvailable)}</p>
    </header>
    ${list.length === 0
      ? html`<div class="empty">لسه مفيش حركة. دوس تسجيل وحط أول مصروف في ثواني.</div>`
      : html`<ul class="exp-list">${{ __html: list
          .map((item) => {
            const cat = categoryById(item.categoryId);
            return `<li data-id="${item.id}">
              <div>
                <b>${cat.emoji} ${cat.name}</b>
                <small>${item.date}${item.note ? ` · ${item.note}` : ""}</small>
              </div>
              <div class="exp-side">
                <strong>${formatMoney(item.amount)}</strong>
                <button type="button" class="text-btn" data-del="${item.id}">مسح</button>
              </div>
            </li>`;
          })
          .join("") }}</ul>`}
    <button class="btn" type="button" data-go="add">سجّل مصروف</button>
  </section>`;
}

export function bindExpenses() {
  qs("#app-main")?.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteExpense(btn.dataset.del);
      toast("اتمسح المصروف");
      go("expenses");
    });
  });
  qs("[data-go='add']")?.addEventListener("click", () => go("add"));
}
