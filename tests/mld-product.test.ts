import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MLD_PURCHASE_EMAIL_SUBJECT, MLD_DRIVE_URL, buildMldPurchaseEmail } from "../src/lib/mld-email";
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
  it("defaults delivery to the Drive folder", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(deliveryUrlForProduct("mld", cfg), MLD_DRIVE_URL);
  });

  it("ignores a leftover ZIP download URL so the email stays on Drive", () => {
    const cfg = mergePaymentConfig(
      {},
      { mld_delivery_url: "https://www.producthelpyou.online/downloads/meta-library-downloader.zip" }
    );
    assert.equal(deliveryUrlForProduct("mld", cfg), MLD_DRIVE_URL);
  });

  it("prefers MLD_DELIVERY_URL when it is a Drive folder", () => {
    const drive = "https://drive.google.com/drive/folders/mld-files";
    const cfg = mergePaymentConfig({ MLD_DELIVERY_URL: drive }, {});
    assert.equal(deliveryUrlForProduct("mld", cfg), drive);
    assert.equal(cfg.envOverrides.mldDeliveryUrl, true);
  });

  it("writes a short Arabic email with only the Drive link", () => {
    const email = buildMldPurchaseEmail({
      name: "أحمد",
      deliveryUrl: MLD_DRIVE_URL,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, MLD_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.text, /شكرا ليك على الشراء/);
    assert.match(email.text, /فيديو شرح التسطيب/);
    assert.equal(email.text.includes(MLD_DRIVE_URL), true);
    assert.equal(email.html.includes(MLD_DRIVE_URL), true);
    assert.match(email.html, /dir="rtl"/);
    assert.equal((email.text.match(/https?:\/\//g) || []).length, 1);
    assert.equal(email.text.includes("01017420379"), false);
    assert.equal(email.text.includes("Load unpacked"), false);
    assert.equal(email.text.includes("producthelpyou.online/downloads"), false);
  });

  it("still sends the Drive folder if a ZIP URL is passed into the email builder", () => {
    const email = buildMldPurchaseEmail({
      deliveryUrl: "https://www.producthelpyou.online/downloads/meta-library-downloader.zip",
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.text.includes(MLD_DRIVE_URL), true);
    assert.equal(email.text.includes("meta-library-downloader.zip"), false);
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
