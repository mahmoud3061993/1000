import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCatalogProduct } from "../src/lib/products";
import { buildPlantPurchaseEmail, PLANT_PURCHASE_EMAIL_SUBJECT } from "../src/lib/plant-email";

describe("plant catalog product", () => {
  it("sells the Egyptian plant guide for 449 EGP", () => {
    const plant = getCatalogProduct("plant", {});
    assert.equal(plant.slug, "plant");
    assert.equal(plant.price, 449);
    assert.equal(plant.currency, "EGP");
    assert.equal(plant.path, "/products/plant");
    assert.match(plant.arabicName, /النباتات/);
  });

  it("keeps the Canva pack as the default product", () => {
    const ads = getCatalogProduct("1000", {});
    assert.equal(ads.price, 235);
    assert.equal(getCatalogProduct("unknown", {}).slug, "1000");
  });
});

describe("plant purchase email", () => {
  it("sends the new product details and access link", () => {
    const link = "https://www.mahmoudelkousy.online/guide";
    const email = buildPlantPurchaseEmail({
      name: "سارة",
      deliveryUrl: link,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, PLANT_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.text, /دليل إنقاذ ورعاية النباتات المنزلية/);
    assert.match(email.text, /77 نبات/);
    assert.match(email.text, /دكتور النباتات/);
    assert.match(email.text, /بيتموس/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
    assert.equal(email.text.includes(link), true);
    assert.equal(email.html.includes(link), true);
    assert.match(email.html, /dir="rtl"/);
  });
});
