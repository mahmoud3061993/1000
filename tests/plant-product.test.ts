import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCatalogProduct } from "../src/lib/products";
import {
  buildPlantPurchaseEmail,
  PLANT_DRIVE_URL,
  PLANT_PURCHASE_EMAIL_SUBJECT,
  PLANT_SYSTEM_URL,
} from "../src/lib/plant-email";

describe("plant catalog product", () => {
  it("sells the Egyptian plant guide for 350 EGP", () => {
    const plant = getCatalogProduct("plant", {});
    assert.equal(plant.slug, "plant");
    assert.equal(plant.price, 350);
    assert.equal(plant.currency, "EGP");
    assert.equal(plant.path, "/buydoctorplant");
    assert.match(plant.arabicName, /النباتات/);
  });

  it("keeps the Canva pack as the default product", () => {
    const ads = getCatalogProduct("1000", {});
    assert.equal(ads.price, 235);
    assert.equal(getCatalogProduct("unknown", {}).slug, "1000");
  });
});

describe("plant purchase email", () => {
  it("sends the system link, Drive folder, and how to start", () => {
    const email = buildPlantPurchaseEmail({
      name: "سارة",
      deliveryUrl: PLANT_SYSTEM_URL,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, PLANT_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.subject, /دليل إنقاذ ورعاية النباتات المنزلية/);
    assert.match(email.text, /دليل إنقاذ ورعاية النباتات المنزلية/);
    assert.equal(email.text.includes(PLANT_SYSTEM_URL), true);
    assert.equal(email.text.includes(PLANT_DRIVE_URL), true);
    assert.equal(email.html.includes(PLANT_SYSTEM_URL), true);
    assert.equal(email.html.includes(PLANT_DRIVE_URL), true);
    assert.match(email.html, /dir="rtl"/);
    assert.match(email.text, /نفس السيستم نسخة الموبايل/);
    assert.match(email.text, /ملف طريقة التثبيت على الموبايل/);
    assert.match(email.text, /ملف شرح استخدام السيستم كله/);
    assert.match(email.text, /77 نبات/);
    assert.match(email.text, /دكتور النباتات/);
    assert.match(email.text, /بيتموس/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
  });
});
