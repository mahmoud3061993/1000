import { MLD_DRIVE_URL } from "./config";

export const MLD_PURCHASE_EMAIL_SUBJECT = "تم تأكيد طلبك — Meta Library Downloader";
export { MLD_DRIVE_URL };

function driveUrlForEmail(deliveryUrl: string) {
  const url = deliveryUrl.trim();
  if (/drive\.google\.com/i.test(url)) return url;
  return MLD_DRIVE_URL;
}

export function buildMldPurchaseEmail(input: {
  name?: string;
  deliveryUrl: string;
  whatsappDisplay: string;
}) {
  const driveUrl = driveUrlForEmail(input.deliveryUrl);

  const text = `شكرا ليك على الشراء.
تقدر تفتح لينك الدرايف ده وهتلاقي ال extension ومعاها فيديو شرح التسطيب

${driveUrl}`;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:24px;background:#07080f;">
    <div style="max-width:640px;margin:0 auto;background:#12141f;border-radius:18px;padding:28px;font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#f4f4f8;font-size:16px;">
      <p style="margin:0 0 16px;">شكرا ليك على الشراء.</p>
      <p style="margin:0 0 16px;">تقدر تفتح لينك الدرايف ده وهتلاقي ال extension ومعاها فيديو شرح التسطيب</p>
      <p style="margin:0;">
        <a href="${escapeHtml(driveUrl)}" style="color:#ffd166;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(driveUrl)}</a>
      </p>
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
