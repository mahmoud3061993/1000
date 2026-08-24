import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
  it("uses /car until a Drive folder is configured", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(cfg.arabityDeliveryUrl, ARABITY_SYSTEM_URL);
    assert.equal(deliveryUrlForProduct("arabity", cfg), ARABITY_SYSTEM_URL);
  });

  it("prefers ARABITY_DELIVERY_URL for the Drive folder", () => {
    const drive = "https://drive.google.com/drive/folders/arabity-files";
    const cfg = mergePaymentConfig({ ARABITY_DELIVERY_URL: drive }, {});
    assert.equal(deliveryUrlForProduct("arabity", cfg), drive);
    assert.equal(cfg.envOverrides.arabityDeliveryUrl, true);
  });

  it("sends the system link, Drive files, and how to start", () => {
    const drive = "https://drive.google.com/drive/folders/arabity-files";
    const email = buildArabityPurchaseEmail({
      name: "أحمد",
      deliveryUrl: drive,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, ARABITY_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.subject, /عربيتي/);
    assert.equal(email.text.includes(ARABITY_SYSTEM_URL), true);
    assert.equal(email.text.includes(drive), true);
    assert.equal(email.html.includes(ARABITY_SYSTEM_URL), true);
    assert.equal(email.html.includes(drive), true);
    assert.match(email.html, /dir="rtl"/);
    assert.match(email.text, /ملف النظام للكمبيوتر/);
    assert.match(email.text, /ملف الأندرويد/);
    assert.match(email.text, /دليل الاستخدام/);
    assert.match(email.text, /من تموين لتاني/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
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
