import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ARABITY_DRIVE_URL,
  ARABITY_PURCHASE_EMAIL_SUBJECT,
  ARABITY_SYSTEM_URL,
  buildArabityPurchaseEmail,
} from "../src/lib/arabity-email";
import { deliveryUrlForProduct, mergePaymentConfig } from "../src/lib/config";
import {
  getCatalogProduct,
  isProductSlug,
  productAdminLabel,
  resolveProductSlug,
} from "../src/lib/products";
import { formatOrderMessage } from "../src/lib/telegram";

describe("arabity catalog product", () => {
  it("sells عربيتي on /carlanding for 299 EGP", () => {
    const product = getCatalogProduct("arabity", {});
    assert.equal(product.slug, "arabity");
    assert.equal(product.price, 299);
    assert.equal(product.compareAtPrice, 990);
    assert.equal(product.currency, "EGP");
    assert.equal(product.path, "/carlanding");
    assert.equal(product.pixelName, "Arabity Car Tracker");
    assert.match(product.arabicName, /عربيتي/);
  });

  it("lets ARABITY_PRODUCT_PRICE override the default", () => {
    const product = getCatalogProduct("arabity", { ARABITY_PRODUCT_PRICE: "199" });
    assert.equal(product.price, 199);
  });

  it("resolves the arabity slug without falling back to Canva", () => {
    assert.equal(isProductSlug("arabity"), true);
    assert.equal(resolveProductSlug("arabity"), "arabity");
    assert.equal(resolveProductSlug("unknown"), "1000");
    assert.equal(productAdminLabel("arabity"), "عربيتي");
  });

  it("keeps Canva and the plant guide unchanged", () => {
    assert.equal(getCatalogProduct("1000", {}).price, 235);
    assert.equal(getCatalogProduct("plant", {}).path, "/buydoctorplant");
    assert.equal(getCatalogProduct("unknown", {}).slug, "1000");
  });
});

describe("arabity delivery and purchase email", () => {
  it("defaults delivery to the Google Drive folder", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(cfg.arabityDeliveryUrl, ARABITY_DRIVE_URL);
    assert.equal(deliveryUrlForProduct("arabity", cfg), ARABITY_DRIVE_URL);
  });

  it("prefers ARABITY_DELIVERY_URL for the Drive folder", () => {
    const drive = "https://drive.google.com/drive/folders/arabity-files";
    const cfg = mergePaymentConfig({ ARABITY_DELIVERY_URL: drive }, {});
    assert.equal(deliveryUrlForProduct("arabity", cfg), drive);
    assert.equal(cfg.envOverrides.arabityDeliveryUrl, true);
  });

  it("matches the plant email layout for عربيتي with the Drive folder", () => {
    const drive = "https://drive.google.com/drive/folders/arabity-files";
    const email = buildArabityPurchaseEmail({
      name: "أحمد",
      deliveryUrl: drive,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, ARABITY_PURCHASE_EMAIL_SUBJECT);
    assert.equal(email.subject, "🎉 تم تأكيد طلبك - عربيتي جاهز للاستخدام");
    assert.match(email.text, /^أهلًا بيك 👋/);
    assert.match(email.text, /مبروك! 🎉/);
    assert.match(email.text, /تم تأكيد طلبك بنجاح، ودلوقتي تقدر تبدأ تستخدم عربيتي/);
    assert.equal(email.text.includes(drive), true);
    assert.equal(email.html.includes(drive), true);
    assert.equal(email.text.includes(ARABITY_SYSTEM_URL), false);
    assert.equal(email.html.includes(ARABITY_SYSTEM_URL), false);
    assert.equal(email.text.includes("producthelpyou.online/car"), false);
    assert.match(email.html, /dir="rtl"/);
    assert.match(email.text, /رابط فولدر الملفات على Google Drive/);
    assert.equal(email.text.includes("لينك السيستم للاستخدام المباشر"), false);
    assert.match(email.text, /3 ملفات في مكان واحد/);
    assert.match(email.text, /ملف السيستم للكمبيوتر \(HTML\)/);
    assert.match(email.text, /ملف الدليل \(HTML\)/);
    assert.match(email.text, /نسخة الموبايل \(APK\)/);
    assert.match(email.text, /لوحة التحكم/);
    assert.match(email.text, /من تموين لتاني/);
    assert.match(email.text, /أفضل طريقة تبدأ بيها/);
    assert.match(email.text, /أندرويد فقط/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
    assert.equal(email.text.includes("دليل إنقاذ ورعاية النباتات"), false);
    assert.equal(email.text.includes("189YT8A2YjnXC3-GbmL5dpyj1J9lfnnZ_"), false);
  });

  it("uses the default Drive folder when delivery is still the /car link", () => {
    const email = buildArabityPurchaseEmail({
      name: "سارة",
      deliveryUrl: ARABITY_SYSTEM_URL,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.text.includes(ARABITY_DRIVE_URL), true);
    assert.equal(email.html.includes(ARABITY_DRIVE_URL), true);
    assert.equal(email.text.includes(ARABITY_SYSTEM_URL), false);
  });
});

describe("arabity admin and telegram labels", () => {
  it("names عربيتي in Telegram alerts", () => {
    const paid = formatOrderMessage("paid", {
      id: "ord_a",
      name: "أحمد",
      email: "a@test.com",
      phone: "01017420379",
      amount: 249,
      currency: "EGP",
      product_slug: "arabity",
      payment_method: "kashier",
      status: "paid",
    });
    assert.match(paid, /عربيتي/);
    assert.equal(productAdminLabel("arabity"), "عربيتي");
  });
});
