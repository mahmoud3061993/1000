import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deliveryUrlForProduct,
  kashierConfigured,
  mergePaymentConfig,
  rewriteRetiredSiteUrl,
} from "../src/lib/config";
import { PLANT_DRIVE_URL } from "../src/lib/plant-guide";

describe("payment config merge", () => {
  it("uses admin-stored Instapay and falls wallet back to the same number", () => {
    const cfg = mergePaymentConfig({}, {
      instapay_number: "01017420379",
      instapay_name: "Mahmoud",
      kashier_mid: "MID-1-1",
      kashier_api_key: "secret",
      kashier_mode: "test",
    });
    assert.equal(cfg.instapay.number, "01017420379");
    assert.equal(cfg.wallet.number, "01017420379");
    assert.equal(cfg.wallet.name, "Mahmoud");
    assert.equal(cfg.kashier.mid, "MID-1-1");
    assert.equal(cfg.kashier.mode, "test");
    assert.equal(kashierConfigured(cfg.kashier), true);
    assert.equal(cfg.envOverrides.kashier, false);
  });

  it("lets environment variables override admin settings", () => {
    const cfg = mergePaymentConfig(
      {
        INSTAPAY_NUMBER: "01111111111",
        WALLET_NUMBER: "01555555555",
        WALLET_NAME: "Cash Wallet",
        KASHIER_MID: "MID-ENV",
        KASHIER_API_KEY: "env-key",
        KASHIER_MODE: "live",
      },
      {
        instapay_number: "01000000000",
        wallet_number: "01000000000",
        kashier_mid: "MID-DB",
        kashier_api_key: "db-key",
        kashier_mode: "test",
      }
    );
    assert.equal(cfg.instapay.number, "01111111111");
    assert.equal(cfg.wallet.number, "01555555555");
    assert.equal(cfg.wallet.name, "Cash Wallet");
    assert.equal(cfg.kashier.mid, "MID-ENV");
    assert.equal(cfg.kashier.apiKey, "env-key");
    assert.equal(cfg.kashier.mode, "live");
    assert.equal(cfg.envOverrides.instapay, true);
    assert.equal(cfg.envOverrides.wallet, true);
    assert.equal(cfg.envOverrides.kashier, true);
  });

  it("treats Kashier as not ready until both MID and API key exist", () => {
    const cfg = mergePaymentConfig({}, { kashier_mid: "MID-1-1" });
    assert.equal(kashierConfigured(cfg.kashier), false);
  });

  it("rewrites leftover mahmoudelkousy.online URLs onto the live domain", () => {
    assert.equal(
      rewriteRetiredSiteUrl("https://www.mahmoudelkousy.online"),
      "https://www.producthelpyou.online"
    );
    const cfg = mergePaymentConfig(
      {},
      {
        plant_delivery_url: "https://www.mahmoudelkousy.online/products/plant",
        product_delivery_url: "https://mahmoudelkousy.online/products/1000",
        arabity_delivery_url: "https://www.mahmoudelkousy.online/car",
      }
    );
    assert.equal(cfg.plantDeliveryUrl, PLANT_DRIVE_URL);
    assert.equal(cfg.deliveryUrl, "https://www.producthelpyou.online/products/1000");
    assert.equal(cfg.arabityDeliveryUrl, "https://drive.google.com/drive/u/0/folders/1g0QLdBay_9eWs_UWEHf2h5lU2tT57_3e");
  });

  it("delivers the plant guide from the Drive folder, not the live preview page", () => {
    const fallback = mergePaymentConfig({}, {});
    assert.equal(fallback.plantDeliveryUrl, PLANT_DRIVE_URL);
    const fromLivePage = mergePaymentConfig({
      PLANT_DELIVERY_URL: "https://www.producthelpyou.online/products/plant",
    });
    assert.equal(fromLivePage.plantDeliveryUrl, PLANT_DRIVE_URL);
    assert.equal(deliveryUrlForProduct("plant", fallback), PLANT_DRIVE_URL);
  });

  it("falls back to the store Instapay number when nothing is configured", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(cfg.instapay.number, "01017420379");
    assert.equal(cfg.wallet.number, "01017420379");
    assert.equal(cfg.kashier.mid, "MID-40746-226");
    assert.equal(cfg.kashier.mode, "live");
    assert.equal(kashierConfigured(cfg.kashier), false);
    assert.match(cfg.deliveryUrl, /drive\.google\.com/);
  });
});
