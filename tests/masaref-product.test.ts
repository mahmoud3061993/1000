import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MASAREF_PURCHASE_EMAIL_SUBJECT, MASAREF_FILES_URL, MASAREF_HTML_ZIP_URL, MASAREF_APK_URL, buildMasarefPurchaseEmail } from "../src/lib/masaref-email";
import { deliveryUrlForProduct, mergePaymentConfig } from "../src/lib/config";
import { getCatalogProduct, isProductSlug, productAdminLabel, resolveProductSlug } from "../src/lib/products";
import { formatOrderMessage } from "../src/lib/telegram";

describe("masaref catalog product", () => {
  it("sells مصارف on /masaref for 399 EGP", () => {
    const product = getCatalogProduct("masaref", {});
    assert.equal(product.slug, "masaref");
    assert.equal(product.price, 399);
    assert.equal(product.compareAtPrice, 990);
    assert.equal(product.currency, "EGP");
    assert.equal(product.path, "/masaref");
    assert.equal(product.pixelName, "Masaref Spend Control");
    assert.match(product.arabicName, /مصارف/);
  });

  it("lets MASAREF_PRODUCT_PRICE override the default", () => {
    const product = getCatalogProduct("masaref", { MASAREF_PRODUCT_PRICE: "199" });
    assert.equal(product.price, 199);
  });

  it("resolves the masaref slug without falling back to Canva", () => {
    assert.equal(isProductSlug("masaref"), true);
    assert.equal(resolveProductSlug("masaref"), "masaref");
    assert.equal(resolveProductSlug("unknown"), "1000");
    assert.equal(productAdminLabel("masaref"), "مصارف");
  });

  it("keeps the other catalog products unchanged", () => {
    assert.equal(getCatalogProduct("1000", {}).price, 235);
    assert.equal(getCatalogProduct("plant", {}).path, "/buydoctorplant");
    assert.equal(getCatalogProduct("arabity", {}).path, "/carlanding");
    assert.equal(getCatalogProduct("unknown", {}).slug, "1000");
  });
});

describe("masaref delivery and purchase email", () => {
  it("defaults delivery to the download page until a Drive folder is set", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(deliveryUrlForProduct("masaref", cfg), MASAREF_FILES_URL);
  });

  it("prefers MASAREF_DELIVERY_URL for the Drive folder", () => {
    const drive = "https://drive.google.com/drive/folders/masaref-files";
    const cfg = mergePaymentConfig({ MASAREF_DELIVERY_URL: drive }, {});
    assert.equal(deliveryUrlForProduct("masaref", cfg), drive);
    assert.equal(cfg.envOverrides.masarefDeliveryUrl, true);
  });

  it("writes an Arabic purchase email with the Drive folder", () => {
    const drive = "https://drive.google.com/drive/folders/masaref-files";
    const email = buildMasarefPurchaseEmail({
      name: "أحمد",
      deliveryUrl: drive,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, MASAREF_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.text, /مصارف/);
    assert.match(email.text, /سيستم السيطرة على المصروفات/);
    assert.equal(email.text.includes(drive), true);
    assert.equal(email.html.includes(drive), true);
    assert.match(email.html, /dir="rtl"/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
    assert.equal(email.text.includes(MASAREF_HTML_ZIP_URL), true);
    assert.equal(email.text.includes(MASAREF_APK_URL), true);
  });

  it("lists direct download links when no Drive folder is set", () => {
    const email = buildMasarefPurchaseEmail({
      name: "سارة",
      deliveryUrl: "",
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.text.includes(MASAREF_FILES_URL), true);
    assert.equal(email.text.includes(MASAREF_HTML_ZIP_URL), true);
    assert.equal(email.text.includes(MASAREF_APK_URL), true);
  });
});

describe("masaref admin alerts", () => {
  it("labels masaref orders in Telegram messages", () => {
    const msg = formatOrderMessage("pending", {
      id: "ord_1",
      name: "محمود",
      email: "m@test.com",
      phone: "01017420379",
      amount: 399,
      currency: "EGP",
      product_slug: "masaref",
      payment_method: "instapay",
      status: "pending_review",
    });
    assert.match(msg, /مصارف/);
    assert.match(msg, /399/);
  });
});
