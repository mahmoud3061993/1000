import nodemailer from "nodemailer";
import type { Order } from "./db";
import {
  DEFAULT_DELIVERY_URL,
  deliveryUrlForProduct,
  emailConfigured,
  getPaymentConfig,
} from "./config";
import { buildArabityPurchaseEmail } from "./arabity-email";
import { buildPlantPurchaseEmail } from "./plant-email";
import { getCatalogProduct } from "./products";

export { DEFAULT_DELIVERY_URL, emailConfigured };

export const PURCHASE_EMAIL_SUBJECT =
  "🎉 تم تأكيد طلبك - اكتر من 1000 تصميم جاهز ناجح في ال conversion ads قابل للتعديل على كانفا";

export function displayWhatsapp(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length >= 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  return digits || "01017420379";
}

export function emailFrom(env: NodeJS.Dict<string> = process.env) {
  if (env.EMAIL_FROM && env.EMAIL_FROM.trim()) return env.EMAIL_FROM.trim();
  const user = env.SMTP_USER || "noreply@producthelpyou.online";
  return `محمود القوصي <${user}>`;
}

export function buildPurchaseEmail(input: {
  name?: string;
  deliveryUrl: string;
  whatsappDisplay: string;
}) {
  const drive = input.deliveryUrl || DEFAULT_DELIVERY_URL;
  const whatsapp = input.whatsappDisplay || "01017420379";
  const text = `أهلًا بيك 👋
مبروك! 🎉
تم تأكيد طلبك بنجاح، ودلوقتي تقدر تبدأ تستخدم باقة +1000 Winning Static Ads Templates.

📂 رابط استلام كل الملفات:

${drive}

هتلاقي جوه اللينك كل ملفات الباقة والـ Bonuses في مكان واحد، وتقدر تدخل على كل ملف وتبدأ تستخدم التصميمات مباشرة.

🎨 هتلاقي إيه جوه الباقة؟

✅ +1000 Winning Static Ads Designs
مكتبة فيها أكتر من 1000 تصميم Static Ads جاهز، مبني على أفكار وتصميمات اتستخدمت في Conversion Ads وحققت نتائج قبل كده.

التصميمات معمولة عشان بدل ما تبدأ كل Creative من صفحة فاضية أو تفضل تدور بالساعات على Winning Ad Idea، يبقى عندك مكتبة جاهزة ترجع لها، تختار منها التصميم الأقرب للمنتج أو العرض بتاعك، وبعد كده تعدله على Canva بما يناسب البراند.

تقدر تعدل:
✅ النصوص
✅ الصور
✅ الألوان
✅ العناصر
✅ الـ Offer والـ CTA

وده يخليك تستخدم نفس الـ Template بأكتر من شكل ولأكتر من Business أو Client.

🎁 Bonus #1 — +860 Social Media Organic Posts Templates

هتلاقي كمان مكتبة منفصلة فيها أكتر من 860 Template جاهز للمحتوى الـ Organic على Social Media.

يعني عندك مكتبة للـ Ads ومكتبة تانية مختلفة للمحتوى الـ Organic، وده يخليك تقدر تستخدمها في:
Social Media Posts، Content Creation، صفحات البراندات، Clients، والـ Personal Brands.

🎁 Bonus #2 — Ultimate CRO Checklist بالعربي

هتلاقي كمان Ultimate CRO Checklist كاملة بالعربي، معمولة لمراجعة وتحسين الـ Conversion Rate بتاع أي Website أو Online Store.

الـ Checklist مش مجرد شوية نصايح عامة، لكنها متقسمة حسب كل صفحة في الموقع لوحدها، ومنها:

✅ Home Page
✅ Product Page
✅ Collection Page
✅ Cart Page
✅ Checkout Page
✅ Contact Page
✅ About Us Page
✅ FAQ Page
✅ Blog

وكل جزء فيه نقاط عملية تقدر تراجعها واحدة واحدة عشان تعرف إيه الموجود عندك، إيه الناقص، وإيه التحسينات اللي ممكن تساعد في تقليل الاحتكاك وتحسين تجربة المستخدم ورفع الـ Conversion Rate.

💡 أفضل طريقة تبدأ بيها:

افتح فولدر الملفات من اللينك اللي فوق.
ابدأ بملف +1000 Winning Static Ads Designs.
اختار Template قريب من الـ Angle أو المنتج اللي هتعلن عنه.
افتح التصميم على Canva وعدّل النصوص والصور والألوان بما يناسبك.
متنساش تستخدم مكتبة الـ +860 Organic Templates للمحتوى العادي على السوشيال ميديا.
ولو عندك Website أو Store، افتح Ultimate CRO Checklist وراجع الموقع صفحة صفحة.

⚠️ نصيحة مهمة:
متتعاملش مع مكتبة الـ +1000 Template على إنها Designs تنسخها زي ما هي وخلاص.

أفضل استخدام ليها إنك تعتبرها Creative Inspiration Library ترجع لها كل ما تحتاج تعمل Test جديد أو Creative جديد، وتاخد الـ Layout أو الـ Angle أو طريقة عرض الـ Offer وتكيفها مع المنتج والجمهور بتاعك.

وبرضه مهم تعرف إن مفيش Template يقدر يضمن نتيجة لوحده، لأن أداء الإعلان بيعتمد كمان على الـ Offer، المنتج، السعر، الجمهور، الـ Copy، والـ Landing Page.

💬 ولو واجهتك أي مشكلة في الوصول للملفات أو استخدام أي جزء من الباقة، تواصل معايا مباشرة على واتساب:

${whatsapp}

أتمنى الباقة توفر عليك وقت كبير في البحث والتصميم، وتخليك بدل ما تبدأ كل إعلان من الصفر يبقى عندك مكتبة كبيرة من الـ Winning Creative Ideas تقدر ترجع لها وتعمل منها Tests جديدة باستمرار. 🤍

بالتوفيق،
محمود القوصي`;

  const htmlBody = escapeHtml(text)
    .replaceAll("\n\n", "</p><p>")
    .replaceAll("\n", "<br/>")
    .replace(
      escapeHtml(drive),
      `<a href="${escapeHtml(drive)}" style="color:#147AC2;font-weight:800" target="_blank" rel="noreferrer">${escapeHtml(drive)}</a>`
    );

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:24px;background:#F8FAFC;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#0F172A;font-size:16px;">
      <p>${htmlBody}</p>
    </div>
  </body>
</html>`;

  return {
    subject: PURCHASE_EMAIL_SUBJECT,
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

async function sendWithResend(to: string, subject: string, text: string, html: string) {
  const from = emailFrom();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Resend email error", json);
    return { ok: false as const, error: "فشل إرسال الإيميل عبر Resend" };
  }
  return { ok: true as const, provider: "resend" as const };
}

async function sendWithSmtp(to: string, subject: string, text: string, html: string) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: emailFrom(),
    to,
    subject,
    text,
    html,
  });
  return { ok: true as const, provider: "smtp" as const };
}

export async function sendPurchaseEmail(order: Pick<Order, "name" | "email" | "product_slug">) {
  if (!order.email) {
    return { ok: false as const, skipped: true as const, error: "مفيش إيميل على الطلب" };
  }
  if (!emailConfigured()) {
    console.error("purchase email skipped: missing RESEND_API_KEY or SMTP_USER/SMTP_PASS");
    return {
      ok: false as const,
      skipped: true as const,
      error: "إيميل الإرسال مش متظبط. حط SMTP_USER و SMTP_PASS في Vercel.",
    };
  }

  const cfg = await getPaymentConfig();
  const product = getCatalogProduct(order.product_slug);
  const deliveryUrl = deliveryUrlForProduct(product.slug, cfg);
  const message =
    product.slug === "plant"
      ? buildPlantPurchaseEmail({
          name: order.name,
          deliveryUrl,
          whatsappDisplay: displayWhatsapp(cfg.whatsapp),
        })
      : product.slug === "arabity"
        ? buildArabityPurchaseEmail({
            name: order.name,
            deliveryUrl,
            whatsappDisplay: displayWhatsapp(cfg.whatsapp),
          })
        : buildPurchaseEmail({
            name: order.name,
            deliveryUrl: deliveryUrl || DEFAULT_DELIVERY_URL,
            whatsappDisplay: displayWhatsapp(cfg.whatsapp),
          });

  try {
    if (process.env.RESEND_API_KEY) {
      return sendWithResend(order.email, message.subject, message.text, message.html);
    }
    return sendWithSmtp(order.email, message.subject, message.text, message.html);
  } catch (error) {
    console.error("purchase email failed", error);
    return { ok: false as const, error: "فشل إرسال إيميل تأكيد الطلب" };
  }
}
