import { FUEL_TYPES } from "../constants.js";
import { db } from "../db.js";
import { appState, refresh } from "../session.js";
import { saveSettings } from "../storage.js";
import { confirmDialog, field, pageTitle, setError, toast } from "../ui.js";
import { formatKm, nowIso, parseNum, uid } from "../utils.js";
import { go } from "../router.js";
import { icon } from "../icons.js";

export async function renderCars(root, params = {}) {
  const { cars } = appState();
  if (params.add === "1" || params.edit) {
    return renderForm(root, params.edit ? cars.find((c) => c.id === params.edit) : null);
  }
  root.innerHTML = `${pageTitle("السيارات", "كل عربية ليها لوحة ومتابعة مستقلة.")}
    <button class="btn btn-primary" type="button" id="add">${icon("plus", 18)} إضافة عربية</button>
    <div class="stack" id="list"></div>`;
  root.querySelector("#add").onclick = () => go("cars", { add: "1" });
  const list = root.querySelector("#list");
  if (!cars.length) {
    list.innerHTML = `<div class="empty-state"><h3>مفيش عربيات لسه</h3><p class="muted">ضيف عربيتك عشان نبدأ المتابعة.</p></div>`;
    return;
  }
  list.innerHTML = cars
    .map(
      (c) => `<article class="list-card">
      <button type="button" data-sel="${c.id}" style="flex:1;text-align:right">
        <div class="list-title">${esc(c.name)} ${c.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
        <div class="faint">${esc(c.make)} ${esc(c.model)} · ${esc(c.year || "")} · ${formatKm(c.odometer || 0)}</div>
      </button>
      <div class="stack">
        <button class="btn btn-ghost btn-sm" data-ed="${c.id}">تعديل</button>
        <button class="btn btn-ghost btn-sm" data-del="${c.id}">حذف</button>
      </div>
    </article>`
    )
    .join("");
  list.querySelectorAll("[data-sel]").forEach((b) => {
    b.onclick = async () => {
      await saveSettings({ currentCarId: b.dataset.sel });
      await refresh(true);
      go("dashboard");
    };
  });
  list.querySelectorAll("[data-ed]").forEach((b) => (b.onclick = () => go("cars", { edit: b.dataset.ed })));
  list.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = async () => {
      const ok = await confirmDialog({
        title: "حذف العربية؟",
        message: "هتتمسح كل السجلات المرتبطة بالعربية دي من الجهاز. العملية دي مينفعش تتراجع.",
        confirmLabel: "حذف العربية",
        danger: true,
      });
      if (!ok) return;
      const id = b.dataset.del;
      await db.deleteByCar(id);
      await db.del("cars", id);
      const settings = (await db.getAll("settings"))[0];
      if (settings?.currentCarId === id) {
        const rest = (await db.getAll("cars"))[0];
        await saveSettings({ currentCarId: rest?.id || "" });
      }
      toast("تم حذف السجل");
      await refresh(true);
      const left = await db.getAll("cars");
    if (!left.length) window.location.reload();
    };
  });
}

async function renderForm(root, car) {
  root.innerHTML = `${pageTitle(car ? "تعديل العربية" : "إضافة عربية")}
    <form class="form-grid two" id="f">
      ${field({ id: "name", label: "اسم العربية", value: car?.name || "", required: true })}
      ${field({ id: "make", label: "الشركة المصنعة", value: car?.make || "" })}
      ${field({ id: "model", label: "الموديل", value: car?.model || "" })}
      ${field({ id: "year", label: "سنة الصنع", type: "number", inputMode: "numeric", value: car?.year || "" })}
      ${field({ id: "odometer", label: "عداد الكيلومتر", type: "number", inputMode: "decimal", unit: "كم", value: car?.odometer || "", required: true })}
      ${field({ id: "fuelType", label: "نوع الوقود", options: FUEL_TYPES, value: car?.fuelType || "octane92" })}
      ${field({ id: "plate", label: "رقم اللوحة", value: car?.plate || "", optional: true })}
      ${field({ id: "purchaseDate", label: "تاريخ الشراء", type: "date", value: car?.purchaseDate || "", optional: true })}
      ${field({ id: "purchasePrice", label: "سعر الشراء", type: "number", inputMode: "decimal", unit: "جنيه", value: car?.purchasePrice || "", optional: true })}
      ${field({ id: "color", label: "اللون", value: car?.color || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  root.querySelector("#cancel").onclick = () => go("cars");
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const odo = parseNum(document.getElementById("odometer").value);
    if (!name) return setError("name", "اكتب اسم العربية.");
    if (odo == null || odo < 0) return setError("odometer", "اكتب العداد.");
    if (car && odo < Number(car.odometer || 0)) {
      setError("odometer", "العداد أقل من آخر قراءة مسجلة.");
    }
    const t = nowIso();
    const rec = {
      ...(car || { id: uid("car"), createdAt: t, isDemo: false }),
      name,
      make: document.getElementById("make").value.trim(),
      model: document.getElementById("model").value.trim(),
      year: parseNum(document.getElementById("year").value),
      odometer: car ? Math.max(Number(car.odometer || 0), odo) : odo,
      fuelType: document.getElementById("fuelType").value,
      plate: document.getElementById("plate").value.trim(),
      purchaseDate: document.getElementById("purchaseDate").value,
      purchasePrice: parseNum(document.getElementById("purchasePrice").value),
      color: document.getElementById("color").value.trim(),
      updatedAt: t,
      odometerUpdatedAt: t,
    };
    if (car && odo < Number(car.odometer || 0)) rec.odometer = odo;
    await db.put("cars", rec);
    await saveSettings({ currentCarId: rec.id });
    toast(car ? "تم تحديث البيانات" : "تم الحفظ بنجاح");
    await refresh(false);
    go("cars");
  };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
