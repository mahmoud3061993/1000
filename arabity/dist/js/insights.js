import {
  categoryBreakdown,
  collectCosts,
  documentStatus,
  fullToFullConsumption,
  latestByType,
  monthCompare,
  nextMaintenance,
  recentConsumptionShift,
  trackedKm,
} from "./calculations.js";
import { addMonths, formatKm, formatMoney, formatNumber, pctChange } from "./utils.js";

export function buildInsights(ctx, symbol) {
  const out = [];
  const cmp = monthCompare(ctx);
  if (cmp.previous.total > 0 && cmp.change != null) {
    const dir = cmp.change > 0 ? "زادت" : "قلت";
    out.push({
      id: "month-change",
      priority: Math.abs(cmp.change) >= 8 ? 90 : 40,
      text: `مصاريف عربيتك ${dir} ${formatNumber(Math.abs(cmp.change), 1)}% عن الشهر اللي فات.`,
    });
  } else if (cmp.current.total > 0 && cmp.previous.total === 0) {
    out.push({
      id: "first-month",
      priority: 50,
      text: `أول شهر متسجل: عربيتك كلفتك ${formatMoney(cmp.current.total, symbol)}.`,
    });
  }

  const top = categoryBreakdown(cmp.current)[0];
  if (top && top.value > 0) {
    out.push({
      id: "top-cat",
      priority: 80,
      text: `أعلى بند صرف الشهر ده هو ${top.label} — ${formatMoney(top.value, symbol)}${cmp.current.total ? ` (${formatNumber(top.pct, 1)}%).` : "."}`,
    });
  }

  const biggest = [...cmp.current.maintRows, ...cmp.current.repairRows, ...cmp.current.expRows, ...cmp.current.fuelRows]
    .sort((a, b) => b.amount - a.amount)[0];
  if (biggest && biggest.amount >= 1000) {
    const title = biggest.problem || biggest.title || (biggest.liters ? "تفويلة" : "مصروف");
    out.push({
      id: "biggest",
      priority: 55,
      text: `أعلى مصروف سجلته الشهر ده كان ${title} بـ ${formatMoney(biggest.amount, symbol)}.`,
    });
  }

  for (const rec of latestByType(ctx.maintenance)) {
    const n = nextMaintenance(rec, ctx.car);
    if (!n) continue;
    if (n.remainKm != null && n.remainKm <= 1500) {
      out.push({
        id: `m-${rec.id}`,
        priority: n.status.id === "overdue" ? 95 : 70,
        text:
          n.remainKm < 0
            ? `${n.label} اتأخر عن الميعاد بـ ${formatKm(Math.abs(n.remainKm))}.`
            : `فاضل ${formatKm(n.remainKm)} على ${n.label}.`,
      });
    }
  }

  for (const doc of ctx.documents) {
    const st = documentStatus(doc);
    if (st.days != null && st.days <= 45) {
      const name = doc.title || "المستند";
      out.push({
        id: `d-${doc.id}`,
        priority: st.id === "expired" ? 96 : 75,
        text:
          st.days < 0
            ? `${name} خلصت من ${Math.abs(st.days)} يوم.`
            : `${name} هتنتهي خلال ${st.days} يوم.`,
      });
    }
  }

  const cons = fullToFullConsumption(ctx.fuel);
  const shift = recentConsumptionShift(cons.samples);
  if (shift?.up) {
    out.push({
      id: "fuel-up",
      priority: 72,
      text: "متوسط استهلاك الوقود أعلى من متوسطك المعتاد.",
      action: "راجع ضغط الكاوتش وطريقة القيادة، ولو الزيادة مستمرة ممكن تراجع مركز صيانة.",
    });
  } else if (cons.samples.length >= 1 && cons.samples.length < 2) {
    out.push({
      id: "fuel-need",
      priority: 30,
      text: "محتاجين تفويلتين كاملتين على الأقل عشان نحسب الاستهلاك بدقة.",
    });
  }

  const last30from = new Date(Date.now() - 29 * 86400000);
  const last30 = collectCosts(ctx, last30from, new Date());
  const km = trackedKm(ctx, last30from, new Date());
  if (last30.total > 0) {
    out.push({
      id: "daily30",
      priority: 45,
      text: `متوسط تكلفة العربية اليومية خلال آخر 30 يوم هو ${formatMoney(last30.total / 30, symbol)}.`,
    });
  }
  if (km.km > 0 && last30.total > 0) {
    out.push({
      id: "km30",
      priority: 35,
      text: `تكلفة الكيلومتر خلال آخر 30 يوم حوالي ${formatMoney(last30.total / km.km, symbol)}.`,
    });
  }

  const now = new Date();
  const last3 = collectCosts(ctx, addMonths(now, -3), now);
  const prev3 = collectCosts(ctx, addMonths(now, -6), addMonths(now, -3));
  const repairChange = pctChange(last3.repairTotal, prev3.repairTotal);
  if (prev3.repairTotal > 0 && repairChange != null && repairChange >= 15) {
    out.push({
      id: "repairs3",
      priority: 68,
      text: "مصاريف الإصلاحات آخر 3 شهور أعلى من الـ3 شهور اللي قبلهم.",
    });
  }

  const uniq = [];
  const seen = new Set();
  for (const item of out.sort((a, b) => b.priority - a.priority)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    uniq.push(item);
  }
  return uniq.slice(0, 3);
}

export function milestoneMessages(ctx, symbol, seenIds = new Set()) {
  const all = collectCosts(ctx, null, new Date());
  const msgs = [];
  const steps = [10000, 25000, 50000, 100000, 250000];
  for (const step of steps) {
    const id = `total-${step}`;
    if (all.total >= step && !seenIds.has(id)) {
      msgs.push({ id, text: `إجمالي اللي صرفته على العربية من بداية التسجيل وصل لـ ${formatMoney(step, symbol)}.` });
    }
    const fid = `fuel-${step}`;
    if (all.fuelTotal >= step && !seenIds.has(fid)) {
      msgs.push({ id: fid, text: `إجمالي البنزين المسجل وصل لـ ${formatMoney(step, symbol)}.` });
    }
  }
  return msgs;
}
