import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  kashierConfigured,
  mergePaymentConfig,
  rewriteRetiredSiteUrl,
} from "../src/lib/config";

describe("payment config merge", () => {
  it("uses admin-stored Instapay and Kashier when env is empty", () => {
    const cfg = mergePaymentConfig({}, {
      instapay_number: "01017420379",
      instapay_name: "Mahmoud",
      kashier_mid: "MID-1-1",
      kashier_api_key: "secret",
      kashier_mode: "test",
    });
    assert.equal(cfg.instapay.number, "01017420379");
    assert.equal(cfg.kashier.mid, "MID-1-1");
    assert.equal(cfg.kashier.mode, "test");
    assert.equal(kashierConfigured(cfg.kashier), true);
    assert.equal(cfg.envOverrides.kashier, false);
  });

  it("lets environment variables override admin settings", () => {
    const cfg = mergePaymentConfig(
      {
        INSTAPAY_NUMBER: "01111111111",
        KASHIER_MID: "MID-ENV",
        KASHIER_API_KEY: "env-key",
        KASHIER_MODE: "live",
      },
      {
        instapay_number: "01000000000",
        kashier_mid: "MID-DB",
        kashier_api_key: "db-key",
        kashier_mode: "test",
      }
    );
    assert.equal(cfg.instapay.number, "01111111111");
    assert.equal(cfg.kashier.mid, "MID-ENV");
    assert.equal(cfg.kashier.apiKey, "env-key");
    assert.equal(cfg.kashier.mode, "live");
    assert.equal(cfg.envOverrides.instapay, true);
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
      }
    );
    assert.equal(cfg.plantDeliveryUrl, "https://www.producthelpyou.online/products/plant");
    assert.equal(cfg.deliveryUrl, "https://www.producthelpyou.online/products/1000");
  });

  it("falls back to the store Instapay number when nothing is configured", () => {
    const cfg = mergePaymentConfig({}, {});
    assert.equal(cfg.instapay.number, "01017420379");
    assert.equal(cfg.kashier.mid, "MID-40746-226");
    assert.equal(cfg.kashier.mode, "live");
    assert.equal(kashierConfigured(cfg.kashier), false);
    assert.match(cfg.deliveryUrl, /drive\.google\.com/);
  });
});
