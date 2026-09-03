import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MLD_PURCHASE_EMAIL_SUBJECT, MLD_ZIP_URL, buildMldPurchaseEmail } from "../src/lib/mld-email";
import { deliveryUrlForProduct, mergePaymentConfig } from "../src/lib/config";
import { getCatalogProduct, isProductSlug, productAdminLabel, resolveProductSlug } from "../src/lib/products";
import { formatOrderMessage } from "../src/lib/telegram";

describe("mld catalog product", () => {
  it("sells Meta Library Downloader on /mld for 499 EGP", () => {
    const product = getCatalogProduct("mld", {});
    assert.equal(product.slug, "mld");
    assert.equal(product.price, 499);
    assert.equal(product.compareAtPrice, 1490);
    assert.equal(product.currency, "EGP");
    assert.equal(product.path, "/mld");
    assert.equal(product.pixelName, "Meta Library Downloader Pro");
    assert.match(product.arabicName, /Meta Library Downloader/);
  });

  it("lets MLD_PRODUCT_PRICE override the default", () => {
    const product = getCatalogProduct("mld", { MLD_PRODUCT_PRICE: "399" });
    assert.equal(product.price, 399);
  });

  it("resolves the mld slug without falling back to Canva", () => {
    assert.equal(isProductSlug("mld"), true);
    assert.equal(resolveProductSlug("mld"), "mld");
    assert.equal(resolveProductSlug("unknown"), "1000");
    assert.equal(productAdminLabel("mld"), "Meta Library Downloader");
  });

  it("keeps the other catalog products unchanged", () => {
    assert.equal(getCatalogProduct("1000", {}).price, 235);
    assert.equal(getCatalogProduct("plant", {}).path, "/buydoctorplant");
    assert.equal(getCatalogProduct("arabity", {}).path, "/carlanding");
    assert.equal(getCatalogProduct("masaref", {}).path, "/masaref");
    assert.equal(getCatalogProduct("unknown", {}).slug, "1000");
  });
});

describe("mld delivery and purchase email", () => {
  it("defaults delivery to the site ZIP until a custom URL is set", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(deliveryUrlForProduct("mld", cfg), MLD_ZIP_URL);
  });

  it("prefers MLD_DELIVERY_URL for the download link", () => {
    const drive = "https://drive.google.com/drive/folders/mld-files";
    const cfg = mergePaymentConfig({ MLD_DELIVERY_URL: drive }, {});
    assert.equal(deliveryUrlForProduct("mld", cfg), drive);
    assert.equal(cfg.envOverrides.mldDeliveryUrl, true);
  });

  it("writes an Arabic purchase email with install steps", () => {
    const zip = "https://www.producthelpyou.online/downloads/meta-library-downloader.zip";
    const email = buildMldPurchaseEmail({
      name: "أحمد",
      deliveryUrl: zip,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, MLD_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.text, /Meta Library Downloader/);
    assert.match(email.text, /مدى الحياة/);
    assert.equal(email.text.includes(zip), true);
    assert.equal(email.html.includes(zip), true);
    assert.match(email.html, /dir="rtl"/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
    assert.match(email.text, /Load unpacked/);
  });
});

describe("mld admin alerts", () => {
  it("labels mld orders in Telegram messages", () => {
    const msg = formatOrderMessage("pending", {
      id: "ord_mld_1",
      name: "محمود",
      email: "m@test.com",
      phone: "01017420379",
      amount: 499,
      currency: "EGP",
      product_slug: "mld",
      payment_method: "instapay",
      status: "pending_review",
    });
    assert.match(msg, /Meta Library Downloader/);
    assert.match(msg, /499/);
  });
});
