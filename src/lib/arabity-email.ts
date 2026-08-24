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
  const name = (input.name || "").trim();
  const hello = name ? `أهلًا ${name} 👋` : "أهلًا بيك 👋";

  const text = `${hello}

مبروك شراء عربيتي! 🎉
تم تأكيد طلبك بنجاح، ودلوقتي تقدر تبدأ تستخدم النظام.

من خلال لينك الدرايف ده هتلاقي ملفاتك:

${driveUrl}

هتلاقي جوه 3 ملفات:
- 2 بصيغة HTML
- وواحد بصيغة APK

عندك ملف HTML اسمه الدليل: نزّله وافتحه على اللاب عشان تعرف إزاي تثبّت تطبيق الموبايل، وإزاي أصلاً تستخدم السيستم.

وتقدر تفتح الملف التاني بتاع السيستم على طول: نزّله عندك على الجهاز من الدرايف، وافتحه، وتبدأ تستخدمه وتسجّل فيه كل خطواتك.

💬 ولو واجهتك أي مشكلة في الوصول للينك أو الملفات أو التثبيت، تواصل معايا مباشرة على واتساب:

${whatsapp}

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
