import { APP_NAME } from "./constants.js";
import { getState, loadStore, onChange } from "./store.js";
import { go, register, start, currentRoute } from "./router.js";
import { closeTop, hasOverlay } from "./ui.js";
import { html } from "./utils.js";
import { renderOnboarding, bindOnboarding } from "./modules/onboarding.js";
import { renderDashboard, bindDashboard } from "./modules/dashboard.js";
import { renderAdd, bindAdd } from "./modules/add.js";
import { renderDecide, bindDecide } from "./modules/decide.js";
import { renderExpenses, bindExpenses } from "./modules/expenses.js";
import { renderPlay, bindPlay } from "./modules/play.js";
import { renderSettings, bindSettings } from "./modules/settings.js";

function paintShell(onboarding) {
  const app = document.getElementById("app");
  app.classList.toggle("is-onboarding", onboarding);
  document.getElementById("bottom-nav").innerHTML = onboarding
    ? ""
    : html`<button class="bottom-nav-btn" data-nav="dashboard" type="button"><span>الرئيسية</span></button>
        <button class="bottom-nav-btn is-cta" data-nav="add" type="button"><span class="cta-bubble">+</span><span>تسجيل</span></button>
        <button class="bottom-nav-btn" data-nav="decide" type="button"><span>ينفع؟</span></button>
        <button class="bottom-nav-btn" data-nav="expenses" type="button"><span>فلوسي</span></button>
        <button class="bottom-nav-btn" data-nav="more" type="button"><span>المزيد</span></button>`;
  document.getElementById("bottom-nav").querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.nav === "more") go("settings");
      else go(btn.dataset.nav);
    });
  });
}

function wrap(renderFn, bindFn) {
  return async (params) => {
    const htmlOut = renderFn(params);
    return {
      html: htmlOut,
      bind: () => bindFn?.(params),
    };
  };
}

register("onboarding", wrap(renderOnboarding, bindOnboarding));
register("dashboard", wrap(renderDashboard, bindDashboard));
register("add", wrap(renderAdd, bindAdd));
register("decide", wrap(renderDecide, bindDecide));
register("expenses", wrap(renderExpenses, bindExpenses));
register("play", wrap(renderPlay, bindPlay));
register("settings", wrap(renderSettings, bindSettings));

async function boot() {
  loadStore();
  onChange((state) => paintShell(!state.setup));
  const bootScreen = document.getElementById("boot-screen");
  const ready = () => {
    document.documentElement.dataset.masarefReady = "1";
    bootScreen?.remove();
  };

  if (!getState().setup) {
    paintShell(true);
    location.hash = "#/onboarding";
    start();
    ready();
    return;
  }

  paintShell(false);
  if (!location.hash || location.hash === "#/onboarding") location.hash = "#/dashboard";
  start();
  ready();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && hasOverlay()) closeTop();
});

boot().catch((err) => {
  console.error(err);
  const boot = document.getElementById("boot-screen");
  if (boot) boot.innerHTML = `<h1>${APP_NAME}</h1><p>حصلت مشكلة أثناء التحميل. حدّث الصفحة.</p>`;
});

export { currentRoute };
