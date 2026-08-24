export const ARABITY_PURCHASE_EMAIL_SUBJECT = "🎉 تم تأكيد طلبك - عربيتي جاهز للاستخدام";
export const ARABITY_SYSTEM_URL = "https://www.producthelpyou.online/car";

export function buildArabityPurchaseEmail(input: {
  name?: string;
  deliveryUrl: string;
  whatsappDisplay: string;
}) {
  const systemUrl = ARABITY_SYSTEM_URL;
  const driveUrl = input.deliveryUrl.trim() && input.deliveryUrl.trim() !== systemUrl ? input.deliveryUrl.trim() : "";
  const whatsapp = input.whatsappDisplay || "01017420379";

  const driveBlock = driveUrl
    ? `📂 فولدر الملفات على Google Drive:

${driveUrl}

هتلاقي جوه الفولدر 3 ملفات في مكان واحد:

✅ ملف النظام للكمبيوتر (HTML)
افتحه من Chrome أو Edge على اللابتوب. البيانات بتتحفظ على الجهاز، ومش محتاج نت بعد التحميل.

✅ ملف الأندرويد (APK)
ثبّته يدويًا على الموبايل (مش من Google Play). ابدأ بملف الدليل قبل التثبيت لو دي أول مرة.

✅ دليل الاستخدام والتثبيت
شرح أول فتح، تسجيل العربية، البنزين، الصيانة، التقارير، والنسخ الاحتياطي.
`
    : `الملفات الثلاثة (HTML للكمبيوتر + APK للأندرويد + دليل الاستخدام) هتلاقيها مع لينك السيستم، أو ابعتلنا على واتساب لو محتاجهم في فولدر منفصل.
`;

  const text = `أهلًا بيك 👋
مبروك! 🎉
تم تأكيد طلبك بنجاح، ودلوقتي تقدر تبدأ تستخدم عربيتي.

🚗 لينك السيستم للاستخدام المباشر:

${systemUrl}

افتح اللينك من الموبايل أو الكمبيوتر. مفيش تسجيل دخول ولا اشتراك شهري، والنظام بالعربي من اليمين لليسار.

${driveBlock}
🎨 هتلاقي إيه جوه عربيتي؟

✅ لوحة التحكم
حالة العربية، درجة الصحة، وأقرب صيانة أو مصروف جاي.

✅ البنزين (من تموين لتاني)
الاستهلاك واللتر/100 كم من غير تخمين.

✅ الصيانة والإصلاحات والمصاريف
سجل الورشة، القطع، والرخص في مكان واحد.

✅ الإطارات والبطارية والمستندات
تواريخ التغيير والتجديد قدامك.

✅ التقارير والطباعة
تقرير جاهز تطبعه أو تحتفظ بيه.

✅ أكثر من عربية + نسخة احتياطية JSON
البيانات على جهازك. تقدر تعمل نسخة وترجعها.

💡 أفضل طريقة تبدأ بيها:

افتح لينك السيستم اللي فوق وسجّل عربيتك.
لو عايز نفس النظام أوفلاين على الكمبيوتر: افتح ملف HTML.
لو عايزه على الموبايل: ثبّت ملف الأندرويد بعد ما تقرأ الدليل.
لو عربية تجريبية: في النظام فيه مثال كيا سيراتو 2021 تقدر تلغيه بعدين.

⚠️ نصيحة مهمة:
عربيتي مش اشتراك شهري ومش محتاج حساب. القيمة في السجل اللي بيتبني عندك: بنزين، صيانة، مصاريف، وتقرير.

ملف الموبايل لأندرويد فقط. على آيفون استخدم لينك السيستم فوق.

💬 ولو واجهتك أي مشكلة في الوصول للينك أو الملفات أو التثبيت، تواصل معايا مباشرة على واتساب:

${whatsapp}

أتمنى عربيتي يوفّر عليك الورق والإكسل، ويخليك تعرف عربيتك بتصرف كام. 🤍

بالتوفيق،
محمود القوصي`;

  const htmlBody = escapeHtml(text)
    .replaceAll("\n\n", "</p><p>")
    .replaceAll("\n", "<br/>");

  const urls = [systemUrl, driveUrl].filter(Boolean);
  const htmlLinked = urls.reduce(
    (html, url) =>
      html.replaceAll(
        escapeHtml(url),
        `<a href="${escapeHtml(url)}" style="color:#12b3a0;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`
      ),
    htmlBody
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
