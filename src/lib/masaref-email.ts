import {
  MASAREF_APK_URL,
  MASAREF_APK_ZIP_URL,
  MASAREF_FILES_URL,
  MASAREF_HTML_ZIP_URL,
  MASAREF_HOWTO_URL,
  MASAREF_SYSTEM_URL,
} from "./config";

export const MASAREF_PURCHASE_EMAIL_SUBJECT = "🎉 تم تأكيد طلبك - مصارف جاهز للاستخدام";
export { MASAREF_SYSTEM_URL, MASAREF_FILES_URL, MASAREF_HTML_ZIP_URL, MASAREF_APK_URL };

function driveFolderForEmail(deliveryUrl: string) {
  const url = deliveryUrl.trim();
  if (/drive\.google\.com/i.test(url)) return url;
  return url || MASAREF_FILES_URL;
}

export function buildMasarefPurchaseEmail(input: {
  name?: string;
  deliveryUrl: string;
  whatsappDisplay: string;
}) {
  const driveUrl = driveFolderForEmail(input.deliveryUrl);
  const whatsapp = input.whatsappDisplay || "01017420379";

  const text = `أهلًا بيك 👋
مبروك! 🎉
تم تأكيد طلبك بنجاح، ودلوقتي تقدر تبدأ تستخدم مصارف — سيستم السيطرة على المصروفات.

📂 صفحة تحميل الملفات:

${driveUrl}

حمّل الملفات مباشرة:

✅ السيستم للكمبيوتر (ZIP)
${MASAREF_HTML_ZIP_URL}
فك الضغط وافتح index.html. لو الصفحة بيضاء، شغّل open-on-windows.bat أو open-on-mac.command من داخل المجلد. البيانات بتتحفظ على الجهاز، ومش محتاج نت بعد التحميل.

✅ تطبيق أندرويد (APK)
${MASAREF_APK_URL}
ثبّته يدويًا على الموبايل (مش من Google Play). لو المتصفح منع التحميل استخدم النسخة المضغوطة:
${MASAREF_APK_ZIP_URL}

✅ الدليل
${MASAREF_HOWTO_URL}

🎨 هتلاقي إيه جوه السيستم؟

✅ الحد اليومي
مش ميزانية آخر الشهر. رقم واضح: مسموحلك تصرف كام النهاردة.

✅ فلوسي هتخلص إمتى
لو كملت بنفس معدل صرفك، السيستم يقولك الفلوس هتخلص يوم كام — قبل ما تتزنق.

✅ ينفع أشتريها؟
قبل ما تشتري بحاجة كبيرة، السيستم يقولك هينزل الحد اليومي لكام، أو إن الشراء هيعدّي الميزانية.

✅ أكتر 3 حاجات بتاكل فلوسك + تنبيهات
من غير AI ومن غير اشتراك. قواعد بسيطة بتنبّهك لو الأكل أو الخروجات سبقوا الشهر.

✅ No-Spend Days
ستريك ومقارنة الأسبوع باللي فات عشان تحس بمكسب، مش إنك بتعمل bookkeeping.

💡 أفضل طريقة تبدأ بيها:

افتح صفحة الملفات اللي فوق.
نزّل ZIP السيستم على الكمبيوتر، أو ثبّت الأندرويد على الموبايل.
في الشاشة الأولى تقدر تجرّب مثال توضيحي بمرتب 15,000 وبعدين تمسحه من الإعدادات.

⚠️ نصيحة مهمة:
مصارف مش اشتراك ومش تطبيق محاسب. القيمة إنه يمسك إيدك يوم 8 في الشهر، مش يوم 30 بعد ما الفلوس تروح.

ملف الموبايل لأندرويد فقط. على آيفون استخدم ملف السيستم HTML على الكمبيوتر.

💬 ولو واجهتك أي مشكلة في الوصول للينك أو الملفات أو التثبيت، تواصل معايا مباشرة على واتساب:

${whatsapp}

أتمنى مصارف يخلّيك تعرف فلوسك بتروح فين... قبل ما تخلص. 🤍

بالتوفيق،
محمود القوصي`;

  const htmlBody = escapeHtml(text)
    .replaceAll("\n\n", "</p><p>")
    .replaceAll("\n", "<br/>");

  const links = [driveUrl, MASAREF_HTML_ZIP_URL, MASAREF_APK_URL, MASAREF_APK_ZIP_URL, MASAREF_HOWTO_URL];
  let htmlLinked = htmlBody;
  for (const url of links) {
    htmlLinked = htmlLinked.replaceAll(
      escapeHtml(url),
      `<a href="${escapeHtml(url)}" style="color:#0F766E;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`
    );
  }

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:24px;background:#F6F3EC;">
    <div style="max-width:640px;margin:0 auto;background:#FFFcf7;border-radius:18px;padding:28px;font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#1C1917;font-size:16px;">
      <p>${htmlLinked}</p>
    </div>
  </body>
</html>`;

  return {
    subject: MASAREF_PURCHASE_EMAIL_SUBJECT,
    text,
    html,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
