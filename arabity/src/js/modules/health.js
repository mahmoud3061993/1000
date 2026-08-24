import { careScore } from "../scoring.js";
import { scoreRing } from "../charts.js";
import { buildInsights } from "../insights.js";
import { appState } from "../session.js";
import { go } from "../router.js";
import { currency } from "../storage.js";
import { badgeFor, pageTitle } from "../ui.js";

export async function renderHealth(root) {
  const { ctx, car } = appState();
  if (!car) return go("cars");
  const score = careScore(ctx);
  const insights = buildInsights(ctx, currency());
  const parts = [
    ["maintenance", "الصيانة", score.parts.maintenance],
    ["documents", "المستندات", score.parts.documents],
    ["tires", "الكاوتش", score.parts.tires],
    ["battery", "البطارية", score.parts.battery],
    ["reminders", "المواعيد", score.parts.reminders],
  ];
  root.innerHTML = `${pageTitle("حالة عربيتي", "دي درجة متابعة الصيانة والأوراق — مش تشخيص ميكانيكي.")}
    <section class="card" style="text-align:center">
      <div id="ring"></div>
      <h2>${esc(score.headline)}</h2>
      <p class="muted">${score.total} من 100 — ${esc(score.label)}</p>
    </section>
    <div class="stack">
      ${parts
        .map(
          ([, label, p]) => `<article class="list-card">
          <div><div class="list-title">${label}</div><p class="muted">${esc(p.text)}</p></div>
          ${badgeFor({ id: p.status, label: statusLabel(p.status) })}
        </article>`
        )
        .join("")}
    </div>
    <section class="insight-card">
      <div class="section-title">ملاحظات من بياناتك</div>
      ${insights.map((i) => `<p>${esc(i.text)}${i.action ? `<div class="muted">${esc(i.action)}</div>` : ""}</p>`).join("") || `<p class="muted">كل ما تسجّل أكتر، الملاحظات هتبقى أوضح.</p>`}
    </section>`;
  scoreRing(root.querySelector("#ring"), score.total, score.headline);
}

function statusLabel(id) {
  return { good: "تمام", ok: "كويس", warn: "محتاج متابعة", danger: "محتاج اهتمام" }[id] || id;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
