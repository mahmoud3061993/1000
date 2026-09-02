import { MASAREF_SYSTEM_URL } from "./config";

export const MASAREF_PURCHASE_EMAIL_SUBJECT = "🎉 تم تأكيد طلبك - مصارف جاهز للاستخدام";
export { MASAREF_SYSTEM_URL };

function driveFolderForEmail(deliveryUrl: string) {
  const url = deliveryUrl.trim();
  if (/drive\.google\.com/i.test(url)) return url;
  return url || MASAREF_SYSTEM_URL;
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

📂 رابط فولدر الملفات:

${driveUrl}

هتلاقي جوه الفولدر 3 ملفات في مكان واحد:

✅ ملف السيستم للكمبيوتر (HTML)
نزّله على جهازك وافتحه. أول شاشة هتطلب الدخل والالتزامات، وبعدين السيستم يحسبلك مسموحلك تصرف كام النهارده. البيانات بتتحفظ على الجهاز، ومش محتاج نت بعد التحميل. مفيش تسجيل دخول ولا اشتراك شهري.

✅ ملف الدليل (HTML)
نزّله وافتحه على اللاب. فيه شرح إزاي تثبّت تطبيق الموبايل، وإزاي تستخدم الحد اليومي و«ينفع أشتريها؟» من الأول للآخر.

✅ نسخة الموبايل (APK)
نفس السيستم على أندرويد. ثبّته يدويًا على الموبايل (مش من Google Play) وافتحه من أيقونة «مصارف».

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

افتح فولدر الدرايف اللي فوق.
ابدأ بملف الدليل لو حابب تفهم التثبيت.
لو عايز تستخدمه على الكمبيوتر: نزّل ملف HTML وافتحه واملأ الدخل والالتزامات.
لو عايزه على الموبايل: ثبّت ملف الأندرويد.
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

  const htmlLinked = htmlBody.replaceAll(
    escapeHtml(driveUrl),
    `<a href="${escapeHtml(driveUrl)}" style="color:#0F766E;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(driveUrl)}</a>`
  );

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
