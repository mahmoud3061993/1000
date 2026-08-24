import { DOCUMENT_TYPES } from "../constants.js";
import { documentStatus } from "../calculations.js";
import { db } from "../db.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { badgeFor, confirmDialog, field, pageTitle, setError, toast } from "../ui.js";
import { formatDate, formatMoney, labelOf, nowIso, parseNum, sortByDateDesc, todayIso, uid } from "../utils.js";
import { icon } from "../icons.js";

export async function renderDocuments(root, params = {}) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  if (params.add === "1" || params.edit) return form(root, params.edit ? ctx.documents.find((x) => x.id === params.edit) : null);
  const list = sortByDateDesc(ctx.documents, "endDate");
  root.innerHTML = `${pageTitle("المستندات", "رخصة، تأمين، فحص — مع العد التنازلي.")}
    <button class="btn btn-primary" id="add">${icon("plus", 18)} إضافة مستند</button>
    <div class="stack" id="list"></div>`;
  root.querySelector("#add").onclick = () => go("documents", { add: "1" });
  const box = root.querySelector("#list");
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><h3>مفيش مستندات متسجلة.</h3><p class="muted">سجّل الرخصة والتأمين عشان نفكرك قبل ما يخلصوا.</p><button class="btn btn-primary" id="first">ضيف أول مستند</button></div>`;
    box.querySelector("#first").onclick = () => go("documents", { add: "1" });
    return;
  }
  box.innerHTML = list
    .map((r) => {
      const st = documentStatus(r);
      const daysTxt = st.days == null ? "" : st.days < 0 ? `منتهي من ${Math.abs(st.days)} يوم` : `فاضل ${st.days} يوم`;
      return `<button class="list-card" data-id="${r.id}" type="button">
        <div><div class="list-title">${esc(r.title || labelOf(DOCUMENT_TYPES, r.type))} ${r.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
        <div class="faint">${formatDate(r.endDate)} · ${daysTxt}</div></div>
        <div>${badgeFor(st)}<div><strong>${formatMoney(r.cost || 0, currency())}</strong></div></div></button>`;
    })
    .join("");
  box.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => go("documents", { edit: b.dataset.id })));
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function form(root, rec) {
  const { car } = appState();
  root.innerHTML = `${pageTitle(rec ? "تعديل مستند" : "تجديد / مستند")}
    <form class="form-grid two" id="f">
      ${field({ id: "type", label: "النوع", options: DOCUMENT_TYPES, value: rec?.type || "license" })}
      ${field({ id: "title", label: "الاسم", value: rec?.title || "", optional: true, placeholder: "يظهر لو النوع مخصص" })}
      ${field({ id: "startDate", label: "تاريخ البداية", type: "date", value: rec?.startDate || todayIso(), required: true })}
      ${field({ id: "endDate", label: "تاريخ الانتهاء", type: "date", value: rec?.endDate || "", required: true })}
      ${field({ id: "cost", label: "التكلفة", type: "number", inputMode: "decimal", unit: currency(), value: rec?.cost || "", optional: true })}
      ${field({ id: "notes", label: "ملاحظات", type: "textarea", value: rec?.notes || "", optional: true })}
      <div class="form-actions" style="grid-column:1/-1">
        ${rec ? `<button class="btn btn-ghost" type="button" id="del">حذف</button>` : ""}
        <button class="btn btn-ghost" type="button" id="cancel">رجوع</button>
        <button class="btn btn-primary" type="submit">حفظ</button>
      </div>
    </form>`;
  root.querySelector("#cancel").onclick = () => go("documents");
  root.querySelector("#del")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "حذف المستند؟", message: "السجل هيتمسح.", confirmLabel: "حذف", danger: true }))) return;
    await db.del("documents", rec.id);
    toast("تم حذف السجل");
    await refresh(false);
    go("documents");
  });
  root.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    if (!document.getElementById("endDate").value) return setError("endDate", "حدد تاريخ الانتهاء.");
    const t = nowIso();
    const type = document.getElementById("type").value;
    const row = {
      ...(rec || { id: uid("doc"), createdAt: t, isDemo: false }),
      carId: car.id,
      type,
      title: document.getElementById("title").value.trim() || labelOf(DOCUMENT_TYPES, type),
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value,
      cost: parseNum(document.getElementById("cost").value) || 0,
      notes: document.getElementById("notes").value.trim(),
      date: document.getElementById("startDate").value,
      updatedAt: t,
    };
    await db.put("documents", row);
    toast("تم الحفظ بنجاح");
    await refresh(false);
    go("documents");
  };
}
