import { MLD_ZIP_URL } from "./config";

export const MLD_PURCHASE_EMAIL_SUBJECT = "🎉 تم تأكيد طلبك - Meta Library Downloader Pro جاهزة للتثبيت";
export { MLD_ZIP_URL };

function zipUrlForEmail(deliveryUrl: string) {
  const url = deliveryUrl.trim();
  return url || MLD_ZIP_URL;
}

export function buildMldPurchaseEmail(input: {
  name?: string;
  deliveryUrl: string;
  whatsappDisplay: string;
}) {
  const zipUrl = zipUrlForEmail(input.deliveryUrl);
  const whatsapp = input.whatsappDisplay || "01017420379";

  const text = `أهلًا بيك 👋
مبروك! 🎉
تم تأكيد طلبك بنجاح، ودلوقتي تقدر تثبّت Meta Library Downloader — النسخة الاحترافية مدى الحياة.

📂 رابط تحميل الإضافة:

${zipUrl}

💡 إزاي تثبّتها على Google Chrome:

1) نزّل الملف من اللينك فوق وفك الضغط (Extract).
2) افتح Chrome وادخل chrome://extensions
3) فعّل Developer mode من فوق على اليمين.
4) دوس Load unpacked واختار المجلد اللي فكّيت فيه الملف.
5) افتح Facebook Ads Library وهتلاقي أزرار الإضافة على كل إعلان.

🎨 هتقدر تعمل إيه؟

✅ تحميل صورة الإعلان بضغطة
✅ تحميل فيديو MP4 نظيف (من غير ملفات m3u8)
✅ تاج الوينر للإعلان اللي شغال 30 يوم أو أكتر
✅ تحميل جماعي لأكتر من إعلان مرة واحدة
✅ Spy on page لمتابعة صفحة المعلن
✅ Open offer لفتح لينك العرض مباشرة
✅ تصدير نصوص الإعلانات لـ Google Sheets
✅ التقاط الـ Headline والـ CTA
✅ آخر التحميلات من الـ Popup

⚠️ العرض اللي اشتريته مدى الحياة: دفعت مرة واحدة، ومفيش اشتراك شهري على الرخصة دي.

💬 ولو واجهتك أي مشكلة في التحميل أو التثبيت، تواصل معايا مباشرة على واتساب:

${whatsapp}

بالتوفيق،
محمود القوصي`;

  const htmlLinked = escapeHtml(text)
    .replaceAll("\n\n", "</p><p>")
    .replaceAll("\n", "<br/>")
    .replace(
      escapeHtml(zipUrl),
      `<a href="${escapeHtml(zipUrl)}" style="color:#b8ff3c;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(zipUrl)}</a>`
    );

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:24px;background:#07080f;">
    <div style="max-width:640px;margin:0 auto;background:#12141f;border-radius:18px;padding:28px;font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#f4f4f8;font-size:16px;">
      <p>${htmlLinked}</p>
    </div>
  </body>
</html>`;

  return {
    subject: MLD_PURCHASE_EMAIL_SUBJECT,
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
