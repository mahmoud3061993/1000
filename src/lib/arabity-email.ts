import { ARABITY_DRIVE_URL, ARABITY_SYSTEM_URL } from "./config";

export const ARABITY_PURCHASE_EMAIL_SUBJECT = "🎉 تم تأكيد طلبك - عربيتي جاهز للاستخدام";
export { ARABITY_DRIVE_URL, ARABITY_SYSTEM_URL };

function driveFolderForEmail(deliveryUrl: string) {
  const url = deliveryUrl.trim();
  if (/drive\.google\.com/i.test(url)) return url;
  return ARABITY_DRIVE_URL;
}

export function buildArabityPurchaseEmail(input: {
  name?: string;
  deliveryUrl: string;
  whatsappDisplay: string;
}) {
  const driveUrl = driveFolderForEmail(input.deliveryUrl);
  const whatsapp = input.whatsappDisplay || "01017420379";

  const text = `أهلًا بيك 👋
مبروك! 🎉
تم تأكيد طلبك بنجاح، ودلوقتي تقدر تبدأ تستخدم عربيتي.

📂 رابط فولدر الملفات على Google Drive:

${driveUrl}

هتلاقي جوه الفولدر 3 ملفات في مكان واحد:

✅ ملف السيستم للكمبيوتر (HTML)
نزّله على جهازك وافتحه وتبدأ تسجّل فيه كل خطواتك. البيانات بتتحفظ على الجهاز، ومش محتاج نت بعد التحميل. مفيش تسجيل دخول ولا اشتراك شهري، والنظام شغال بالعربي ومن اليمين لليسار.

✅ ملف الدليل (HTML)
نزّله وافتحه على اللاب. فيه شرح إزاي تثبّت تطبيق الموبايل، وإزاي أصلاً تستخدم السيستم من الأول للآخر. ابدأ بالملف ده قبل ما تثبّت الأندرويد.

✅ نسخة الموبايل (APK)
نفس السيستم على أندرويد. ثبّته يدويًا على الموبايل (مش من Google Play) وافتحه من أيقونة «عربيتي» على الشاشة.

🎨 هتلاقي إيه جوه السيستم؟

✅ لوحة التحكم
حالة العربية، درجة الصحة، أقرب صيانة، ومصاريف الشهر في نظرة واحدة.

✅ البنزين (من تموين لتاني)
الاستهلاك واللتر/100 كم من تموين كامل للتاني، من غير تخمين ومن غير ورقة في الدرج.

✅ الصيانة والإصلاحات والمصاريف
الزيت، القطع، الورشة، والرخص في مكان واحد. لما العربية تتروح تاني، يبقى عندك التاريخ كامل.

✅ الإطارات والبطارية والمستندات
تواريخ التغيير والتجديد قدامك، والنظام ينبّهك قبل الغرامة أو الحاجة تبوظ.

✅ التقارير والطباعة
مصاريف الشهر والبنزين والصيانة في تقرير جاهز تطبعه أو تحتفظ بيه.

✅ أكثر من عربية + نسخة احتياطية
البيانات على جهازك. تقدر تشغّل أكتر من عربية، وتعمل نسخة وترجعها بين اللابتوب والموبايل.

💡 أفضل طريقة تبدأ بيها:

افتح فولدر الدرايف اللي فوق.
لو حابب تفهم السيستم الأول: نزّل ملف الدليل وافتحه على اللاب.
لو عايز تستخدم عربيتي على الكمبيوتر: نزّل ملف HTML بتاع السيستم وافتحه وابدأ سجّل خطواتك.
لو عايزه على الموبايل: اقرأ ملف الدليل، وبعدين ثبّت ملف الأندرويد.
لو عربية تجريبية: في النظام فيه مثال كيا سيراتو 2021 تقدر تلغيه بعدين.

⚠️ نصيحة مهمة:
عربيتي مش اشتراك شهري ومش محتاج حساب. القيمة في السجل اللي بيتبني عندك: بنزين، صيانة، مصاريف، وتقرير.

ملف الموبايل لأندرويد فقط. على آيفون استخدم ملف السيستم HTML على الكمبيوتر.

💬 ولو واجهتك أي مشكلة في الوصول للينك أو الملفات أو التثبيت، تواصل معايا مباشرة على واتساب:

${whatsapp}

أتمنى عربيتي يوفّر عليك الورق والإكسل، ويخليك تعرف عربيتك بتصرف كام. 🤍

بالتوفيق،
محمود القوصي`;

  const htmlBody = escapeHtml(text)
    .replaceAll("\n\n", "</p><p>")
    .replaceAll("\n", "<br/>");

  const htmlLinked = htmlBody.replaceAll(
    escapeHtml(driveUrl),
    `<a href="${escapeHtml(driveUrl)}" style="color:#12b3a0;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(driveUrl)}</a>`
  );

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:24px;background:#06182c;">
    <div style="max-width:640px;margin:0 auto;background:#0a2540;border-radius:18px;padding:28px;font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#e8eef7;font-size:16px;">
      <p>${htmlLinked}</p>
    </div>
  </body>
</html>`;

  return {
    subject: ARABITY_PURCHASE_EMAIL_SUBJECT,
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
