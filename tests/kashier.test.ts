import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  formatKashierAmount,
  generateKashierOrderHash,
  isKashierSuccess,
  validateKashierCallbackSignature,
} from "../src/lib/kashier";

describe("Kashier hashing", () => {
  it("builds the official HMAC path with two-decimal amount", () => {
    const hash = generateKashierOrderHash({
      mid: "MID-00-00",
      orderId: "ord_1",
      amount: 235,
      currency: "EGP",
      secret: "test-secret",
    });
    const expected = generateKashierOrderHash({
      mid: "MID-00-00",
      orderId: "ord_1",
      amount: "235.00",
      currency: "EGP",
      secret: "test-secret",
    });
    assert.equal(hash, expected);
    assert.equal(hash.length, 64);
    assert.equal(formatKashierAmount(235), "235.00");
  });

  it("accepts SUCCESS and PAID statuses", () => {
    assert.equal(isKashierSuccess("SUCCESS"), true);
    assert.equal(isKashierSuccess("paid"), true);
    assert.equal(isKashierSuccess("FAILED"), false);
  });

  it("validates callback signatures using query order except signature/mode", () => {
    const secret = "api-key";
    const params = new URLSearchParams(
      "paymentStatus=SUCCESS&merchantOrderId=ord_1&orderId=k_1&amount=235.00&currency=EGP&mode=live"
    );
    const signed = "paymentStatus=SUCCESS&merchantOrderId=ord_1&orderId=k_1&amount=235.00&currency=EGP";
    const signature = createHmac("sha256", secret).update(signed).digest("hex");
    params.set("signature", signature);
    assert.equal(validateKashierCallbackSignature(params, secret), true);

    const forged = new URLSearchParams(params.toString());
    forged.set("paymentStatus", "FAILED");
    assert.equal(validateKashierCallbackSignature(forged, secret), false);
  });
});
