import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatOrderMessage } from "../src/lib/telegram";
import { canConfirmInstapay, canRejectInstapay } from "../src/lib/orders";

function order(patch: Record<string, unknown> = {}) {
  return {
    id: "ord_1",
    session_id: "s1",
    name: "محمود",
    email: "m@test.com",
    phone: "01017420379",
    amount: 235,
    currency: "EGP",
    payment_method: "instapay",
    status: "pending_review",
    kashier_order_id: null,
    kashier_transaction_id: null,
    instapay_screenshot: "/tmp/s.jpg",
    purchase_event_id: "evt",
    fbp: null,
    fbc: null,
    ip: null,
    user_agent: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paid_at: null,
    ...patch,
  };
}

describe("admin order actions and mobile alerts", () => {
  it("keeps Instapay orders pending until admin confirms", () => {
    const pending = order({ status: "pending_review", payment_method: "instapay" });
    assert.equal(canConfirmInstapay(pending), true);
    assert.equal(canRejectInstapay(pending), true);
    assert.equal(canConfirmInstapay(order({ status: "paid" })), false);
    assert.equal(
      canConfirmInstapay(order({ payment_method: "kashier", status: "awaiting_payment" })),
      false
    );
  });

  it("formats Arabic Telegram alerts for trying/paid/pending", () => {
    const paid = formatOrderMessage(
      "paid",
      order({ status: "paid", payment_method: "kashier" })
    );
    assert.match(paid, /تم الدفع بنجاح/);
    assert.match(paid, /كاشير/);
    const pending = formatOrderMessage("pending", order({}));
    assert.match(pending, /إنستاباي/);
    assert.match(pending, /01017420379/);
  });
});
