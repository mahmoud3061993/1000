import { TIRE_POSITIONS } from "../constants.js";
import { batteryAge, tireAge } from "../calculations.js";
import { db } from "../db.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { confirmDialog, field, pageTitle, toast } from "../ui.js";
import { daysBetween, formatDate, formatKm, formatMoney, labelOf, nowIso, parseNum, todayIso, toDate, uid } from "../utils.js";
import { icon } from "../icons.js";

export async function renderParts(root, tab = "tires") {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  root.innerHTML = `${pageTitle("الكاوتش والبطارية", "معلومات تسجيل فقط — من غير تشخيص آلي.")}
    <div class="segmented">
      <button type="button" data-tab="tires" class="${tab !== "battery" ? "is-active" : ""}">الكاوتش</button>
      <button type="button" data-tab="battery" class="${tab === "battery" ? "is-active" : ""}">البطارية</button>
    </div>
    <div id="body"></div>`;
  const body = root.querySelector("#body");
  const show = (which) => {
    root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === which));
    if (which === "battery") renderBattery(body, ctx, car);
    else renderTires(body, ctx, car);
  };
  root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => show(b.dataset.tab)));
  show(tab === "battery" ? "battery" : "tires");
}

function renderTires(body, ctx, car) {
  const tires = ctx.tires || [];
  body.innerHTML = `<div class="row wrap">
      <button class="btn btn-primary" id="four">${icon("plus", 18)} تركيب أربعة مع بعض</button>
      <button class="btn btn-ghost" id="one">كاوتش واحد</button>
    </div>
    <div class="stack" id="list"></div>`;
  const list = body.querySelector("#list");
  if (!tires.length) {
    list.innerHTML = `<div class="empty-state"><h3>لسه مسجلتش الكاوتش.</h3><p class="muted">سجّل تاريخ التركيب والموديل. مش هنحكم إن الكاوتش غير آمن تلقائيًا.</p></div>`;
  } else {
    list.innerHTML = tires
      .map((t) => {
        const age = tireAge(t);
        const dist = t.installOdometer != null ? Number(car.odometer || 0) - Number(t.installOdometer || 0) : null;
        return `<article class="list-card"><div>
          <div class="list-title">${labelOf(TIRE_POSITIONS, t.position)} · ${esc(t.brand)} ${esc(t.model || "")}</div>
          <div class="faint">اتركب ${formatDate(t.installDate)}${age ? " · العمر التقريبي " + age + " شهر" : ""}${dist != null ? " · مسافة " + formatKm(Math.max(0, dist)) : ""}</div>
        </div><strong>${formatMoney(t.price || 0, currency())}</strong></article>`;
      })
      .join("");
  }
  body.querySelector("#four").onclick = () => tireForm(body, car, null, true);
  body.querySelector("#one").onclick = () => tireForm(body, car, null, false);
}

async function tireForm(body, car, rec, four) {
  body.innerHTML = `${pageTitle(four ? "تركيب 4 كاوتش" : "تسجيل كاوتش")}
    <form class="form-grid two" id="f">
      ${four ? "" : field({ id: "position", label: "المكان", options: TIRE_POSITIONS, value: rec?.position || "fl" })}
      ${field({ id: "brand", label: "الماركة", value: rec?.brand || "", required: true })}
      ${field({ id: "model", label: "الموديل", value: rec?.model || "" })}
      ${field({ id: "installDate", label: "تاريخ التركيب", type: "date", value: rec?.installDate || todayIso() })}
      ${field({ id: "installOdometer", label: "عداد التركيب", type: "number", inputMode: "decimal", unit: "كم", value: rec?.installOdometer || car.odometer })}
      ${field({ id: "price", label: "السعر", type: "number", inputMode: "decimal", unit: currency(), value: rec?.price || "" })}
      ${field({ id: "manufactureDate", label: "تاريخ التصنيع", type: "date", value: rec?.manufactureDate || "", optional: true })}
      ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  body.querySelector("#cancel").onclick = () => renderParts(document.getElementById("app-main"), "tires");
  body.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const t = nowIso();
    const base = {
      carId: car.id,
      brand: document.getElementById("brand").value.trim(),
      model: document.getElementById("model").value.trim(),
      installDate: document.getElementById("installDate").value,
      installOdometer: parseNum(document.getElementById("installOdometer").value),
      price: parseNum(document.getElementById("price").value) || 0,
      manufactureDate: document.getElementById("manufactureDate").value,
      notes: document.getElementById("notes").value.trim(),
      updatedAt: t,
      createdAt: t,
      isDemo: false,
    };
    if (four) {
      await db.putMany(
        "tireRecords",
        TIRE_POSITIONS.map((p) => ({ ...base, id: uid("tire"), position: p.id }))
      );
    } else {
      await db.put("tireRecords", { ...base, id: rec?.id || uid("tire"), position: document.getElementById("position").value });
    }
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("parts");
  };
}

function renderBattery(body, ctx, car) {
  const list = [...(ctx.batteries || [])].sort((a, b) => String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || "")));
  const b = list[0];
  body.innerHTML = `<button class="btn btn-primary" id="add">${icon("plus", 18)} ${b ? "تحديث البطارية" : "تسجيل البطارية"}</button>
    <div id="box"></div>`;
  const box = body.querySelector("#box");
  if (!b) {
    box.innerHTML = `<div class="empty-state"><h3>مفيش بطارية مسجّلة.</h3><p class="muted">العمر والضمان معلومات تسجيل — مش تشخيص لصحة البطارية.</p></div>`;
  } else {
    const age = batteryAge(b);
    const dist = b.installOdometer != null ? Math.max(0, Number(car.odometer || 0) - Number(b.installOdometer || 0)) : null;
    const wdays = b.warrantyEnd ? daysBetween(new Date(), toDate(b.warrantyEnd)) : null;
    box.innerHTML = `<section class="card">
      <div class="list-title">${esc(b.brand)} ${esc(b.model || "")}</div>
      <p class="muted">اتشترت ${formatDate(b.purchaseDate)} · ${formatMoney(b.price || 0, currency())}</p>
      ${age ? `<p>العمر التقريبي من تاريخ الشراء: ${age} شهر.</p>` : ""}
      ${dist != null ? `<p>المسافة من التركيب: ${formatKm(dist)}.</p>` : ""}
      ${wdays != null ? `<p>الضمان: ${wdays < 0 ? "خلص من " + Math.abs(wdays) + " يوم" : "فاضل " + wdays + " يوم"}.</p>` : ""}
      <p class="faint">العمر لوحده مش دليل على حالة البطارية.</p>
    </section>`;
  }
  body.querySelector("#add").onclick = () => batteryForm(body, car, b);
}

async function batteryForm(body, car, rec) {
  body.innerHTML = `${pageTitle("تسجيل البطارية")}
    <form class="form-grid two" id="f">
      ${field({ id: "brand", label: "الماركة", value: rec?.brand || "", required: true })}
      ${field({ id: "model", label: "الموديل", value: rec?.model || "" })}
      ${field({ id: "purchaseDate", label: "تاريخ الشراء", type: "date", value: rec?.purchaseDate || todayIso() })}
      ${field({ id: "installOdometer", label: "عداد التركيب", type: "number", inputMode: "decimal", unit: "كم", value: rec?.installOdometer || car.odometer })}
      ${field({ id: "price", label: "السعر", type: "number", inputMode: "decimal", unit: currency(), value: rec?.price || "" })}
      ${field({ id: "warrantyMonths", label: "مدة الضمان", type: "number", inputMode: "numeric", unit: "شهر", value: rec?.warrantyMonths || 12 })}
      ${field({ id: "warrantyEnd", label: "تاريخ انتهاء الضمان", type: "date", value: rec?.warrantyEnd || "", optional: true })}
      ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  const wm = document.getElementById("warrantyMonths");
  const pd = document.getElementById("purchaseDate");
  const we = document.getElementById("warrantyEnd");
  const sync = () => {
    if (we.value) return;
    const months = parseNum(wm.value);
    if (!pd.value || !months) return;
    const d = new Date(pd.value + "T12:00:00");
    d.setMonth(d.getMonth() + months);
    we.value = d.toISOString().slice(0, 10);
  };
  wm.addEventListener("input", sync);
  pd.addEventListener("change", sync);
  body.querySelector("#cancel").onclick = () => renderParts(document.getElementById("app-main"), "battery");
  body.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف البطارية؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("batteryRecords", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("parts");
  });
  body.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const t = nowIso();
    await db.put("batteryRecords", {
      ...(rec || { id: uid("bat"), createdAt: t, isDemo: false }),
      carId: car.id,
      brand: document.getElementById("brand").value.trim(),
      model: document.getElementById("model").value.trim(),
      purchaseDate: document.getElementById("purchaseDate").value,
      installOdometer: parseNum(document.getElementById("installOdometer").value),
      price: parseNum(document.getElementById("price").value) || 0,
      warrantyMonths: parseNum(document.getElementById("warrantyMonths").value),
      warrantyEnd: document.getElementById("warrantyEnd").value,
      notes: document.getElementById("notes").value.trim(),
      updatedAt: t,
    });
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("parts");
  };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
