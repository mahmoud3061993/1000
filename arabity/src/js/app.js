import { MORE_ITEMS, NAV_ITEMS, QUICK_ADD } from "./constants.js";
import { db } from "./db.js";
import { icon } from "./icons.js";
import { maybeAskNotifications } from "./notifications.js";
import { go, register, render as renderRoute, start as startRouter, currentRoute, back } from "./router.js";
import { applyTheme, getSettings, loadSettings, saveSettings } from "./storage.js";
import { closeTop, hasOverlay, sheet, toast } from "./ui.js";
import { formatKm, html, isNative, nativePlugin, raw } from "./utils.js";
import { appState, refresh, setAfterRefresh, setQuickAdd, state } from "./session.js";
import { renderOnboarding } from "./modules/onboarding.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderCars } from "./modules/cars.js";
import { renderFuel } from "./modules/fuel.js";
import { renderMaintenance } from "./modules/maintenance.js";
import { renderRepairs } from "./modules/repairs.js";
import { renderExpenses } from "./modules/expenses.js";
import { renderDocuments } from "./modules/documents.js";
import { renderParts } from "./modules/parts.js";
import { renderTimeline } from "./modules/timeline.js";
import { renderReports, renderCost, renderMonthly, renderHistory, renderSnapshot } from "./modules/reports.js";
import { renderHealth } from "./modules/health.js";
import { renderWorkshops } from "./modules/workshops.js";
import { renderChecklist } from "./modules/checklist.js";
import { renderReminders } from "./modules/reminders.js";
import { renderSettings } from "./modules/settings.js";
import { renderPrivacy } from "./modules/privacy.js";
setAfterRefresh(async (rerender) => {
  paintShell();
  if (rerender && window.location.hash) await renderRoute();
});
setQuickAdd(openQuickAdd);

export function openQuickAdd() {
  const body = QUICK_ADD.map(
    (q) => `<button type="button" class="quick-item" data-q="${q.id}">
      <span class="quick-icon" style="background:${q.color}22;color:${q.color}">${icon(q.icon, 22)}</span>
      <span><strong>${q.title}</strong><div class="faint">${q.desc}</div></span>
    </button>`
  ).join("");
  const el = sheet({ title: "تسجيل جديد", body });
  el.querySelectorAll("[data-q]").forEach((btn) => {
    btn.onclick = () => {
      closeTop();
      const map = { fuel: "fuel", maintenance: "maintenance", repair: "repairs", expense: "expenses", document: "documents" };
      go(map[btn.dataset.q], { add: "1" });
    };
  });
}

function paintShell() {
  const app = document.getElementById("app");
  app.classList.remove("is-onboarding");
  const car = state.car;
  document.getElementById("sidebar").innerHTML = `
    <div class="brand-lockup">
      <div class="brand-mark">${icon("car", 22)}</div>
      <div><div class="brand-name">عربيتي</div><div class="brand-tag">كل حاجة تخص عربيتك</div></div>
    </div>
    ${NAV_ITEMS.map((n) => `<a class="nav-link" data-nav="${n.id}" href="#/${n.id}">${icon(n.icon, 20)}<span>${n.label}</span></a>`).join("")}
  `;
  document.getElementById("bottom-nav").innerHTML = `
    <button class="bottom-nav-btn" data-nav="dashboard" type="button">${icon("home")}<span>الرئيسية</span></button>
    <button class="bottom-nav-btn is-cta" data-nav="quick" type="button"><span class="cta-bubble">${icon("plus")}</span><span>تسجيل</span></button>
    <button class="bottom-nav-btn" data-nav="maintenance" type="button">${icon("wrench")}<span>الصيانة</span></button>
    <button class="bottom-nav-btn" data-nav="reports" type="button">${icon("chart")}<span>التقارير</span></button>
    <button class="bottom-nav-btn" data-nav="more" type="button">${icon("more")}<span>المزيد</span></button>
  `;
  document.getElementById("topbar").innerHTML = car
    ? `<button class="vehicle-switcher" type="button" data-switch>
        <div>
          <div class="vehicle-name">${escape(car.name)}</div>
          <div class="muted">${escape(String(car.year || ""))} · ${formatKm(car.odometer || 0)}</div>
        </div>
        ${icon("chevron", 18)}
      </button>`
    : "";
  highlightNav();
  document.querySelector("[data-switch]")?.addEventListener("click", switchCar);
  document.querySelectorAll("#sidebar [data-nav]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      go(a.dataset.nav);
    });
  });
  document.querySelectorAll("#bottom-nav [data-nav]").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.nav === "quick") openQuickAdd();
      else if (b.dataset.nav === "more") openMore();
      else go(b.dataset.nav);
    };
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function highlightNav() {
  const { name } = currentRoute();
  const bottomMap = { dashboard: "dashboard", maintenance: "maintenance", reports: "reports", cost: "reports", monthly: "reports", history: "reports", snapshot: "reports" };
  document.querySelectorAll("[data-nav]").forEach((el) => el.classList.toggle("is-active", el.dataset.nav === name));
  document.querySelectorAll("#bottom-nav [data-nav]").forEach((el) => {
    const key = el.dataset.nav;
    el.classList.toggle("is-active", key === (bottomMap[name] || (name === "dashboard" ? "dashboard" : "more")) && key !== "quick");
  });
}

function switchCar() {
  const body = state.cars
    .map(
      (c) => `<button class="list-card" type="button" data-car="${c.id}">
        <div><div class="list-title">${escape(c.name)} ${c.isDemo ? '<span class="badge badge-demo">تجريبي</span>' : ""}</div>
        <div class="faint">${escape(c.year || "")} · ${formatKm(c.odometer || 0)}</div></div>
      </button>`
    )
    .join("") + `<button class="btn btn-ghost btn-block" data-add-car type="button" style="margin-top:8px">إضافة عربية</button>`;
  const el = sheet({ title: "اختار العربية", body });
  el.querySelectorAll("[data-car]").forEach((b) => {
    b.onclick = async () => {
      closeTop();
      await saveSettings({ currentCarId: b.dataset.car });
      await refresh(true);
      toast("تم تغيير العربية");
    };
  });
  el.querySelector("[data-add-car]").onclick = () => {
    closeTop();
    go("cars", { add: "1" });
  };
}

function openMore() {
  const body = `<div class="more-grid">${MORE_ITEMS.map(
    (it) => `<button class="more-tile" type="button" data-m="${it.id}">${icon(it.icon, 22)}<strong>${it.label}</strong></button>`
  ).join("")}</div>`;
  const el = sheet({ title: "المزيد", body });
  el.querySelectorAll("[data-m]").forEach((b) => {
    b.onclick = () => {
      closeTop();
      go(b.dataset.m);
    };
  });
}

function registerRoutes() {
  register("dashboard", (root) => renderDashboard(root));
  register("cars", (root, p) => renderCars(root, p));
  register("fuel", (root, p) => renderFuel(root, p));
  register("maintenance", (root, p) => renderMaintenance(root, p));
  register("repairs", (root, p) => renderRepairs(root, p));
  register("expenses", (root, p) => renderExpenses(root, p));
  register("documents", (root, p) => renderDocuments(root, p));
  register("parts", (root) => renderParts(root));
  register("tires", (root) => renderParts(root, "tires"));
  register("battery", (root) => renderParts(root, "battery"));
  register("timeline", (root) => renderTimeline(root));
  register("health", (root) => renderHealth(root));
  register("reports", (root) => renderReports(root));
  register("cost", (root) => renderCost(root));
  register("monthly", (root) => renderMonthly(root));
  register("history", (root) => renderHistory(root));
  register("snapshot", (root) => renderSnapshot(root));
  register("workshops", (root) => renderWorkshops(root));
  register("checklist", (root) => renderChecklist(root));
  register("reminders", (root) => renderReminders(root));
  register("settings", (root) => renderSettings(root));
  register("privacy", (root) => renderPrivacy(root));
}

function bindNative() {
  const App = nativePlugin("App");
  App?.addListener?.("backButton", () => {
    if (hasOverlay()) {
      closeTop();
      return;
    }
    const { name } = currentRoute();
    if (name !== "dashboard") back();
    else App.exitApp?.();
  });
  nativePlugin("StatusBar")?.setBackgroundColor?.({ color: "#0A2540" });
}

function storageBlockedMessage() {
  return `<div class="empty-state"><h3>المتصفح منع حفظ البيانات من الملف المحلي</h3>
    <p class="muted">افتح الملف في Google Chrome أو Microsoft Edge. Firefox أحيانًا بيمنع التخزين لما الملف يتفتح من الجهاز مباشرة.</p>
    <p class="faint">سيب الملف في نفس المجلد بعد ما تبدأ تسجّل بيانات، عشان السجلات تفضل موجودة.</p></div>`;
}

export async function boot() {
  document.documentElement.dataset.arabityReady = "1";
  applyTheme(localStorage.getItem("arabity-theme") || "system");
  if (!window.indexedDB) {
    document.getElementById("app-main").innerHTML = storageBlockedMessage();
    return;
  }
  try {
    await db.ready();
  } catch (err) {
    console.error(err);
    document.getElementById("app-main").innerHTML = storageBlockedMessage();
    return;
  }
  await loadSettings();
  applyTheme(getSettings().theme);
  registerRoutes();
  const cars = await db.getAll("cars");
  if (!cars.length) {
    document.getElementById("app").classList.add("is-onboarding");
    await renderOnboarding(document.getElementById("app-main"), async () => {
      await refresh(false);
      paintShell();
      startRouter();
      window.addEventListener("hashchange", highlightNav);
      bindNative();
      go("dashboard");
      toast("تمام. عربيتك اتضافت.");
      setTimeout(() => maybeAskNotifications(), 1200);
    });
    return;
  }
  await refresh(false);
  paintShell();
  startRouter();
  window.addEventListener("hashchange", highlightNav);
  bindNative();
  setTimeout(() => maybeAskNotifications(), 2500);
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.dataset.arabityReady = "1";
  document.getElementById("app-main").innerHTML = `<div class="empty-state"><h3>حصلت مشكلة أثناء فتح التطبيق</h3><p class="muted">بياناتك الحالية لسه موجودة، حدّث الصفحة وجرب تاني.</p></div>`;
});

void html;
void raw;
void isNative;
void NAV_ITEMS;
