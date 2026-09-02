import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getCatalogProduct } from "../src/lib/products";
import { PLANT_GUIDE_COUNT } from "../src/lib/plant-guide";
import {
  buildPlantPurchaseEmail,
  PLANT_DRIVE_URL,
  PLANT_PURCHASE_EMAIL_SUBJECT,
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
  it("sends only the Drive folder link and how to start", () => {
    const email = buildPlantPurchaseEmail({
      name: "سارة",
      deliveryUrl: "https://www.producthelpyou.online/products/plant",
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, PLANT_PURCHASE_EMAIL_SUBJECT);
    assert.match(email.subject, /دليل إنقاذ ورعاية النباتات المنزلية/);
    assert.match(email.text, /دليل إنقاذ ورعاية النباتات المنزلية/);
    assert.equal(email.text.includes(PLANT_DRIVE_URL), true);
    assert.equal(email.html.includes(PLANT_DRIVE_URL), true);
    assert.equal(email.text.includes("https://www.producthelpyou.online"), false);
    assert.equal(email.text.includes("mahmoudelkousy.online"), false);
    assert.match(email.html, /dir="rtl"/);
    assert.match(email.text, /نفس السيستم نسخة الموبايل/);
    assert.match(email.text, /ملف طريقة التثبيت على الموبايل/);
    assert.match(email.text, /ملف شرح استخدام السيستم كله/);
    assert.match(email.text, /ملف HTML واحد/);
    assert.match(email.text, /من غير فك ضغط/);
    assert.match(email.text, new RegExp(`${PLANT_GUIDE_COUNT} نبات`));
    assert.match(email.text, /دكتور النباتات/);
    assert.match(email.text, /بيتموس/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
    const httpLinks = email.text.match(/https?:\/\/\S+/g) || [];
    assert.deepEqual(httpLinks, [PLANT_DRIVE_URL]);
  });
});

describe("plant guide catalog", () => {
  it("ships 150 Egyptian houseplants in the live guide and offline APK", () => {
    const home = readFileSync("public/products/plant/index.html", "utf8");
    assert.match(home, new RegExp(`${PLANT_GUIDE_COUNT}`));
    assert.equal(existsSync("public/plants/pothos.jpg"), true);
    assert.equal(existsSync("public/plants/gardenia-jasminoides.jpg"), true);
    assert.equal(existsSync("public/plants/ocimum-basilicum.jpg"), true);
    assert.equal(existsSync("public/products/plant/plants/nerium-oleander/index.html"), true);
    assert.equal(existsSync("deliverables/plant-guide.apk"), true);
    assert.equal(existsSync("public/plant-guide.html"), true);
    assert.match(readFileSync("public/plant-guide.html", "utf8").slice(0, 2000), new RegExp(`${PLANT_GUIDE_COUNT} نبات`));
  });
});
