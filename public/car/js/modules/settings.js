import { db } from "../db.js";
import { exportBackup, importBackup, pickBackupFile, warnImport } from "../backup.js";
import { loadDemoData, demoExists } from "../demo.js";
import { appState, refresh } from "../session.js";
import { applyTheme, getSettings, saveSettings } from "../storage.js";
import { closeTop, confirmDialog, field, pageTitle, toast } from "../ui.js";
import { go } from "../router.js";
import { icon } from "../icons.js";
import { androidApkUrl, isNative, isOfflineHtml, offlineHtmlUrl } from "../utils.js";

export async function renderSettings(root) {
  const s = getSettings();
  root.innerHTML = `${pageTitle("الإعدادات")}
    <section class="card stack">
      ${field({ id: "currencySymbol", label: "العملة", value: s.currencySymbol })}
      ${field({ id: "fuelUnit", label: "وحدة الاستهلاك", options: [
        { id: "km_l", label: "كم / لتر" },
        { id: "l_100", label: "لتر / 100 كم" },
      ], value: s.fuelUnit })}
      ${field({ id: "theme", label: "المظهر", options: [
        { id: "light", label: "فاتح" },
        { id: "dark", label: "داكن" },
        { id: "system", label: "حسب الجهاز" },
      ], value: s.theme })}
      <label class="check-item"><input type="checkbox" id="hidePrivateNotes" ${s.hidePrivateNotes ? "checked" : ""}/> إخفاء الملاحظات الخاصة في تقارير الطباعة</label>
      <button class="btn btn-primary" id="save">حفظ الإعدادات</button>
    </section>
    <section class="card stack">
      <h3>النسخ الاحتياطي</h3>
      <p class="muted">انقل بياناتك بين اللابتوب والموبايل يدويًا بملف JSON.</p>
      <button class="btn btn-accent" id="export">${icon("download", 18)} تصدير نسخة احتياطية</button>
      <button class="btn btn-ghost" id="imp">${icon("upload", 18)} استيراد نسخة احتياطية</button>
    </section>
    <section class="card stack">
      <h3>بيانات تجريبية</h3>
      <p class="muted">Kia Cerato 2021 ببيانات واقعية. مش هتتمسح بياناتك الحقيقية.</p>
      <button class="btn btn-ghost" id="demo">جرب بيانات تجريبية</button>
      <button class="btn btn-ghost" id="deldemo">حذف البيانات التجريبية</button>
    </section>
    <section class="card stack">
      <h3>تطبيق أندرويد</h3>
      ${
        isNative()
          ? `<p class="muted">أنت دلوقتي على تطبيق الموبايل. البيانات بتتحفظ على الجهاز، ومش محتاج إنترنت بعد التثبيت.</p>`
          : `<p class="muted">APK تتثبّته بنفسك من غير Play Store. بعد التثبيت التطبيق يشتغل أوفلاين.</p>
             <a class="btn btn-accent" href="${androidApkUrl()}" download="عربيتي.apk">${icon("download", 18)} تحميل عربيتي للأندرويد</a>
             <p class="faint">من إعدادات الموبايل فعّل تثبيت التطبيقات من مصادر غير معروفة، افتح الملف، ودوس تثبيت.</p>`
      }
    </section>
    <section class="card stack">
      <h3>نسخة أوفلاين</h3>
      ${
        isOfflineHtml()
          ? `<p class="muted">أنت دلوقتي بتستخدم ملف عربيتي الأوفلاين. انسخ الملف ده لأي مجلد وافتحه من Chrome أو Edge من غير نت.</p>
             <p class="faint">سيب الملف في نفس المكان عشان بياناتك تفضل موجودة. لو نقلته، ممكن المتصفح يعتبره تطبيق جديد.</p>`
          : `<p class="muted">ملف HTML واحد فيه التطبيق كله. حمّله وافتحه من جهازك من غير إنترنت.</p>
             <a class="btn btn-accent" id="offline-dl" href="${offlineHtmlUrl()}" download="عربيتي.html">${icon("download", 18)} تحميل ملف عربيتي</a>`
      }
    </section>
    <section class="card stack">
      <button class="btn btn-ghost" id="privacy">الخصوصية</button>
      <button class="btn btn-danger" id="reset">إعادة ضبط التطبيق</button>
    </section>`;
  root.querySelector("#save").onclick = async () => {
    await saveSettings({
      currencySymbol: document.getElementById("currencySymbol").value.trim() || "جنيه",
      fuelUnit: document.getElementById("fuelUnit").value,
      theme: document.getElementById("theme").value,
      hidePrivateNotes: document.getElementById("hidePrivateNotes").checked,
    });
    applyTheme(getSettings().theme);
    toast("تم تحديث البيانات");
    await refresh(true);
  };
  root.querySelector("#export").onclick = () => exportBackup();
  root.querySelector("#imp").onclick = () => {
    warnImport(async (mode) => {
      try {
        const text = await pickBackupFile();
        await importBackup(text, mode);
        toast("تم استيراد البيانات بنجاح");
        await refresh(true);
        go("dashboard");
      } catch (err) {
        if (String(err.message) === "invalid") toast("الملف مش JSON صالح.", { type: "danger" });
        else toast(err.message || "النسخة الاحتياطية غير صالحة.", { type: "danger" });
      }
    });
  };
  root.querySelector("#demo").onclick = async () => {
    if (await demoExists()) {
      toast("البيانات التجريبية موجودة بالفعل");
      return;
    }
    const car = await loadDemoData();
    await saveSettings({ currentCarId: car.id, demoLoaded: true });
    toast("اتضافت عربية تجريبية — بياناتك الحقيقية زي ما هي");
    await refresh(true);
    go("dashboard");
  };
  root.querySelector("#deldemo").onclick = async () => {
    if (!(await confirmDialog({ title: "حذف التجريبي؟", message: "هتتمسح العربية التجريبية وسجلاتها فقط.", confirmLabel: "حذف التجريبي", danger: true }))) return;
    await db.deleteDemo();
    toast("تم حذف البيانات التجريبية");
    await refresh(true);
    const { cars } = appState();
    if (!cars.length) window.location.reload();
    else go("dashboard");
  };
  root.querySelector("#privacy").onclick = () => go("privacy");
  root.querySelector("#reset").onclick = async () => {
    if (!(await confirmDialog({ title: "إعادة ضبط التطبيق؟", message: "كل البيانات على الجهاز هتتمسح نهائي. خد نسخة احتياطية الأول لو محتاجها.", confirmLabel: "اكتب تأكيد", danger: true }))) return;
    const ok = await confirmDialog({
      title: "تأكيد أخير",
      message: "متأكد إنك عايز تمسح كل حاجة؟ العملية دي مينفعش تتراجع.",
      confirmLabel: "مسح كل البيانات",
      danger: true,
    });
    if (!ok) return;
    await db.reset();
    localStorage.removeItem("arabity-theme");
    localStorage.removeItem("arabity-current-car");
    toast("تم إعادة الضبط");
    window.location.reload();
  };
  void closeTop;
}

export async function renderPrivacy(root) {
  root.innerHTML = `${pageTitle("الخصوصية")}
    <section class="hero-card"><div class="hero-label">عربيتي</div><div class="hero-value" style="font-size:1.6rem">بيانات عربيتك ملكك إنت.</div></section>
    <section class="card stack">
      <p>كل البيانات محفوظة على جهازك، ومش بيتم إرسالها لأي سيرفر أو خدمة خارجية.</p>
      <p>مفيش حساب، مفيش تسجيل دخول، مفيش سحابة، مفيش تتبع، ومفيش تحليلات.</p>
      <p class="muted">النسخ الاحتياطي ملف بتعمله إنت وتنقله بإيدك بين اللابتوب والموبايل.</p>
    </section>
    <button class="btn btn-ghost" id="back">رجوع للإعدادات</button>`;
  root.querySelector("#back").onclick = () => go("settings");
}
