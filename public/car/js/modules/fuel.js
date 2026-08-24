import { FUEL_TYPES } from "../constants.js";
import { bumpOdometer, db } from "../db.js";
import { appState, openQuickAdd, refresh } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { confirmDialog, field, pageTitle, setError, toast } from "../ui.js";
import { formatDate, formatKm, formatMoney, formatNumber, nowIso, parseNum, sortByDateDesc, todayIso, uid } from "../utils.js";
import { fullToFullConsumption, recentConsumptionShift } from "../calculations.js";
import { barChart, emptyChart, lineChart } from "../charts.js";
import { icon } from "../icons.js";
import { firstError, validateFuel } from "../validation.js";
import { monthRange } from "../utils.js";

const PAGE = 20;

export async function renderFuel(root, params = {}) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  if (params.add === "1" || params.edit) {
    return renderForm(root, params.edit ? ctx.fuel.find((x) => x.id === params.edit) : null);
  }
  const list = sortByDateDesc(ctx.fuel);
  const cons = fullToFullConsumption(ctx.fuel);
  const shift = recentConsumptionShift(cons.samples);
  const { from, to } = monthRange(0);
  const monthSpend = ctx.fuel.filter((f) => {
    const d = new Date(f.date);
    return d >= from && d <= to;
  }).reduce((a, f) => a + Number(f.total || 0), 0);
  const unit = (await import("../storage.js")).getSettings().fuelUnit;
  const avgTxt = !cons.ready
    ? "محتاجين تفويلتين كاملتين على الأقل عشان نحسب الاستهلاك بدقة."
    : unit === "l_100"
      ? `متوسط الاستهلاك ${formatNumber(cons.avgL100, 2)} لتر / 100 كم`
      : `متوسط الاستهلاك ${formatNumber(cons.avgKmL, 2)} كم / لتر`;

  root.innerHTML = `${pageTitle("البنزين", "سجّل التفويلة، وسيب الحساب علينا.")}
    <div class="kpi-grid">
      <div class="kpi-card"><div class="label">صرف البنزين الشهر ده</div><div class="value">${formatMoney(monthSpend, currency())}</div></div>
      <div class="kpi-card"><div class="label">عدد التفويلات</div><div class="value">${list.length}</div></div>
    </div>
    <section class="insight-card"><p>${avgTxt}</p>
      ${shift?.up ? `<p class="muted">متوسط استهلاك الوقود أعلى من متوسطك المعتاد. راجع ضغط الكاوتش وطريقة القيادة، ولو الزيادة مستمرة ممكن تراجع مركز صيانة.</p>` : ""}
    </section>
    <button class="btn btn-primary" id="add" type="button">${icon("plus", 18)} سجل تفويلة</button>
    <section class="chart-wrap"><div class="section-title">صرف البنزين</div><div id="fuel-spend"></div></section>
    <section class="chart-wrap"><div class="section-title">اتجاه الاستهلاك</div><div id="fuel-trend"></div></section>
    <div class="stack" id="list"></div>
    <button class="btn btn-ghost" id="more" type="button" ${list.length <= PAGE ? "hidden" : ""}>عرض المزيد</button>`;

  root.querySelector("#add").onclick = () => go("fuel", { add: "1" });
  let shown = PAGE;
  const box = root.querySelector("#list");
  const paintList = () => {
    const slice = list.slice(0, shown);
    if (!slice.length) {
      box.innerHTML = `<div class="empty-state"><h3>لسه مسجلتش أي تفويلة.</h3><p class="muted">ابدأ بأول تفويلة، وبعد كذا تسجيل هنقدر نحسبلك متوسط استهلاك عربيتك.</p><button class="btn btn-primary" id="first">سجل أول تفويلة</button></div>`;
      box.querySelector("#first").onclick = () => go("fuel", { add: "1" });
      return;
    }
    box.innerHTML = slice
      .map(
        (r) => `<button class="list-card" type="button" data-id="${r.id}">
        <div><div class="list-title">تفويلة ${r.isFull ? "كاملة" : ""} ${r.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
        <div class="faint">${formatDate(r.date)} · ${formatKm(r.odometer)} · ${formatNumber(r.liters || 0, 1)} لتر</div></div>
        <strong>${formatMoney(r.total, currency())}</strong>
      </button>`
      )
      .join("");
    box.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => go("fuel", { edit: b.dataset.id })));
    root.querySelector("#more").hidden = shown >= list.length;
  };
  paintList();
  root.querySelector("#more").onclick = () => {
    shown += PAGE;
    paintList();
  };

  const spendEl = root.querySelector("#fuel-spend");
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const m = monthRange(-i);
    const total = ctx.fuel.filter((f) => {
      const d = new Date(f.date + "T12:00:00");
      return d >= m.from && d <= m.to;
    }).reduce((a, f) => a + Number(f.total || 0), 0);
    months.push({ label: m.key.slice(5), total });
  }
  if (months.every((m) => !m.total)) emptyChart(spendEl, "سجّل تفويلات عشان يظهر الرسم.");
  else barChart(spendEl, months, { currency: currency() });

  const trendEl = root.querySelector("#fuel-trend");
  if (!cons.samples.length) emptyChart(trendEl, avgTxt);
  else
    lineChart(
      trendEl,
      cons.samples.map((s, i) => ({ label: String(i + 1), value: unit === "l_100" ? s.l100 : s.kmL })),
      { unit: unit === "l_100" ? "ل/100كم" : "كم/لتر" }
    );
  void openQuickAdd;
}

async function renderForm(root, rec) {
  const { car } = appState();
  root.innerHTML = `${pageTitle(rec ? "تعديل تفويلة" : "تسجيل تفويلة")}
    <form class="form-grid two" id="f">
      ${field({ id: "date", label: "التاريخ", type: "date", value: rec?.date || todayIso(), required: true })}
      ${field({ id: "odometer", label: "عداد الكيلومتر", type: "number", inputMode: "decimal", unit: "كم", value: rec?.odometer || car.odometer || "", required: true })}
      ${field({ id: "liters", label: "عدد اللترات", type: "number", inputMode: "decimal", unit: "لتر", step: "0.01", value: rec?.liters || "" })}
      ${field({ id: "pricePerLiter", label: "سعر اللتر", type: "number", inputMode: "decimal", unit: currency(), step: "0.01", value: rec?.pricePerLiter || "" })}
      ${field({ id: "total", label: "الإجمالي", type: "number", inputMode: "decimal", unit: currency(), step: "0.01", value: rec?.total || "" })}
      ${field({ id: "fuelType", label: "نوع الوقود", options: FUEL_TYPES, value: rec?.fuelType || car.fuelType })}
      <div class="field" style="grid-column:1/-1">
        <label class="check-item" style="box-shadow:none"><input type="checkbox" id="isFull" ${rec?.isFull !== false ? "checked" : ""}/> تفويلة كاملة؟</label>
        <p class="faint">علّمها كاملة لو عزلت التانك. الحساب الدقيق للاستهلاك بيحتاج تفويلتين كاملتين.</p>
      </div>
      <button type="button" class="details-toggle" id="more" style="grid-column:1/-1">تفاصيل إضافية</button>
      <div id="opt" hidden style="grid-column:1/-1" class="form-grid two">
        ${field({ id: "station", label: "المحطة", value: rec?.station || "", optional: true })}
        ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      </div>
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  const auto = () => {
    const liters = parseNum(document.getElementById("liters").value);
    const ppl = parseNum(document.getElementById("pricePerLiter").value);
    const total = parseNum(document.getElementById("total").value);
    if (liters && ppl && document.activeElement?.id !== "total") {
      document.getElementById("total").value = String(Math.round(liters * ppl * 100) / 100);
    } else if (liters && total && !ppl && document.activeElement?.id !== "pricePerLiter") {
      document.getElementById("pricePerLiter").value = String(Math.round((total / liters) * 100) / 100);
    }
  };
  ["liters", "pricePerLiter", "total"].forEach((id) => document.getElementById(id).addEventListener("input", auto));
  root.querySelector("#more").onclick = () => {
    document.getElementById("opt").hidden = !document.getElementById("opt").hidden;
  };
  root.querySelector("#cancel").onclick = () => go("fuel");
  root.querySelector("#del")?.addEventListener("click", async () => {
    const ok = await confirmDialog({ title: "حذف التفويلة؟", message: "السجل هيتمسح من العربية الحالية.", confirmLabel: "حذف", danger: true });
    if (!ok) return;
    await db.del("fuelEntries", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("fuel");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      date: document.getElementById("date").value,
      odometer: document.getElementById("odometer").value,
      liters: document.getElementById("liters").value,
      pricePerLiter: document.getElementById("pricePerLiter").value,
      total: document.getElementById("total").value,
      fuelType: document.getElementById("fuelType").value,
    };
    const errors = validateFuel(data, car);
    ["date", "odometer", "liters", "total"].forEach((k) => setError(k, errors[k] || ""));
    if (errors.odometerWarn) setError("odometer", errors.odometerWarn + " تقدر تحفظ لو الرقم صحيح.");
    const msg = firstError(errors);
    if (msg && !errors.odometerWarn) return toast(msg, { type: "danger" });
    if (errors.liters || errors.date) return;
    const t = nowIso();
    const liters = parseNum(data.liters) || 0;
    const ppl = parseNum(data.pricePerLiter);
    let total = parseNum(data.total);
    if (total == null && liters && ppl) total = liters * ppl;
    const row = {
      ...(rec || { id: uid("fuel"), createdAt: t, isDemo: false }),
      carId: car.id,
      date: data.date,
      odometer: parseNum(data.odometer),
      liters,
      pricePerLiter: ppl,
      total: Math.round((total || 0) * 100) / 100,
      fuelType: data.fuelType,
      station: document.getElementById("station")?.value.trim() || "",
      isFull: document.getElementById("isFull").checked,
      notes: document.getElementById("notes")?.value.trim() || "",
      updatedAt: t,
    };
    await db.put("fuelEntries", row);
    await bumpOdometer(car, row.odometer);
    toast("تم تسجيل التفويلة بنجاح", { action: { label: "سجل حاجة تانية", onClick: () => go("fuel", { add: "1" }) } });
    await refresh(false);
    go("fuel");
  };
}
