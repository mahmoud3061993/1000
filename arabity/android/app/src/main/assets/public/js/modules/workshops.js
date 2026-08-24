import { WORKSHOP_TYPES } from "../constants.js";
import { db } from "../db.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { confirmDialog, field, pageTitle, toast } from "../ui.js";
import { formatDate, isNative, labelOf, nowIso, todayIso, uid } from "../utils.js";
import { icon } from "../icons.js";

export async function renderWorkshops(root, params = {}) {
  const { ctx } = appState();
  if (params.add === "1" || params.edit) return form(root, params.edit ? ctx.workshops.find((w) => w.id === params.edit) : null);
  let q = "";
  root.innerHTML = `${pageTitle("مراكز الصيانة", "دليل خاص بيك على الجهاز — من غير إنترنت.")}
    <button class="btn btn-primary" id="add">${icon("plus", 18)} إضافة مركز</button>
    <div class="search-box">${icon("search", 18)}<input id="q" placeholder="بحث بالاسم أو التخصص" /></div>
    <div class="stack" id="list"></div>`;
  root.querySelector("#add").onclick = () => go("workshops", { add: "1" });
  const paint = () => {
    const list = (ctx.workshops || []).filter((w) => !q || `${w.name} ${w.specialty} ${w.address}`.includes(q));
    const box = root.querySelector("#list");
    if (!ctx.workshops.length) {
      box.innerHTML = `<div class="empty-state"><h3>مفيش مراكز متسجلة.</h3><p class="muted">ضيف الورشة اللي بتروحها عشان تلاقي رقمها بسرعة.</p></div>`;
      return;
    }
    box.innerHTML = list
      .map(
        (w) => `<article class="list-card">
        <button type="button" data-ed="${w.id}" style="flex:1;text-align:right">
          <div class="list-title">${esc(w.name)}</div>
          <div class="faint">${labelOf(WORKSHOP_TYPES, w.type)} · ${esc(w.specialty || "")} · ${"★".repeat(w.rating || 0)}</div>
        </button>
        ${w.phone ? `<a class="btn btn-ghost btn-sm" href="tel:${esc(w.phone)}">${icon("phone", 16)} اتصال</a>` : ""}
      </article>`
      )
      .join("");
    box.querySelectorAll("[data-ed]").forEach((b) => (b.onclick = () => go("workshops", { edit: b.dataset.ed })));
  };
  paint();
  document.getElementById("q").oninput = (e) => {
    q = e.target.value.trim();
    paint();
  };
  void isNative;
}

async function form(root, rec) {
  root.innerHTML = `${pageTitle(rec ? "تعديل مركز" : "إضافة مركز")}
    <form class="form-grid two" id="f">
      ${field({ id: "name", label: "الاسم", value: rec?.name || "", required: true })}
      ${field({ id: "type", label: "النوع", options: WORKSHOP_TYPES, value: rec?.type || "center" })}
      ${field({ id: "phone", label: "الهاتف", type: "tel", value: rec?.phone || "", optional: true })}
      ${field({ id: "address", label: "العنوان", value: rec?.address || "", optional: true })}
      ${field({ id: "specialty", label: "التخصص", value: rec?.specialty || "", optional: true })}
      ${field({ id: "rating", label: "التقييم الشخصي", type: "number", min: 1, value: rec?.rating || 5 })}
      ${field({ id: "lastVisit", label: "آخر زيارة", type: "date", value: rec?.lastVisit || todayIso(), optional: true })}
      ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  root.querySelector("#cancel").onclick = () => go("workshops");
  root.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف المركز؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("workshops", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("workshops");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    const t = nowIso();
    await db.put("workshops", {
      ...(rec || { id: uid("ws"), createdAt: t, isDemo: false }),
      carId: "shared",
      name: document.getElementById("name").value.trim(),
      type: document.getElementById("type").value,
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      specialty: document.getElementById("specialty").value.trim(),
      rating: Math.min(5, Math.max(1, Number(document.getElementById("rating").value) || 1)),
      lastVisit: document.getElementById("lastVisit").value,
      notes: document.getElementById("notes").value.trim(),
      updatedAt: t,
    });
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("workshops");
  };
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
void formatDate;
