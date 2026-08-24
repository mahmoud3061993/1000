import { documentStatus, latestByType, nextMaintenance } from "./calculations.js";
import { daysBetween, toDate } from "./utils.js";

function maintScore(ctx) {
  const latest = latestByType(ctx.maintenance);
  if (!latest.length) return { points: 18, max: 40, status: "warn", text: "لسه مفيش صيانة مسجلة — ابدأ بأول صيانة عشان المتابعة تكتمل." };
  const states = latest.map((r) => nextMaintenance(r, ctx.car)).filter((n) => n && n.status.id !== "none");
  if (!states.length) return { points: 28, max: 40, status: "ok", text: "في صيانة مسجلة، من غير مواعيد قادمة محددة." };
  if (states.some((s) => s.status.id === "overdue")) return { points: 10, max: 40, status: "danger", text: "في صيانة متأخرة عن الميعاد اللي محددته." };
  if (states.some((s) => s.status.id === "due")) return { points: 22, max: 40, status: "warn", text: "في صيانة قرب أو حان ميعادها." };
  if (states.some((s) => s.status.id === "approaching")) return { points: 32, max: 40, status: "ok", text: "كل الصيانات متتابعة، وفي حاجة قرب ميعادها." };
  return { points: 40, max: 40, status: "good", text: "مفيش صيانة متأخرة." };
}

function docsScore(ctx) {
  if (!ctx.documents.length) return { points: 8, max: 20, status: "warn", text: "سجّل الرخصة والتأمين عشان نفكرك قبل ما يخلصوا." };
  const sts = ctx.documents.map(documentStatus);
  if (sts.some((s) => s.id === "expired")) return { points: 4, max: 20, status: "danger", text: "في مستند منتهي." };
  if (sts.some((s) => s.id === "urgent")) return { points: 10, max: 20, status: "warn", text: "في مستند هيخلص خلال أقل من 30 يوم." };
  if (sts.some((s) => s.id === "approaching")) return { points: 15, max: 20, status: "ok", text: "التأمين أو الرخصة قرب ينتهي." };
  return { points: 20, max: 20, status: "good", text: "المستندات سارية وفي وقت مريح." };
}

function tireScore(ctx) {
  const tires = ctx.tires || [];
  if (!tires.length) return { points: 6, max: 15, status: "warn", text: "لسه مسجلتش بيانات الكاوتش." };
  if (tires.length >= 4) return { points: 15, max: 15, status: "good", text: "كاوتش العربية الأربع مسجّلين." };
  return { points: 11, max: 15, status: "ok", text: `مسجّل ${tires.length} كاوتش من 4.` };
}

function batteryScore(ctx) {
  const list = ctx.batteries || [];
  if (!list.length) return { points: 4, max: 10, status: "warn", text: "سجّل البطارية عشان نتابع الضمان والعمر." };
  const b = [...list].sort((a, c) => String(c.purchaseDate || "").localeCompare(String(a.purchaseDate || "")))[0];
  const end = toDate(b.warrantyEnd);
  if (end && daysBetween(new Date(), end) < 0) return { points: 6, max: 10, status: "ok", text: "البطارية مسجّلة، والضمان خلص." };
  return { points: 10, max: 10, status: "good", text: "البطارية مسجّلة ومتتابعة." };
}

function odoScore(ctx) {
  const car = ctx.car;
  if (!car?.odometerUpdatedAt && !car?.updatedAt) return { points: 2, max: 5, status: "warn", text: "حدّث العداد عشان الحسابات تبقى أدق." };
  const t = Date.parse(car.odometerUpdatedAt || car.updatedAt || 0);
  const days = (Date.now() - t) / 86400000;
  if (days <= 21) return { points: 5, max: 5, status: "good", text: "العداد محدّث مؤخرًا." };
  if (days <= 45) return { points: 3, max: 5, status: "ok", text: "العداد محتاج تحديث خفيف." };
  return { points: 1, max: 5, status: "warn", text: "فات وقت على آخر تحديث للعداد." };
}

function reminderScore(ctx) {
  const items = [];
  for (const rec of latestByType(ctx.maintenance)) {
    const n = nextMaintenance(rec, ctx.car);
    if (n?.status.id === "overdue") items.push(n);
  }
  for (const d of ctx.documents) {
    if (documentStatus(d).id === "expired") items.push(d);
  }
  const overdueRem = (ctx.reminders || []).filter((r) => {
    if (r.done) return false;
    if (r.kind === "km") return Number(r.odometer) < Number(ctx.car?.odometer || 0);
    if (r.date) return daysBetween(new Date(), toDate(r.date)) < 0;
    return false;
  });
  if (items.length || overdueRem.length) return { points: 3, max: 10, status: "danger", text: "في مواعيد متأخرة محتاجة اهتمام." };
  return { points: 10, max: 10, status: "good", text: "مفيش مواعيد متأخرة." };
}

export function careScore(ctx) {
  const maintenance = maintScore(ctx);
  const documents = docsScore(ctx);
  const tires = tireScore(ctx);
  const battery = batteryScore(ctx);
  const odometer = odoScore(ctx);
  const reminders = reminderScore(ctx);
  const total = maintenance.points + documents.points + tires.points + battery.points + odometer.points + reminders.points;
  let label = "في حاجات محتاجة اهتمام";
  let tone = "danger";
  if (total >= 90) {
    label = "ممتاز";
    tone = "good";
  } else if (total >= 75) {
    label = "جيد جدًا";
    tone = "ok";
  } else if (total >= 60) {
    label = "محتاج متابعة";
    tone = "warn";
  }
  return {
    total,
    max: 100,
    label,
    tone,
    headline: total >= 90 ? "متابعة ممتازة" : total >= 75 ? "متابعة جيدة جدًا" : total >= 60 ? "محتاج متابعة" : "في حاجات محتاجة اهتمام",
    parts: { maintenance, documents, tires, battery, odometer, reminders },
  };
}
