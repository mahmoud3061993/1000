import { bumpOdometer, db } from "../db.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { confirmDialog, field, pageTitle, setError, toast } from "../ui.js";
import { formatDate, formatKm, formatMoney, monthRange, nowIso, parseNum, sortByDateDesc, todayIso, uid } from "../utils.js";
import { icon } from "../icons.js";

export async function renderRepairs(root, params = {}) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  if (params.add === "1" || params.edit) return form(root, params.edit ? ctx.repairs.find((x) => x.id === params.edit) : null);
  const list = sortByDateDesc(ctx.repairs);
  const m = monthRange(0);
  const yFrom = new Date(new Date().getFullYear(), 0, 1);
  const month = list.filter((r) => r.date >= iso(m.from) && r.date <= iso(m.to)).reduce((a, r) => a + Number(r.total || 0), 0);
  const year = list.filter((r) => new Date(r.date) >= yFrom).reduce((a, r) => a + Number(r.total || 0), 0);
  const all = list.reduce((a, r) => a + Number(r.total || 0), 0);
  root.innerHTML = `${pageTitle("الإصلاحات", "الإصلاح غير الصيانة الدورية.")}
    <div class="kpi-grid">
      <div class="kpi-card"><div class="label">هذا الشهر</div><div class="value">${formatMoney(month, currency())}</div></div>
      <div class="kpi-card"><div class="label">هذه السنة</div><div class="value">${formatMoney(year, currency())}</div></div>
      <div class="kpi-card"><div class="label">الإجمالي المسجل</div><div class="value">${formatMoney(all, currency())}</div></div>
    </div>
    <button class="btn btn-primary" id="add">${icon("plus", 18)} سجل إصلاح</button>
    <div class="stack" id="list"></div>`;
  root.querySelector("#add").onclick = () => go("repairs", { add: "1" });
  const box = root.querySelector("#list");
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><h3>مفيش إصلاحات مسجلة.</h3><p class="muted">لو حصل عطل أو تصليح، سجّله هنا منفصل عن الصيانة الدورية.</p><button class="btn btn-primary" id="first">سجل أول إصلاح</button></div>`;
    box.querySelector("#first").onclick = () => go("repairs", { add: "1" });
    return;
  }
  box.innerHTML = list
    .slice(0, 40)
    .map(
      (r) => `<button class="list-card" data-id="${r.id}" type="button">
      <div><div class="list-title">${esc(r.problem || "إصلاح")} ${r.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
      <div class="faint">${formatDate(r.date)} · ${formatKm(r.odometer || 0)}</div></div>
      <strong>${formatMoney(r.total, currency())}</strong></button>`
    )
    .join("");
  box.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => go("repairs", { edit: b.dataset.id })));
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function form(root, rec) {
  const { car } = appState();
  root.innerHTML = `${pageTitle(rec ? "تعديل إصلاح" : "تسجيل إصلاح")}
    <form class="form-grid two" id="f">
      ${field({ id: "date", label: "التاريخ", type: "date", value: rec?.date || todayIso(), required: true })}
      ${field({ id: "odometer", label: "العداد", type: "number", inputMode: "decimal", unit: "كم", value: rec?.odometer || car.odometer, required: true })}
      ${field({ id: "problem", label: "المشكلة", value: rec?.problem || "", required: true })}
      ${field({ id: "diagnosis", label: "التشخيص", value: rec?.diagnosis || "", optional: true })}
      ${field({ id: "workshop", label: "الورشة", value: rec?.workshop || "", optional: true })}
      ${field({ id: "parts", label: "قطع الغيار", value: rec?.parts || "", optional: true })}
      ${field({ id: "partsCost", label: "تكلفة القطع", type: "number", inputMode: "decimal", unit: currency(), value: rec?.partsCost || 0 })}
      ${field({ id: "laborCost", label: "المصنعية", type: "number", inputMode: "decimal", unit: currency(), value: rec?.laborCost || 0 })}
      ${field({ id: "total", label: "الإجمالي", type: "number", inputMode: "decimal", unit: currency(), value: rec?.total || 0 })}
      ${field({ id: "warrantyUntil", label: "الضمان حتى", type: "date", value: rec?.warrantyUntil || "", optional: true })}
      ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  const sum = () => {
    const p = parseNum(document.getElementById("partsCost").value) || 0;
    const l = parseNum(document.getElementById("laborCost").value) || 0;
    document.getElementById("total").value = String(Math.round((p + l) * 100) / 100);
  };
  document.getElementById("partsCost").addEventListener("input", sum);
  document.getElementById("laborCost").addEventListener("input", sum);
  root.querySelector("#cancel").onclick = () => go("repairs");
  root.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف الإصلاح؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("repairRecords", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("repairs");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    if (!document.getElementById("problem").value.trim()) return setError("problem", "اكتب المشكلة.");
    const odo = parseNum(document.getElementById("odometer").value);
    if (odo == null) return setError("odometer", "اكتب العداد.");
    if (odo < Number(car.odometer || 0)) setError("odometer", "العداد أقل من آخر قراءة مسجلة.");
    const t = nowIso();
    const partsCost = parseNum(document.getElementById("partsCost").value) || 0;
    const laborCost = parseNum(document.getElementById("laborCost").value) || 0;
    const row = {
      ...(rec || { id: uid("rpr"), createdAt: t, isDemo: false }),
      carId: car.id,
      date: document.getElementById("date").value,
      odometer: odo,
      problem: document.getElementById("problem").value.trim(),
      diagnosis: document.getElementById("diagnosis").value.trim(),
      workshop: document.getElementById("workshop").value.trim(),
      parts: document.getElementById("parts").value.trim(),
      partsCost,
      laborCost,
      total: parseNum(document.getElementById("total").value) ?? partsCost + laborCost,
      warrantyUntil: document.getElementById("warrantyUntil").value,
      notes: document.getElementById("notes").value.trim(),
      updatedAt: t,
    };
    await db.put("repairRecords", row);
    await bumpOdometer(car, odo);
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("repairs");
  };
}
