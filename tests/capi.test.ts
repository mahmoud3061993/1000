import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCapiPayload, hashUserData, normalizePhone, sha256 } from "../src/lib/capi";

describe("Meta CAPI payload", () => {
  it("normalizes Egyptian phone numbers to 20 prefix", () => {
    assert.equal(normalizePhone("01017420379"), "201017420379");
    assert.equal(normalizePhone("+20 101 742 0379"), "201017420379");
    assert.equal(normalizePhone("201017420379"), "201017420379");
  });

  it("hashes PII with sha256 and keeps fbp/ip raw", () => {
    const hashed = hashUserData({
      email: "  Test@Email.COM ",
      phone: "01017420379",
      firstName: "Mahmoud",
      ip: "1.2.3.4",
      fbp: "fb.1.123",
    });
    assert.deepEqual(hashed.em, [sha256("test@email.com")]);
    assert.deepEqual(hashed.ph, [sha256("201017420379")]);
    assert.equal(hashed.client_ip_address, "1.2.3.4");
    assert.equal(hashed.fbp, "fb.1.123");
  });

  it("sends Purchase with value, currency, content ids and event_id", () => {
    const payload = buildCapiPayload({
      eventName: "Purchase",
      eventId: "evt_1",
      eventTime: 1700000000,
      user: { email: "a@b.com" },
      customData: { value: 235, currency: "EGP", orderId: "ord_1" },
    });
    assert.equal(payload.event_name, "Purchase");
    assert.equal(payload.event_id, "evt_1");
    assert.equal(payload.action_source, "website");
    const custom = payload.custom_data as Record<string, unknown>;
    assert.equal(custom.value, 235);
    assert.equal(custom.currency, "EGP");
    assert.equal(custom.order_id, "ord_1");
    assert.deepEqual(custom.content_ids, ["1000"]);
  });
});
