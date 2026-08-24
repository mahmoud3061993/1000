import { DEFAULT_CHECKLIST } from "../constants.js";
import { db } from "../db.js";
import { appState, refresh } from "../session.js";
import { go } from "../router.js";
import { confirmDialog, field, pageTitle, toast } from "../ui.js";
import { nowIso, uid } from "../utils.js";
import { icon } from "../icons.js";

export async function renderChecklist(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  let doc = ctx.checklists[0];
  if (!doc) {
    doc = {
      id: uid("chk"),
      carId: car.id,
      items: DEFAULT_CHECKLIST.map((x) => ({ ...x, done: false, custom: false })),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.put("checklists", doc);
    await refresh(false);
  }
  const paint = async () => {
    const done = doc.items.filter((i) => i.done).length;
    root.innerHTML = `${pageTitle("قائمة السفر", `${done} / ${doc.items.length} جاهزين`)}
      <div class="progress-bar"><span style="width:${doc.items.length ? (done / doc.items.length) * 100 : 0}%"></span></div>
      <div class="stack" id="list"></div>
      <form id="add" class="row">${field({ id: "newitem", label: "بند مخصص", placeholder: "مثلاً: كيس بلاستيك" })}<button class="btn btn-primary" type="submit">إضافة</button></form>
      <button class="btn btn-ghost" id="reset">إعادة ضبط القائمة</button>`;
    const list = root.querySelector("#list");
    list.innerHTML = doc.items
      .map(
        (it) => `<div class="check-item ${it.done ? "is-done" : ""}">
        <button type="button" data-tog="${it.id}" class="row" style="flex:1;text-align:right">
          <span class="check-box">${it.done ? icon("check", 14) : ""}</span>
          <span class="check-label">${esc(it.label)}</span>
        </button>
        ${it.custom ? `<button class="btn btn-ghost btn-sm" data-del="${it.id}">${icon("trash", 16)}</button>` : ""}
      </div>`
      )
      .join("");
    list.querySelectorAll("[data-tog]").forEach((b) => {
      b.onclick = async () => {
        const it = doc.items.find((x) => x.id === b.dataset.tog);
        it.done = !it.done;
        doc.updatedAt = nowIso();
        await db.put("checklists", doc);
        paint();
      };
    });
    list.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = async () => {
        doc.items = doc.items.filter((x) => x.id !== b.dataset.del);
        doc.updatedAt = nowIso();
        await db.put("checklists", doc);
        toast("تم حذف السجل");
        paint();
      };
    });
    root.querySelector("#add").onsubmit = async (e) => {
      e.preventDefault();
      const label = document.getElementById("newitem").value.trim();
      if (!label) return;
      doc.items.push({ id: uid("ci"), label, done: false, custom: true });
      doc.updatedAt = nowIso();
      await db.put("checklists", doc);
      paint();
    };
    root.querySelector("#reset").onclick = async () => {
      if (!(await confirmDialog({ title: "إعادة ضبط؟", message: "هترجع القائمة للبنود الأساسية وهتتشال البنود المخصصة.", confirmLabel: "إعادة ضبط" }))) return;
      doc.items = DEFAULT_CHECKLIST.map((x) => ({ ...x, done: false, custom: false }));
      doc.updatedAt = nowIso();
      await db.put("checklists", doc);
      toast("تم تحديث البيانات");
      paint();
    };
  };
  await paint();
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
