import { db } from "../db.js";
import { kmReminders } from "../notifications.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { confirmDialog, field, pageTitle, toast } from "../ui.js";
import { formatDate, formatKm, nowIso, parseNum, todayIso, uid } from "../utils.js";
import { icon } from "../icons.js";

export async function renderReminders(root, params = {}) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  if (params.add === "1" || params.edit) return form(root, params.edit ? ctx.reminders.find((r) => r.id === params.edit) : null);
  const dueKm = kmReminders(ctx);
  const list = ctx.reminders.filter((r) => !r.done);
  root.innerHTML = `${pageTitle("التذكيرات", "مواعيد على الجهاز. تذكير الكيلومتر بيظهر هنا حسب العداد، مش كإشعار تقويم وهمي.")}
    ${dueKm.length ? `<section class="insight-card">${dueKm.map((r) => `<p>وصل العداد لميعاد: ${esc(r.title)}</p>`).join("")}</section>` : ""}
    <button class="btn btn-primary" id="add">${icon("plus", 18)} تذكير جديد</button>
    <div class="stack" id="list"></div>`;
  root.querySelector("#add").onclick = () => go("reminders", { add: "1" });
  const box = root.querySelector("#list");
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><h3>مفيش تذكيرات.</h3><p class="muted">ضيف تذكير لتجديد أو صيانة بتاريخ، أو عند كيلومتر معيّن.</p></div>`;
    return;
  }
  box.innerHTML = list
    .map(
      (r) => `<article class="list-card">
      <div><div class="list-title">${esc(r.title)}</div>
      <div class="faint">${r.kind === "km" ? "عند " + formatKm(r.odometer) : formatDate(r.date)}</div></div>
      <div class="stack">
        <button class="btn btn-ghost btn-sm" data-ed="${r.id}">تعديل</button>
        <button class="btn btn-ghost btn-sm" data-done="${r.id}">تم</button>
      </div></article>`
    )
    .join("");
  box.querySelectorAll("[data-ed]").forEach((b) => (b.onclick = () => go("reminders", { edit: b.dataset.ed })));
  box.querySelectorAll("[data-done]").forEach((b) => {
    b.onclick = async () => {
      const r = ctx.reminders.find((x) => x.id === b.dataset.done);
      r.done = true;
      r.updatedAt = nowIso();
      await db.put("reminders", r);
      toast("تم تحديث البيانات");
      await refresh(true);
    };
  });
}

async function form(root, rec) {
  const { car } = appState();
  root.innerHTML = `${pageTitle(rec ? "تعديل تذكير" : "تذكير جديد")}
    <form class="form-grid two" id="f">
      ${field({ id: "title", label: "العنوان", value: rec?.title || "", required: true })}
      ${field({ id: "kind", label: "النوع", options: [
        { id: "date", label: "تاريخ" },
        { id: "km", label: "عند كيلومتر معيّن" },
      ], value: rec?.kind || "date" })}
      ${field({ id: "date", label: "التاريخ", type: "date", value: rec?.date || todayIso(), optional: true })}
      ${field({ id: "odometer", label: "العداد المستهدف", type: "number", inputMode: "numeric", unit: "كم", value: rec?.odometer || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  root.querySelector("#cancel").onclick = () => go("reminders");
  root.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف التذكير؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("reminders", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("reminders");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const t = nowIso();
    await db.put("reminders", {
      ...(rec || { id: uid("rem"), createdAt: t, isDemo: false, done: false }),
      carId: car.id,
      title: document.getElementById("title").value.trim(),
      kind: document.getElementById("kind").value,
      date: document.getElementById("date").value,
      odometer: parseNum(document.getElementById("odometer").value),
      updatedAt: t,
    });
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("reminders");
  };
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
