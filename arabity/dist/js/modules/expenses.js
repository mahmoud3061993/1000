import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../constants.js";
import { db } from "../db.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { chips, confirmDialog, field, modal, pageTitle, setError, toast } from "../ui.js";
import { formatDate, formatMoney, nowIso, parseNum, sortByDateDesc, todayIso, uid } from "../utils.js";
import { expenseLabel } from "../calculations.js";
import { icon } from "../icons.js";

export async function renderExpenses(root, params = {}) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  if (params.add === "1" || params.edit) return form(root, params.edit ? ctx.expenses.find((x) => x.id === params.edit) : null);
  const custom = ctx.customCategories || [];
  const cats = [{ id: "all", label: "الكل" }, ...EXPENSE_CATEGORIES, ...custom.map((c) => ({ id: c.id, label: c.name }))];
  let filter = "all";
  let q = "";
  const listAll = sortByDateDesc(ctx.expenses);
  root.innerHTML = `${pageTitle("المصاريف", "غسيل، ركن، رسوم… من غير البنزين والصيانة.")}
    <button class="btn btn-primary" id="add">${icon("plus", 18)} سجل مصروف</button>
    <div class="search-box">${icon("search", 18)}<input id="q" placeholder="بحث" /></div>
    <div id="chips">${chips(cats, filter)}</div>
    <div class="stack" id="list"></div>`;
  root.querySelector("#add").onclick = () => go("expenses", { add: "1" });
  const paint = () => {
    const list = listAll.filter((r) => (filter === "all" || r.category === filter) && (!q || JSON.stringify(r).includes(q)));
    const box = root.querySelector("#list");
    if (!listAll.length) {
      box.innerHTML = `<div class="empty-state"><h3>لسه مفيش مصاريف عامة.</h3><p class="muted">البنزين والصيانة ليهم صفحات لوحدهم. هنا الغسيل والركن والرسوم.</p><button class="btn btn-primary" id="first">سجل أول مصروف</button></div>`;
      box.querySelector("#first").onclick = () => go("expenses", { add: "1" });
      return;
    }
    if (!list.length) {
      box.innerHTML = `<p class="muted">مفيش نتائج للفلتر الحالي. <button class="btn btn-ghost btn-sm" id="clear">مسح الفلاتر</button></p>`;
      box.querySelector("#clear").onclick = () => {
        filter = "all";
        q = "";
        document.getElementById("q").value = "";
        paint();
        bindChips();
      };
      return;
    }
    box.innerHTML = list
      .slice(0, 50)
      .map(
        (r) => `<button class="list-card" data-id="${r.id}" type="button">
        <div><div class="list-title">${esc(expenseLabel(r, custom))} ${r.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
        <div class="faint">${formatDate(r.date)}</div></div><strong>${formatMoney(r.amount, currency())}</strong></button>`
      )
      .join("");
    box.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => go("expenses", { edit: b.dataset.id })));
  };
  const bindChips = () => {
    root.querySelector("#chips").innerHTML = chips(cats, filter);
    root.querySelectorAll("[data-chip]").forEach((c) => {
      c.onclick = () => {
        filter = c.dataset.chip;
        bindChips();
        paint();
      };
    });
  };
  bindChips();
  paint();
  document.getElementById("q").oninput = (e) => {
    q = e.target.value.trim();
    paint();
  };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function form(root, rec) {
  const { car, ctx } = appState();
  const custom = ctx.customCategories || [];
  const cats = [...EXPENSE_CATEGORIES, ...custom.map((c) => ({ id: c.id, label: c.name })), { id: "__new", label: "+ فئة مخصصة" }];
  root.innerHTML = `${pageTitle(rec ? "تعديل مصروف" : "تسجيل مصروف")}
    <form class="form-grid two" id="f">
      ${field({ id: "date", label: "التاريخ", type: "date", value: rec?.date || todayIso(), required: true })}
      ${field({ id: "category", label: "الفئة", options: cats, value: rec?.category || "wash" })}
      ${field({ id: "amount", label: "المبلغ", type: "number", inputMode: "decimal", unit: currency(), required: true, value: rec?.amount || "" })}
      ${field({ id: "payment", label: "طريقة الدفع", options: PAYMENT_METHODS, value: rec?.payment || "cash" })}
      ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  document.getElementById("category").addEventListener("change", () => {
    if (document.getElementById("category").value !== "__new") return;
    const wrap = document.createElement("div");
    wrap.innerHTML = field({ id: "newcat", label: "اسم الفئة الجديدة", value: "" });
    modal({
      title: "فئة مخصصة",
      body: wrap,
      actions: [
        {
          label: "إضافة",
          primary: true,
          onClick: async () => {
            const name = document.getElementById("newcat").value.trim();
            if (!name) return false;
            const cat = { id: uid("cat"), name, createdAt: nowIso(), updatedAt: nowIso() };
            await db.put("customCategories", cat);
            document.getElementById("category").insertAdjacentHTML("beforeend", `<option value="${cat.id}" selected>${esc(cat.name)}</option>`);
            toast("تم الحفظ بنجاح");
          },
        },
        {
          label: "إلغاء",
          onClick: () => {
            document.getElementById("category").value = rec?.category || "wash";
          },
        },
      ],
    });
  });
  root.querySelector("#cancel").onclick = () => go("expenses");
  root.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف المصروف؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("expenses", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("expenses");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const amount = parseNum(document.getElementById("amount").value);
    if (amount == null || amount <= 0) return setError("amount", "المبلغ لازم يكون أكبر من صفر.");
    const t = nowIso();
    const row = {
      ...(rec || { id: uid("exp"), createdAt: t, isDemo: false }),
      carId: car.id,
      date: document.getElementById("date").value,
      category: document.getElementById("category").value,
      amount,
      payment: document.getElementById("payment").value,
      notes: document.getElementById("notes").value.trim(),
      updatedAt: t,
    };
    await db.put("expenses", row);
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("expenses");
  };
}
