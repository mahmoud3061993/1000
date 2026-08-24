import { db } from "./db.js";
import { documentStatus, latestByType, nextMaintenance } from "./calculations.js";
import { isNative, nativePlugin, toDate } from "./utils.js";
import { confirmDialog, toast } from "./ui.js";

export async function maybeAskNotifications() {
  if (!isNative()) return;
  const asked = localStorage.getItem("arabity-notif-asked");
  if (asked) return;
  const ok = await confirmDialog({
    title: "تفعيل التنبيهات",
    message: "فعّل التنبيهات عشان نفكرك بمواعيد الصيانة والتجديد. تقدّر ترفض والتطبيق يشتغل عادي.",
    confirmLabel: "تفعيل",
  });
  localStorage.setItem("arabity-notif-asked", "1");
  if (!ok) return;
  const plugin = nativePlugin("LocalNotifications");
  try {
    const perm = await plugin.requestPermissions();
    if (perm.display === "granted") toast("التنبيهات اتفعّلت");
  } catch {
    /* app continues */
  }
}

export async function syncDateNotifications(ctx) {
  const plugin = nativePlugin("LocalNotifications");
  if (!plugin || !isNative()) return;
  try {
    const pending = await plugin.getPending();
    const ids = (pending.notifications || []).map((n) => n.id);
    if (ids.length) await plugin.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    return;
  }
  const notes = [];
  let id = 1;
  for (const rec of latestByType(ctx.maintenance)) {
    const n = nextMaintenance(rec, ctx.car);
    if (n?.nextDate && n.remainDays >= 0 && n.remainDays <= 14) {
      notes.push({
        id: id++,
        title: "عربيتي",
        body: `${n.label} قرب ميعادها`,
        schedule: { at: toDate(n.nextDate) },
      });
    }
  }
  for (const doc of ctx.documents) {
    const st = documentStatus(doc);
    if (st.days != null && st.days >= 0 && st.days <= 14) {
      notes.push({
        id: id++,
        title: "عربيتي",
        body: `${doc.title || "مستند"} هينتهي قريب`,
        schedule: { at: toDate(doc.endDate) },
      });
    }
  }
  for (const rem of ctx.reminders || []) {
    if (rem.done || rem.kind === "km" || !rem.date) continue;
    const at = toDate(rem.date);
    if (at && at > new Date()) notes.push({ id: id++, title: "عربيتي", body: rem.title, schedule: { at } });
  }
  if (notes.length) {
    try {
      await plugin.schedule({ notifications: notes.slice(0, 40) });
    } catch {
      /* ignore */
    }
  }
}

export function kmReminders(ctx) {
  return (ctx.reminders || []).filter((r) => {
    if (r.done || r.kind !== "km") return false;
    return Number(ctx.car?.odometer || 0) >= Number(r.odometer || 0);
  });
}

export async function loadAppContext(carId) {
  const [
    cars,
    fuel,
    maintenance,
    repairs,
    expenses,
    documents,
    batteries,
    tires,
    workshops,
    reminders,
    checklists,
    customCategories,
    milestonesSeen,
  ] = await Promise.all([
    db.getAll("cars"),
    db.byCar("fuelEntries", carId),
    db.byCar("maintenanceRecords", carId),
    db.byCar("repairRecords", carId),
    db.byCar("expenses", carId),
    db.byCar("documents", carId),
    db.byCar("batteryRecords", carId),
    db.byCar("tireRecords", carId),
    db.getAll("workshops"),
    db.byCar("reminders", carId),
    db.byCar("checklists", carId),
    db.getAll("customCategories"),
    db.getAll("milestonesSeen"),
  ]);
  const car = cars.find((c) => c.id === carId) || null;
  return {
    cars,
    car,
    fuel,
    maintenance,
    repairs,
    expenses,
    documents,
    batteries,
    tires,
    workshops,
    reminders,
    checklists,
    customCategories,
    milestonesSeen,
  };
}
