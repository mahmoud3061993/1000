import { FUEL_TYPES } from "../constants.js";
import { db } from "../db.js";
import { saveSettings } from "../storage.js";
import { field, setError, val } from "../ui.js";
import { nowIso, parseNum, todayIso, uid } from "../utils.js";

export async function renderOnboarding(root, onDone) {
  let step = 1;
  const data = {
    name: "",
    make: "",
    model: "",
    year: "",
    odometer: "",
    fuelType: "octane92",
    plate: "",
    purchaseDate: "",
    purchasePrice: "",
    color: "",
  };

  function paint() {
    const titles = {
      1: { t: "خلينا نضيف عربيتك", s: "اسم بسيط يكفي — زي الاسم اللي بتناديها بيه." },
      2: { t: "شوية معلومات تساعدنا نحسب صح", s: "العداد ونوع الوقود أهم حاجة للحسابات." },
      3: { t: "تفاصيل إضافية", s: "كل الحقول دي اختيارية، تقدّر تتخطاها." },
    };
    root.innerHTML = `<section class="page onboarding-shell">
      <div class="brand-lockup" style="color:inherit;padding:0 0 8px">
        <div class="brand-mark"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><path d="M4 13v4h2.2M18 17h2v-4M4 13l2-5h12l2 5M6.2 17a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zm11.6 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z"/></svg></div>
        <div><div class="brand-name" style="color:var(--text)">عربيتي</div>
        <div class="muted">كل حاجة تخص عربيتك... في مكان واحد</div></div>
      </div>
      <div class="progress-steps" aria-label="الخطوة ${step} من 3">
        <span class="${step >= 1 ? "is-on" : ""}"></span>
        <span class="${step >= 2 ? "is-on" : ""}"></span>
        <span class="${step >= 3 ? "is-on" : ""}"></span>
      </div>
      <p class="faint">${step} من 3</p>
      <h1>${titles[step].t}</h1>
      <p class="muted">${titles[step].s}</p>
      <form class="stack" id="ob-form"></form>
    </section>`;
    const form = root.querySelector("#ob-form");
    if (step === 1) {
      form.innerHTML = `${field({ id: "name", label: "اسم العربية", value: data.name, required: true, placeholder: "مثلاً: سيراتو الشغل" })}
        ${field({ id: "make", label: "الشركة المصنعة", value: data.make, placeholder: "Kia" })}
        ${field({ id: "model", label: "الموديل", value: data.model, placeholder: "Cerato" })}
        ${field({ id: "year", label: "سنة الصنع", type: "number", inputMode: "numeric", value: data.year, placeholder: "2021" })}
        <button class="btn btn-primary btn-block" type="submit">التالي</button>`;
    } else if (step === 2) {
      form.innerHTML = `${field({ id: "odometer", label: "عداد الكيلومتر الحالي", type: "number", inputMode: "decimal", unit: "كم", value: data.odometer, required: true })}
        ${field({ id: "fuelType", label: "نوع الوقود", value: data.fuelType, options: FUEL_TYPES })}
        <div class="form-actions"><button class="btn btn-ghost" type="button" data-back>رجوع</button>
        <button class="btn btn-primary" type="submit">التالي</button></div>`;
    } else {
      form.innerHTML = `${field({ id: "plate", label: "رقم اللوحة", value: data.plate, optional: true })}
        ${field({ id: "purchaseDate", label: "تاريخ الشراء", type: "date", value: data.purchaseDate, optional: true })}
        ${field({ id: "purchasePrice", label: "سعر الشراء", type: "number", inputMode: "decimal", unit: "جنيه", value: data.purchasePrice, optional: true })}
        ${field({ id: "color", label: "لون العربية", value: data.color, optional: true })}
        <div class="form-actions">
          <button class="btn btn-ghost" type="button" data-skip>تخطي</button>
          <button class="btn btn-ghost" type="button" data-back>رجوع</button>
          <button class="btn btn-primary" type="submit">تم</button>
        </div>`;
    }
    form.onsubmit = (e) => {
      e.preventDefault();
      next();
    };
    form.querySelector("[data-back]")?.addEventListener("click", () => {
      step -= 1;
      paint();
    });
    form.querySelector("[data-skip]")?.addEventListener("click", () => finish());
  }

  function read() {
    for (const id of ["name", "make", "model", "year", "odometer", "fuelType", "plate", "purchaseDate", "purchasePrice", "color"]) {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    }
  }

  async function next() {
    read();
    if (step === 1) {
      if (!data.name.trim()) return setError("name", "اكتب اسم العربية.");
      step = 2;
      paint();
      return;
    }
    if (step === 2) {
      const odo = parseNum(data.odometer);
      if (odo == null || odo < 0) return setError("odometer", "اكتب العداد الحالي.");
      step = 3;
      paint();
      return;
    }
    await finish();
  }

  async function finish() {
    read();
    const t = nowIso();
    const car = {
      id: uid("car"),
      name: data.name.trim() || `${data.make} ${data.model}`.trim() || "عربيتي",
      make: data.make.trim(),
      model: data.model.trim(),
      year: parseNum(data.year),
      odometer: parseNum(data.odometer) || 0,
      fuelType: data.fuelType,
      plate: data.plate.trim(),
      purchaseDate: data.purchaseDate || "",
      purchasePrice: parseNum(data.purchasePrice),
      color: data.color.trim(),
      createdAt: t,
      updatedAt: t,
      odometerUpdatedAt: t,
    };
    await db.put("cars", car);
    await saveSettings({ currentCarId: car.id });
    root.innerHTML = `<section class="page" style="text-align:center;padding-top:48px">
      <div class="empty-state">
        <h1>تمام 👌</h1>
        <p>عربيتك اتضافت، ونقدر نبدأ نتابعها.</p>
        <button class="btn btn-primary btn-block" type="button" id="open-dash">افتح لوحة التحكم</button>
      </div>
    </section>`;
    root.querySelector("#open-dash").onclick = () => onDone(car);
  }

  void todayIso;
  paint();
}
