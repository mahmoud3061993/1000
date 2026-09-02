import { setupTotals } from "../calc.js";
import { exportBackup, getState, importBackup, resetAll, saveSetup } from "../store.js";
import { go } from "../router.js";
import { toast } from "../ui.js";
import { formatMoney, html, qs } from "../utils.js";

export function renderSettings() {
  const { setup } = getState();
  const tot = setupTotals(setup || {});
  return html`<section class="page">
    <header class="page-head">
      <h1>الإعدادات</h1>
      <p>عدّل الدخل والالتزامات. البيانات بتفضل على جهازك.</p>
    </header>
    <form id="edit-setup" class="setup-form">
      <label>الدخل الشهري<input name="income" type="number" min="0" value="${setup?.income ?? ""}" required /></label>
      <label>الإيجار / القسط<input name="rent" type="number" min="0" value="${setup?.rent ?? ""}" /></label>
      <label>فواتير<input name="bills" type="number" min="0" value="${setup?.bills ?? ""}" /></label>
      <label>ديون<input name="debts" type="number" min="0" value="${setup?.debts ?? ""}" /></label>
      <label>هدف التوفير<input name="savingsGoal" type="number" min="0" value="${setup?.savingsGoal ?? ""}" /></label>
      <label>يوم الراتب<input name="payday" type="number" min="1" max="28" value="${setup?.payday ?? 1}" /></label>
      <div class="live-box">
        <small>المتاح للصرف</small>
        <b>${formatMoney(tot.available)}</b>
      </div>
      <button class="btn" type="submit">حفظ</button>
    </form>
    <section class="panel">
      <h2>نسخة احتياطية</h2>
      <p class="muted">انقل بياناتك بين الموبايل واللابتوب بملف JSON.</p>
      <div class="btn-row">
        <button class="ghost" type="button" id="export-btn">تصدير</button>
        <label class="ghost file-btn">استيراد<input type="file" id="import-file" accept="application/json" hidden /></label>
      </div>
    </section>
    <button class="text-btn danger-text" type="button" id="reset-btn">مسح كل البيانات والبدء من جديد</button>
  </section>`;
}

export function bindSettings() {
  qs("#edit-setup")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    saveSetup(data);
    toast("اتحفظت الأرقام");
    go("dashboard");
  });
  qs("#export-btn")?.addEventListener("click", () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `masaref-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast("اتنزّلت النسخة");
  });
  qs("#import-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importBackup(text, "replace");
    toast("اتستوردت البيانات");
    go("dashboard");
  });
  qs("#reset-btn")?.addEventListener("click", () => {
    if (!confirm("هتمسح الدخل والمصروفات من الجهاز ده؟")) return;
    resetAll();
    toast("اتمسحت البيانات");
    go("onboarding");
  });
}
