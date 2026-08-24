import { MAINTENANCE_TYPES } from "../constants.js";
import { bumpOdometer, db } from "../db.js";
import { latestByType, nextMaintenance } from "../calculations.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { badgeFor, confirmDialog, field, pageTitle, setError, toast } from "../ui.js";
import { formatDate, formatKm, formatMoney, labelOf, nowIso, parseNum, sortByDateDesc, todayIso, uid } from "../utils.js";
import { icon } from "../icons.js";

const PAGE = 20;

export async function renderMaintenance(root, params = {}) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  if (params.add === "1" || params.edit) return form(root, params.edit ? ctx.maintenance.find((x) => x.id === params.edit) : null);
  const list = sortByDateDesc(ctx.maintenance);
  const upcoming = latestByType(list).map((r) => nextMaintenance(r, car)).filter(Boolean);
  root.innerHTML = `${pageTitle("الصيانة", "تابع آخر صيانة والصيانة الجاية.")}
    <button class="btn btn-primary" id="add" type="button">${icon("plus", 18)} ضيف صيانة</button>
    <section class="card">${
      upcoming.length
        ? upcoming
            .map(
              (n) => `<div class="upcoming-item"><div>
          <div class="list-title">${n.label}</div>
          <div class="faint">${n.remainKm != null ? "فاضل " + formatKm(n.remainKm) : n.remainDays != null ? "فاضل " + n.remainDays + " يوم" : "من غير ميعاد محدد"}</div></div>${badgeFor(n.status)}</div>`
            )
            .join("")
        : `<p class="muted">مفيش صيانة مسجلة لحد دلوقتي.</p>`
    }</section>
    <div class="stack" id="list"></div>
    <button class="btn btn-ghost" id="more" ${list.length <= PAGE ? "hidden" : ""}>عرض المزيد</button>`;
  root.querySelector("#add").onclick = () => go("maintenance", { add: "1" });
  let shown = PAGE;
  const paint = () => {
    const slice = list.slice(0, shown);
    const box = root.querySelector("#list");
    if (!list.length) {
      box.innerHTML = `<div class="empty-state"><h3>مفيش صيانة مسجلة لحد دلوقتي.</h3><p class="muted">سجّل تغيير الزيت أو أي صيانة، وهنحسبلك الصيانة الجاية.</p><button class="btn btn-primary" id="first">ضيف أول صيانة</button></div>`;
      box.querySelector("#first").onclick = () => go("maintenance", { add: "1" });
      return;
    }
    box.innerHTML = slice
      .map(
        (r) => `<button class="list-card" data-id="${r.id}" type="button">
        <div><div class="list-title">${labelOf(MAINTENANCE_TYPES, r.type)} ${r.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
        <div class="faint">${formatDate(r.date)} · ${formatKm(r.odometer)}</div></div>
        <strong>${formatMoney(r.total, currency())}</strong></button>`
      )
      .join("");
    box.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => go("maintenance", { edit: b.dataset.id })));
    root.querySelector("#more").hidden = shown >= list.length;
  };
  paint();
  root.querySelector("#more").onclick = () => {
    shown += PAGE;
    paint();
  };
}

async function form(root, rec) {
  const { car } = appState();
  root.innerHTML = `${pageTitle(rec ? "تعديل صيانة" : "تسجيل صيانة")}
    <form class="form-grid two" id="f">
      ${field({ id: "date", label: "التاريخ", type: "date", value: rec?.date || todayIso(), required: true })}
      ${field({ id: "odometer", label: "عداد الكيلومتر", type: "number", inputMode: "decimal", unit: "كم", value: rec?.odometer || car.odometer, required: true })}
      ${field({ id: "type", label: "نوع الصيانة", options: MAINTENANCE_TYPES, value: rec?.type || "oil" })}
      ${field({ id: "workshop", label: "المركز / الورشة", value: rec?.workshop || "", optional: true })}
      ${field({ id: "partsCost", label: "تكلفة القطع", type: "number", inputMode: "decimal", unit: currency(), step: "0.01", value: rec?.partsCost || 0 })}
      ${field({ id: "laborCost", label: "تكلفة المصنعية", type: "number", inputMode: "decimal", unit: currency(), step: "0.01", value: rec?.laborCost || 0 })}
      ${field({ id: "total", label: "الإجمالي", type: "number", inputMode: "decimal", unit: currency(), value: rec?.total || 0 })}
      <div class="card-soft" style="grid-column:1/-1">
        <div class="section-title">الصيانة الجاية</div>
        ${field({ id: "intervalKm", label: "بعد كام كيلومتر", type: "number", inputMode: "numeric", unit: "كم", value: rec?.intervalKm || 10000, optional: true })}
        ${field({ id: "intervalMonths", label: "بعد كام شهر", type: "number", inputMode: "numeric", unit: "شهر", value: rec?.intervalMonths || "", optional: true })}
        ${field({ id: "nextDate", label: "أو تاريخ محدد", type: "date", value: rec?.nextDate || "", optional: true })}
      </div>
      <button type="button" class="details-toggle" id="morebtn" style="grid-column:1/-1">تفاصيل إضافية</button>
      <div id="opt" hidden style="grid-column:1/-1">${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}</div>
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
  root.querySelector("#morebtn").onclick = () => (document.getElementById("opt").hidden = !document.getElementById("opt").hidden);
  root.querySelector("#cancel").onclick = () => go("maintenance");
  root.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف الصيانة؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("maintenanceRecords", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("maintenance");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    if (!document.getElementById("date").value) return setError("date", "اختار التاريخ.");
    const odo = parseNum(document.getElementById("odometer").value);
    if (odo == null) return setError("odometer", "اكتب العداد.");
    if (odo < Number(car.odometer || 0)) setError("odometer", "العداد أقل من آخر قراءة مسجلة.");
    const t = nowIso();
    const partsCost = parseNum(document.getElementById("partsCost").value) || 0;
    const laborCost = parseNum(document.getElementById("laborCost").value) || 0;
    const row = {
      ...(rec || { id: uid("mnt"), createdAt: t, isDemo: false }),
      carId: car.id,
      date: document.getElementById("date").value,
      odometer: odo,
      type: document.getElementById("type").value,
      workshop: document.getElementById("workshop").value.trim(),
      partsCost,
      laborCost,
      total: parseNum(document.getElementById("total").value) ?? partsCost + laborCost,
      intervalKm: parseNum(document.getElementById("intervalKm").value),
      intervalMonths: parseNum(document.getElementById("intervalMonths").value),
      nextDate: document.getElementById("nextDate").value,
      notes: document.getElementById("notes")?.value.trim() || "",
      updatedAt: t,
    };
    await db.put("maintenanceRecords", row);
    await bumpOdometer(car, odo);
    toast("تم الحفظ بنجاح", { action: { label: "سجل حاجة تانية", onClick: () => go("maintenance", { add: "1" }) } });
    await refresh(false);
    go("maintenance");
  };
}
