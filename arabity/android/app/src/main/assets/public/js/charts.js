import { formatMoney, formatNumber } from "./utils.js";

function niceMax(n) {
  if (n <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(n));
  const m = n / p;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * p;
}

export function barChart(el, series, { currency = "جنيه", height = 180 } = {}) {
  const w = 320;
  const h = height;
  const pad = { t: 16, r: 8, b: 36, l: 8 };
  const max = niceMax(Math.max(0, ...series.map((s) => s.total || s.value || 0)));
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const bw = series.length ? (innerW / series.length) * 0.62 : 0;
  const gap = series.length ? (innerW / series.length) * 0.38 : 0;
  const bars = series
    .map((s, i) => {
      const v = s.total ?? s.value ?? 0;
      const bh = max ? (v / max) * innerH : 0;
      const x = pad.l + i * (bw + gap) + gap / 2;
      const y = pad.t + innerH - bh;
      return `<g class="bar" data-i="${i}" data-v="${v}">
        <rect x="${x}" y="${y}" width="${bw}" height="${Math.max(bh, 1)}" rx="6" fill="var(--chart-2)"/>
        <text x="${x + bw / 2}" y="${h - 12}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${escape(s.label || "")}</text>
      </g>`;
    })
    .join("");
  el.innerHTML = `<div class="chart-box" style="position:relative">
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="رسم بياني">${bars}</svg>
    <div class="chart-tooltip" hidden></div>
  </div>`;
  const tip = el.querySelector(".chart-tooltip");
  el.querySelectorAll(".bar").forEach((g, i) => {
    const show = (ev) => {
      const s = series[i];
      tip.hidden = false;
      tip.textContent = `${s.label}: ${formatMoney(s.total ?? s.value ?? 0, currency)}`;
      const r = el.getBoundingClientRect();
      tip.style.left = `${(ev.clientX || r.left + 40) - r.left}px`;
      tip.style.top = `8px`;
    };
    g.addEventListener("pointerenter", show);
    g.addEventListener("pointermove", show);
    g.addEventListener("pointerleave", () => {
      tip.hidden = true;
    });
    g.addEventListener("click", show);
  });
}

export function donutChart(el, items, { currency = "جنيه" } = {}) {
  const size = 180;
  const r = 64;
  const c = 2 * Math.PI * r;
  const total = items.reduce((a, x) => a + (x.value || 0), 0) || 1;
  let offset = 0;
  const colors = ["var(--chart-2)", "var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const rings = items
    .map((it, i) => {
      const len = ((it.value || 0) / total) * c;
      const dash = `${len} ${c - len}`;
      const node = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="18" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)"/>`;
      offset += len;
      return node;
    })
    .join("");
  const legend = items
    .map(
      (it, i) =>
        `<div class="row" style="justify-content:space-between"><span class="row"><span class="dot" style="background:${colors[i % colors.length]}"></span>${escape(it.label)}</span><strong>${formatNumber(it.pct || 0, 0)}%</strong></div>`
    )
    .join("");
  el.innerHTML = `<div style="display:grid;gap:12px;place-items:center">
    <svg viewBox="0 0 180 180" width="${size}" height="${size}">${rings}
      <text x="90" y="86" text-anchor="middle" font-size="12" fill="var(--text-muted)">الإجمالي</text>
      <text x="90" y="108" text-anchor="middle" font-size="14" font-weight="800" fill="var(--text)">${escape(formatMoney(items.reduce((a, x) => a + (x.value || 0), 0), currency))}</text>
    </svg>
    <div class="stack" style="width:100%">${legend}</div>
  </div>`;
}

export function lineChart(el, points, { height = 170, unit = "" } = {}) {
  const w = 320;
  const h = height;
  const pad = { t: 16, r: 12, b: 28, l: 12 };
  const ys = points.map((p) => p.value || 0);
  const max = niceMax(Math.max(0, ...ys));
  const min = 0;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const coords = points.map((p, i) => {
    const x = pad.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.t + innerH - ((p.value - min) / (max - min || 1)) * innerH;
    return { x, y, ...p };
  });
  const d = coords.map((c, i) => `${i ? "L" : "M"}${c.x},${c.y}`).join(" ");
  const dots = coords
    .map(
      (c, i) =>
        `<circle class="pt" data-i="${i}" cx="${c.x}" cy="${c.y}" r="4" fill="var(--chart-1)"/>`
    )
    .join("");
  el.innerHTML = `<div class="chart-box" style="position:relative">
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">
      <path d="${d}" fill="none" stroke="var(--chart-2)" stroke-width="2.5"/>
      ${dots}
    </svg>
    <div class="chart-tooltip" hidden></div>
  </div>`;
  const tip = el.querySelector(".chart-tooltip");
  el.querySelectorAll(".pt").forEach((pt, i) => {
    pt.addEventListener("pointerenter", () => {
      tip.hidden = false;
      tip.textContent = `${points[i].label}: ${formatNumber(points[i].value, 2)} ${unit}`;
    });
    pt.addEventListener("pointerleave", () => {
      tip.hidden = true;
    });
  });
}

export function scoreRing(el, score, label) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  el.innerHTML = `<svg class="score-ring" viewBox="0 0 180 180" role="img" aria-label="درجة المتابعة ${score} من 100">
    <circle cx="90" cy="90" r="${r}" fill="none" stroke="var(--bg-elev)" stroke-width="14"/>
    <circle cx="90" cy="90" r="${r}" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 90 90)"/>
    <text x="90" y="84" text-anchor="middle" font-size="32" font-weight="800" fill="var(--text)">${score}</text>
    <text x="90" y="108" text-anchor="middle" font-size="12" fill="var(--text-muted)">/ 100</text>
    <text x="90" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent)">${escape(label)}</text>
  </svg>`;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

export function emptyChart(el, text) {
  el.innerHTML = `<div class="empty-state" style="box-shadow:none;padding:24px"><p class="muted">${escape(text)}</p></div>`;
}
